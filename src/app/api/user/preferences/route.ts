import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      // Silently no-op for unauthenticated users to avoid breaking UX
      return new NextResponse(null, { status: 204 });
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

    const { theme, fontSize } = await request.json();

    const updateData: any = {};
    if (theme) updateData.theme = theme;
    if (fontSize) updateData.fontSize = fontSize;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      theme: updatedUser.theme,
      fontSize: updatedUser.fontSize,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      // For unauthenticated users, return empty object to avoid overriding client theme
      return NextResponse.json({});
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        theme: true,
        fontSize: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      theme: user.theme,
      fontSize: user.fontSize,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}