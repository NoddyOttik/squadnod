// lib/auth.js
import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import Resend from 'next-auth/providers/resend';
import pool from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PostgresAdapter(pool),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Resend({
      from: 'onboarding@resend.dev',
      apiKey: process.env.RESEND_API_KEY,
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const { Resend: ResendClient } = await import('resend');
        const resend = new ResendClient(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: provider.from,
          to: email,
          subject: 'Confirm your email for Squad',
          html: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:40px 20px;">
              <h1 style="font-size:28px;font-weight:800;margin-bottom:8px;">Squad</h1>
              <p style="color:#666;margin-bottom:32px;">Chat and play games with friends</p>
              <a href="${url}"
                style="display:inline-block;background:#6c5ce7;color:white;
                       text-decoration:none;padding:14px 28px;border-radius:12px;
                       font-weight:700;font-size:15px;">
                Confirm email & continue
              </a>
              <p style="color:#999;font-size:12px;margin-top:24px;">
                This link expires in 24 hours. If you didn't request this, ignore it.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = String(user.id);
        token.name = user.name ?? null;
      }
      if (trigger === 'update' && session?.name != null) {
        token.name = session.name;
      }

      // If the JWT has no display name yet, load it from the database so sessions
      // stay in sync after setup (or if update() did not refresh the token).
      const sub = token.sub;
      const nameMissing =
        sub != null &&
        String(sub) !== '' &&
        (token.name == null ||
          (typeof token.name === 'string' && token.name.trim() === ''));
      if (nameMissing) {
        const uid = Number.parseInt(String(sub), 10);
        if (Number.isFinite(uid)) {
          try {
            const { rows } = await pool.query(
              'SELECT name FROM users WHERE id = $1',
              [uid]
            );
            const dbName = rows[0]?.name;
            if (typeof dbName === 'string' && dbName.trim() !== '') {
              token.name = dbName.trim();
            }
          } catch {
            /* ignore */
          }
        }
      }

      return token;
    },
    async session({ session, user, token }) {
      const normalizeName = (n) => {
        if (n == null) return null;
        if (typeof n === 'string') {
          const t = n.trim();
          return t === '' ? null : t;
        }
        return n;
      };

      if (user && session.user) {
        session.user.id = user.id;
        session.user.name = normalizeName(user.name);
      } else if (session.user && token) {
        session.user.id = token.sub ?? session.user.id;
        session.user.name = normalizeName(token.name);
      }
      return session;
    },
  },
});
