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
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
};

// ✅ correct export
export const { handlers, auth } = NextAuth(config);