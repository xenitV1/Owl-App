import { NextRequest, NextResponse } from 'next/server';
import { createSecurityHandler } from '@/lib/security';

async function handleUserDataExport(request: NextRequest, userId: string) {
  try {
    // In a real implementation, this would query your database for all user data
    const userData = {
      profile: {
        id: userId,
        email: 'user@example.com', // Would come from database
        displayName: 'John Doe',
        school: 'Example University',
        grade: 'University',
        bio: 'Computer Science student',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      },
      posts: [
        {
          id: 'post-1',
          title: 'Study Guide: Calculus',
          content: 'Comprehensive calculus study guide...',
          subject: 'Mathematics',
          createdAt: '2024-01-10T00:00:00Z',
          likes: 15,
          comments: 3,
        },
      ],
      comments: [
        {
          id: 'comment-1',
          content: 'Great post! Very helpful.',
          postId: 'post-1',
          createdAt: '2024-01-11T00:00:00Z',
        },
      ],
      communities: [
        {
          id: 'community-1',
          name: 'Computer Science Students',
          role: 'member',
          joinedAt: '2024-01-05T00:00:00Z',
        },
      ],
      savedPosts: [
        {
          id: 'saved-1',
          postId: 'post-1',
          savedAt: '2024-01-12T00:00:00Z',
        },
      ],
      settings: {
        theme: 'light',
        fontSize: 'normal',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          allowMessages: true,
        },
      },
      activity: {
        lastLoginAt: '2024-01-15T10:30:00Z',
        loginCount: 25,
        postsCreated: 5,
        commentsMade: 12,
        likesGiven: 45,
      },
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        format: 'json',
        version: '1.0',
      },
    };

    // Create a downloadable file
    const filename = `owl_user_data_export_${userId}_${Date.now()}.json`;
    
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

export const POST = createSecurityHandler(
  handleUserDataExport,
  {
    requireAuth: true,
    allowedMethods: ['POST'],
  }
);