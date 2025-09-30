import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      clientId: process.env.SPOTIFY_CLIENT_ID,
    });
  } catch (error) {
    console.error('Error getting Spotify config:', error);
    return NextResponse.json(
      { error: 'Failed to get Spotify config' },
      { status: 500 }
    );
  }
}
