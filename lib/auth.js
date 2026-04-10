import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import ResendProvider from "next-auth/providers/resend";

console.log("AUTH CONFIG LOADED");

const config = {
  trustHost: true,
  debug: true,

  adapter: PostgresAdapter({
    connectionString: process.env.DATABASE_URL,
  }),

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    ResendProvider({
      from: process.env.EMAIL_FROM,
      apiKey: process.env.RESEND_API_KEY,
      maxAge: 24 * 60 * 60,
    }),
  ],

  events: {
    async createVerificationToken(message) {
      console.log("TOKEN CREATED:", message);
    },
  },

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