import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import ResendProvider from 'next-auth/providers/resend';
import pool from './db';

export const { handlers, auth } = NextAuth({
  trustHost: true,
  adapter: PostgresAdapter(pool),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    ResendProvider({
      from: 'onboarding@resend.dev',
      apiKey: process.env.RESEND_API_KEY,
      async sendVerificationRequest({ identifier: email, url }) {
        console.log("🔥 SEND EMAIL TRIGGERED", email);

        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
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

        console.log("✅ RESEND RESULT:", result);
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
});