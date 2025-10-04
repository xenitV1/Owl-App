import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * NOTE: Theme and fontSize preferences are now managed client-side using IndexedDB
 * for better performance and offline support. These endpoints return empty responses
 * to maintain backward compatibility but no longer interact with the database.
 * 
 * See: ThemeContext.tsx and indexedDB.ts for the new implementation
 */

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      // Silently no-op for unauthenticated users to avoid breaking UX
      return new NextResponse(null, { status: 204 });
    }

    // Theme and fontSize are now managed client-side via IndexedDB
    // Return success without database operation
    await request.json(); // Consume the body to avoid warnings
    
    return NextResponse.json({
      message: 'Preferences are now managed client-side via IndexedDB'
    });
  } catch (error) {
    console.error('Error in preferences endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      // For unauthenticated users, return empty object
      return NextResponse.json({});
    }

    // Theme and fontSize are now managed client-side via IndexedDB
    // Return empty object to let client handle defaults
    return NextResponse.json({});
  } catch (error) {
    console.error('Error in preferences endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}