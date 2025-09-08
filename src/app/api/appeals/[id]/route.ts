import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
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

    // Only admins can update appeals
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { status, decision } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get the appeal
    const appeal = await db.appeal.findUnique({
      where: { id },
      include: {
        user: true,
        report: true
      }
    });

    if (!appeal) {
      return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // Update the appeal
    const updatedAppeal = await db.appeal.update({
      where: { id },
      data: {
        status,
        reviewedBy: user.id,
        decision: decision || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        report: {
          select: {
            id: true,
            type: true,
            reason: true,
            status: true,
            resolution: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Notify the user about the appeal decision
    await db.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Appeal Decision',
        message: `Your appeal for report #${appeal.reportId} has been ${status.toLowerCase()}. ${decision ? 'Decision: ' + decision : ''}`,
        userId: appeal.userId
      }
    });

    // If appeal is approved, potentially reverse the moderation action
    if (status === 'APPROVED') {
      // This is where you would implement logic to reverse actions
      // For example, restoring deleted content, reversing suspensions, etc.
      // This would depend on the specific moderation actions taken
      console.log(`Appeal approved for report ${appeal.reportId}. Consider reversing moderation actions.`);
    }

    return NextResponse.json({ 
      message: 'Appeal updated successfully',
      appeal: updatedAppeal 
    });

  } catch (error) {
    console.error('Error updating appeal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
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

    // Only admins can delete appeals
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.appeal.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Appeal deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting appeal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}