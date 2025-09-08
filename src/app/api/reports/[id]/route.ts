import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ReportStatus, ModerationActionType } from '@prisma/client';

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
        resolvedAt: status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED ? new Date() : null
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
      if (report.postId && (action === ModerationActionType.POST_REMOVAL || action === ModerationActionType.CONTENT_REMOVAL)) {
        targetId = report.postId;
        targetType = 'POST';
      } else if (report.commentId && (action === ModerationActionType.COMMENT_REMOVAL || action === ModerationActionType.CONTENT_REMOVAL)) {
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
      if (action === ModerationActionType.POST_REMOVAL && report.postId) {
        await db.post.delete({
          where: { id: report.postId }
        });
      } else if (action === ModerationActionType.COMMENT_REMOVAL && report.commentId) {
        await db.comment.delete({
          where: { id: report.commentId }
        });
      }
    }

    // Notify the reporter about the resolution
    if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
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