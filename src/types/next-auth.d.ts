import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session user types to include the id field.
   * This makes the user id available in the session object.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  /**
   * Extends the JWT token to include the id field.
   * This allows the id to be passed from the JWT to the session.
   */
  interface JWT {
    id: string;
  }
}