import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Allowed sound files for system use
const ALLOWED_SOUNDS = [
  'button-click.mp3',
  'card-add.mp3',
  'card-delete.mp3',
  'comment-button.mp3',
  'connection-add.mp3',
  'connection-remove.mp3',
  'like-button.mp3',
  'lock.mp3',
  'notification-received.mp3',
  'pomodoro-complete.mp3',
  'pomodoro-start.mp3',
  'pool-vote.mp3',
  'unlock.mp3'
];

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    // Validate filename
    if (!filename || !ALLOWED_SOUNDS.includes(filename)) {
      return new NextResponse('Sound file not found', { status: 404 });
    }

    // Check if user is authenticated (optional - can be removed if sounds should be available to all users)
    // This adds an extra layer of protection
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent');
    
    // Basic protection: only allow requests from the application
    // You can enhance this with proper authentication if needed
    if (!userAgent || userAgent.includes('curl') || userAgent.includes('wget')) {
      return new NextResponse('Forbidden: Direct download not allowed', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'sounds', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return new NextResponse('Sound file not found', { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        // Prevent direct linking/downloading
        'Content-Disposition': 'inline',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });

  } catch (error) {
    console.error('Error serving sound file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Block other HTTP methods
export async function POST() {
  return new NextResponse('Method not allowed', { status: 405 });
}

export async function PUT() {
  return new NextResponse('Method not allowed', { status: 405 });
}

export async function DELETE() {
  return new NextResponse('Method not allowed', { status: 405 });
}
