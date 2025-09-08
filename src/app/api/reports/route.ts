import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ReportType, ReportPriority } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      reason,
      description,
      targetId,
      targetType,
      postId,
      commentId,
      evidence
    } = body;

    // Validate required fields
    if (!type || !reason || !targetId || !targetType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine priority based on report type
    let priority: ReportPriority = ReportPriority.MEDIUM;
    switch (type) {
      case ReportType.THREATS:
      case ReportType.HARASSMENT:
      case ReportType.BULLYING:
        priority = ReportPriority.HIGH;
        break;
      case ReportType.HATE_SPEECH:
      case ReportType.PERSONAL_INFO:
      case ReportType.IMPERSONATION:
      case ReportType.SCAM:
        priority = ReportPriority.URGENT;
        break;
      default:
        priority = ReportPriority.MEDIUM;
    }

    // Create the report
    const report = await db.report.create({
      data: {
        type,
        reason,
        description,
        priority,
        evidence,
        reporterId: user.id,
        targetId,
        targetType,
        postId,
        commentId
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for admins if high priority
    if (priority === ReportPriority.HIGH || priority === ReportPriority.URGENT) {
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' }
      });

      for (const admin of admins) {
        await db.notification.create({
          data: {
            type: 'SYSTEM',
            title: 'New Urgent Report',
            message: `A new ${priority.toLowerCase()} priority report has been submitted: ${reason}`,
            userId: admin.id
          }
        });
      }
    }

    return NextResponse.json({ 
      message: 'Report submitted successfully',
      report 
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Only admins can view all reports
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');

    const where: any = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    const reports = await db.report.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}