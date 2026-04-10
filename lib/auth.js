import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import Resend from 'next-auth/providers/resend';
import pool from './db';

console.log('AUTH CONFIG LOADED');

const config = {
  trustHost: true,
  debug: true,

  // @auth/pg-adapter expects a pg Pool (see index.d.ts), not a plain options object
  adapter: PostgresAdapter(pool),

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],

  logger: {
    error(code, metadata) {
      console.error("AUTH ERROR:", code, metadata);
    },
    warn(code) {
      console.warn("AUTH WARN:", code);
    },
    debug(code, metadata) {
      console.log("AUTH DEBUG:", code, metadata);
    },
  },

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
};

export const { handlers, auth } = NextAuth(config);