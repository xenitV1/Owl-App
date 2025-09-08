import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action') || '';
    const adminId = searchParams.get('adminId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (adminId) {
      where.adminId = adminId;
    }

    // Get activity logs with admin info
    const logs = await db.adminActivityLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Transform logs for frontend
    const transformedLogs = logs.map(log => ({
      id: log.id,
      action: log.action.replace(/_/g, ' ').toLowerCase(),
      targetType: log.targetType.toLowerCase(),
      targetId: log.targetId,
      adminName: log.admin.name,
      timestamp: log.createdAt,
      details: log.details
    }));

    // Get total count for pagination
    const total = await db.adminActivityLog.count({ where });

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await db.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true, id: true, name: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { action, targetType, targetId, details } = await request.json();

    if (!action || !targetType || !targetId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create activity log
    const log = await db.adminActivityLog.create({
      data: {
        action: action.toUpperCase(),
        targetType: targetType.toUpperCase(),
        targetId,
        adminId: admin.id,
        details: details || `${admin.name} performed ${action} on ${targetType} ${targetId}`
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Activity logged successfully',
      log: {
        id: log.id,
        action: log.action.replace(/_/g, ' ').toLowerCase(),
        targetType: log.targetType.toLowerCase(),
        targetId: log.targetId,
        adminName: log.admin.name,
        timestamp: log.createdAt,
        details: log.details
      }
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}