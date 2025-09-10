import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
// Import types as string literals to avoid TypeScript cache issues
type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
type ModerationActionType = 'WARNING' | 'CONTENT_REMOVAL' | 'ACCOUNT_SUSPENSION' | 'ACCOUNT_BAN' | 'COMMENT_REMOVAL' | 'POST_REMOVAL' | 'TEMPORARY_SUSPENSION';

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

    // Only admins can update reports
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { status, assignedTo, resolution, action, actionReason } = body;

    // Get the report
    const report = await db.report.findUnique({
      where: { id: params.id },
      include: {
        post: true,
        comment: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update the report
    const updatedReport = await db.report.update({
      where: { id: params.id },
      data: {
        status: status || report.status,
        assignedTo: assignedTo || report.assignedTo,
        resolution: resolution || report.resolution,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create moderation action if specified
    if (action && actionReason) {
      let targetId = report.targetId;
      let targetType = report.targetType;

      // If action is on post or comment, use those IDs
      if (report.postId && (action === 'POST_REMOVAL' || action === 'CONTENT_REMOVAL')) {
        targetId = report.postId;
        targetType = 'POST';
      } else if (report.commentId && (action === 'COMMENT_REMOVAL' || action === 'CONTENT_REMOVAL')) {
        targetId = report.commentId;
        targetType = 'COMMENT';
      }

      await db.moderationAction.create({
        data: {
          type: action,
          targetId,
          targetType,
          reason: actionReason,
          moderatorId: user.id,
          reportId: report.id
        }
      });

      // Execute the action
      if (action === 'POST_REMOVAL' && report.postId) {
        // Delete the post and its associated image in a transaction
        await db.$transaction(async (tx) => {
          // Delete the image associated with this post (if exists)
          await tx.postImage.deleteMany({
            where: { postId: report.postId! },
          });
          
          // Delete the post itself (this will cascade delete related data like likes, comments due to foreign key constraints)
          await tx.post.delete({
            where: { id: report.postId! }
          });
        });
      } else if (action === 'COMMENT_REMOVAL' && report.commentId) {
        await db.comment.delete({
          where: { id: report.commentId }
        });
      }
    }

    // Notify the reporter about the resolution
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      await db.notification.create({
        data: {
          type: 'SYSTEM',
          title: 'Report Update',
          message: `Your report has been ${status.toLowerCase()}. ${resolution ? 'Reason: ' + resolution : ''}`,
          userId: report.reporterId
        }
      });
    }

    return NextResponse.json({ 
      message: 'Report updated successfully',
      report: updatedReport 
    });

  } catch (error) {
    console.error('Error updating report:', error);
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

    // Only admins can delete reports
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.report.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Report deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}