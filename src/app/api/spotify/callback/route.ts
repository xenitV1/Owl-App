import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/spotify-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Use consistent base URL (127.0.0.1, not localhost)
    const baseUrl = getBaseUrl();

    if (error) {
      console.error('Spotify authorization error:', error);
      return NextResponse.redirect(
        new URL('/work-environment?spotify_error=access_denied', baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/work-environment?spotify_error=missing_code', baseUrl)
      );
    }

    // Redirect to work environment with the authorization code
    // The client will handle the token exchange
    const redirectUrl = new URL('/work-environment', baseUrl);
    redirectUrl.searchParams.set('spotify_code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    console.log('[Spotify Callback] Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(
      new URL('/work-environment?spotify_error=callback_error', getBaseUrl())
    );
  }
}
