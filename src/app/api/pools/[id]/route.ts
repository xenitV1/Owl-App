import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { categoryId } = await request.json();

    // Check if pool exists and belongs to user
    const existingPool = await db.pool.findFirst({
      where: {
        postId: params.id,
        userId: user.id
      }
    });

    if (!existingPool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      );
    }

    // Check if category exists and belongs to user (if provided)
    if (categoryId) {
      const category = await db.poolCategory.findFirst({
        where: {
          id: categoryId,
          userId: user.id
        }
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Update the pool
    const updatedPool = await db.pool.update({
      where: { id: existingPool.id },
      data: {
        categoryId: categoryId || null
      },
      include: {
        category: true,
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                school: true,
                grade: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                pools: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedPool);
  } catch (error) {
    console.error('Error updating pool:', error);
    return NextResponse.json(
      { error: 'Failed to update pool' },
      { status: 500 }
    );
  }
}