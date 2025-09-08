import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, reason, description } = body;

    if (!reportId || !reason || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the report
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        moderationActions: true,
        appeals: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if the report is resolved (only resolved reports can be appealed)
    if (report.status !== 'RESOLVED') {
      return NextResponse.json({ error: 'Only resolved reports can be appealed' }, { status: 400 });
    }

    // Check if user already has an appeal for this report
    if (report.appeals.length > 0) {
      return NextResponse.json({ error: 'You have already submitted an appeal for this report' }, { status: 400 });
    }

    // Check if the user is the target of the report
    const isTarget = report.targetId === user.id;
    
    // Only the target user or admins can create appeals
    if (!isTarget && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the target user or admins can create appeals' }, { status: 403 });
    }

    // Create the appeal
    const appeal = await db.appeal.create({
      data: {
        reportId,
        userId: user.id,
        reason,
        description,
        status: 'PENDING'
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
        }
      }
    });

    // Notify admins about the new appeal
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          type: 'SYSTEM',
          title: 'New Appeal Submitted',
          message: `A new appeal has been submitted for report #${reportId}`,
          userId: admin.id
        }
      });
    }

    return NextResponse.json({ 
      message: 'Appeal submitted successfully',
      appeal 
    });

  } catch (error) {
    console.error('Error creating appeal:', error);
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

    // Only admins can view all appeals
    if (user.role !== 'ADMIN') {
      // Regular users can only view their own appeals
      const appeals = await db.appeal.findMany({
        where: { userId: user.id },
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
              resolution: true,
              createdAt: true
            }
          },
          reviewer: {
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

      return NextResponse.json({ appeals });
    }

    // Admins can view all appeals
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const appeals = await db.appeal.findMany({
      where,
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
            resolution: true,
            createdAt: true
          }
        },
        reviewer: {
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

    return NextResponse.json({ appeals });

  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}