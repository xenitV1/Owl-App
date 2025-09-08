import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Note: Using string literals to avoid Prisma client issues
type FilterType = 'KEYWORD' | 'PATTERN' | 'URL' | 'EMAIL' | 'PHONE';
type FilterAction = 'FLAG' | 'BLOCK' | 'REMOVE' | 'ESCALATE';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can view content filters
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const filters = await db.contentFilter.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ filters });

  } catch (error) {
    console.error('Error fetching content filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can create content filters
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { type, pattern, action, isActive, description } = body;

    // Validate required fields
    if (!type || !pattern || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the filter
    const filter = await db.contentFilter.create({
      data: {
        type,
        pattern,
        action,
        isActive: isActive ?? true,
        description: description || undefined
      }
    });

    return NextResponse.json({ 
      message: 'Content filter created successfully',
      filter 
    });

  } catch (error) {
    console.error('Error creating content filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}