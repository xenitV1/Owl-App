import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await db.$connect();
    console.log('Database connected successfully');
    
    // Test user table query
    const userCount = await db.user.count();
    console.log('User count:', userCount);
    
    // Test post table query
    const postCount = await db.post.count();
    console.log('Post count:', postCount);
    
    await db.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      postCount
    });
  } catch (error) {
    console.error('Database test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}