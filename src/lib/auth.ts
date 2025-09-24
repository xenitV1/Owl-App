import { NextAuthOptions } from 'next-auth';
import { db } from '@/lib/db';
import GoogleProvider from 'next-auth/providers/google';
import SpotifyProvider from 'next-auth/providers/spotify';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'user-read-email user-read-private playlist-read-private user-library-read user-top-read',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Persist provider access tokens
      if (account?.provider === 'spotify') {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyAccessTokenExpires = (account.expires_at || 0) * 1000;
      } else if (account) {
        token.accessToken = account.access_token;
      }

      // Refresh Spotify token if expired
      const now = Date.now();
      if (
        (token as any).spotifyAccessToken &&
        (token as any).spotifyAccessTokenExpires &&
        now > (token as any).spotifyAccessTokenExpires - 60_000 &&
        (token as any).spotifyRefreshToken
      ) {
        try {
          const params = new URLSearchParams();
          params.set('grant_type', 'refresh_token');
          params.set('refresh_token', (token as any).spotifyRefreshToken as string);
          const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID!}:${process.env.SPOTIFY_CLIENT_SECRET!}`).toString('base64');
          const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${basic}`,
            },
            body: params,
          });
          if (res.ok) {
            const data = await res.json();
            (token as any).spotifyAccessToken = data.access_token;
            (token as any).spotifyAccessTokenExpires = now + data.expires_in * 1000;
            if (data.refresh_token) (token as any).spotifyRefreshToken = data.refresh_token;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session as any).spotifyAccessToken = (token as any).spotifyAccessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};