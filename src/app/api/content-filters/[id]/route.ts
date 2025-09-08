import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
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

    // Only admins can update content filters
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { type, pattern, action, isActive, description } = body;

    // Update the filter
    const filter = await db.contentFilter.update({
      where: { id: params.id },
      data: {
        type: type !== undefined ? type : undefined,
        pattern: pattern !== undefined ? pattern : undefined,
        action: action !== undefined ? action : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        description: description !== undefined ? description : undefined
      }
    });

    return NextResponse.json({ 
      message: 'Content filter updated successfully',
      filter 
    });

  } catch (error) {
    console.error('Error updating content filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can delete content filters
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.contentFilter.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Content filter deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting content filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}