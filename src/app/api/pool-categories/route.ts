import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
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

    const categories = await db.poolCategory.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { pools: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching pool categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pool categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
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

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const existingCategory = await db.poolCategory.findFirst({
      where: {
        userId: user.id,
        name: name
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const category = await db.poolCategory.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        icon: icon || 'Bookmark',
        userId: user.id
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating pool category:', error);
    return NextResponse.json(
      { error: 'Failed to create pool category' },
      { status: 500 }
    );
  }
}