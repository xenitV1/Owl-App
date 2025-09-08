import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
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

    const category = await db.poolCategory.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        pools: {
          include: {
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
        },
        _count: {
          select: { pools: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching pool category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pool category' },
      { status: 500 }
    );
  }
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

    const { name, description, color, icon } = await request.json();

    // Check if category exists and belongs to user
    const existingCategory = await db.poolCategory.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing categories
    if (name && name !== existingCategory.name) {
      const nameConflict = await db.poolCategory.findFirst({
        where: {
          userId: user.id,
          name: name,
          id: { not: params.id }
        }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await db.poolCategory.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(icon && { icon })
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating pool category:', error);
    return NextResponse.json(
      { error: 'Failed to update pool category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if category exists and belongs to user
    const existingCategory = await db.poolCategory.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Remove category from pools (set categoryId to null)
    await db.pool.updateMany({
      where: { categoryId: params.id },
      data: { categoryId: null }
    });

    // Delete the category
    await db.poolCategory.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pool category:', error);
    return NextResponse.json(
      { error: 'Failed to delete pool category' },
      { status: 500 }
    );
  }
}