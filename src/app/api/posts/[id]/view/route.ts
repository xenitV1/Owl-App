import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import apiDebugLogger, { withApiDebug } from '@/lib/apiDebug';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const timer = apiDebugLogger.startTimer(`POST /api/posts/${resolvedParams.id}/view`);
  const logEntry = await apiDebugLogger.logRequest(request);
  
  try {
    const { id } = resolvedParams;
    
    if (!id) {
      apiDebugLogger.logResponse(logEntry, 400, { error: 'Post ID is required' });
      timer();
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Increment the view count for the post
    const updatedPost = await db.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      viewCount: updatedPost.viewCount,
    });

    apiDebugLogger.logResponse(logEntry, 200, {
      postId: id,
      newViewCount: updatedPost.viewCount,
    });
    
    timer();
    return response;
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error('Error incrementing post view count:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}
