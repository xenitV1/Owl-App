import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyRedirectUri } from '@/lib/spotify-config';

export async function POST(request: NextRequest) {
  try {
    // No session check needed - Spotify auth is independent from platform auth
    
    // Get Spotify authorization code from request body
    const { code, state } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Get redirect URI from centralized config
    const redirectUri = getSpotifyRedirectUri();
    
    console.log('[Spotify Auth] Exchanging code for token');
    console.log('[Spotify Auth] Redirect URI:', redirectUri);
    console.log('[Spotify Auth] Code:', code.substring(0, 20) + '...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Spotify Auth] Token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code', details: errorData },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('[Spotify Auth] Token received successfully');

    // Return token data to client for localStorage storage
    return NextResponse.json(tokenData);
    
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
