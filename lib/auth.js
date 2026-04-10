import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import ResendProvider from "next-auth/providers/resend";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

const config = {
  trustHost: true,

  adapter: PostgresAdapter(pool),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    ResendProvider({
      from: process.env.EMAIL_FROM,
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
};

export const { handlers, auth } = NextAuth(config);