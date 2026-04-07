import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import ResendProvider from "next-auth/providers/resend";
import pool from './db';

const config = {
  trustHost: true,
  adapter: PostgresAdapter(pool),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  // ✅ THIS WAS MISSING
  providers: [
    ResendProvider({
      from: "onboarding@resend.dev",
      apiKey: process.env.RESEND_API_KEY,
  
      async sendVerificationRequest({ identifier: email, url }) {
        console.log("🔥 SEND EMAIL TRIGGERED", email);
  
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
  
        const result = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Confirm your email for Squad",
          html: `<a href="${url}">Login</a>`,
        });
  
        console.log("✅ RESEND RESULT:", result);
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
};

// ✅ correct export
export const { handlers, auth } = NextAuth(config);