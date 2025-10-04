import { NextAuthOptions } from 'next-auth';
import { db } from '@/lib/db';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        // Create or update user in database when they sign in
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user
            const newUser = await db.user.create({
              data: {
                id: user.id,
                email: user.email!,
                name: user.name || user.email!.split('@')[0],
                avatar: user.image,
                role: 'STUDENT', // Default role
              },
            });
            console.log('Created new user:', newUser.email);
          } else {
            // Update existing user with latest info
            await db.user.update({
              where: { email: user.email! },
              data: {
                name: user.name || existingUser.name,
                avatar: user.image || existingUser.avatar,
              },
            });
          }
        } catch (error) {
          console.error('Error creating/updating user in JWT callback:', error);
          // Continue with authentication even if database update fails
        }
      }
      // Persist Google access token
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;

        // Add user profile information from database to session
        // This prevents additional database calls in API routes
        try {
          const userProfile = await db.user.findUnique({
            where: { email: session.user.email! },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
              school: true,
              grade: true,
              favoriteSubject: true,
              bio: true,
              isVerified: true,
              createdAt: true,
            },
          });

          if (userProfile) {
            (session as any).user = {
              ...session.user,
              ...userProfile,
            };
          }
        } catch (error) {
          console.error('Error fetching user profile for session:', error);
          // Continue without user profile data
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};