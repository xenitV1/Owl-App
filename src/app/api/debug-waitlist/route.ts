import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Waitlist API - Database connection test');
    
    // Test database connection
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Test waitlist table
    const waitlistCount = await db.waitlist.count();
    console.log('📊 Waitlist table count:', waitlistCount);
    
    // Get all waitlist entries
    const waitlistEntries = await db.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📋 Recent waitlist entries:', waitlistEntries);
    
    return NextResponse.json({
      success: true,
      message: 'Debug info retrieved',
      data: {
        databaseConnected: true,
        waitlistCount,
        recentEntries: waitlistEntries,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        directUrl: process.env.DIRECT_URL ? 'Set' : 'Not set'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug Waitlist API Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      directUrl: process.env.DIRECT_URL ? 'Set' : 'Not set'
    }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
