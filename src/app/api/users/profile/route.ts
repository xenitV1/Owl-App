import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

// Helper function to decode base64 strings that may contain Unicode
const decodeFromBase64 = (str: string): string => {
  try {
    // Try standard atob first
    return atob(str);
  } catch (e) {
    // If it fails, decode as UTF-8 bytes
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let effectiveEmail: string | null = session?.user?.email ?? null;

    // If no NextAuth session, try Firebase token
    if (!effectiveEmail) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decodedToken = await verifyIdToken(token);
          effectiveEmail = decodedToken.email ?? null;
        } catch (error) {
          console.error('Invalid Firebase token:', error);
        }
      }
    }

    // Development fallback
    if (!effectiveEmail && process.env.NODE_ENV !== 'production') {
      const headerEmail = request.headers.get('x-user-email');
      if (headerEmail) effectiveEmail = decodeFromBase64(headerEmail);
    }
    
    if (!effectiveEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: effectiveEmail },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        bio: true,
        isVerified: true,
        theme: true,
        fontSize: true,
        createdAt: true,
      },
    });

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        const name = request.headers.get('x-user-name') ? decodeFromBase64(request.headers.get('x-user-name')!) : effectiveEmail.split('@')[0];
        const created = await db.user.create({
          data: { email: effectiveEmail, name, role: 'STUDENT' }
        });
        return NextResponse.json(created);
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let effectiveEmail: string | null = session?.user?.email ?? null;

    // If no NextAuth session, try Firebase token
    if (!effectiveEmail) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decodedToken = await verifyIdToken(token);
          effectiveEmail = decodedToken.email ?? null;
        } catch (error) {
          console.error('Invalid Firebase token:', error);
        }
      }
    }

    // Development fallback
    if (!effectiveEmail && process.env.NODE_ENV !== 'production') {
      const headerEmail = request.headers.get('x-user-email');
      if (headerEmail) effectiveEmail = decodeFromBase64(headerEmail);
    }
    
    if (!effectiveEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: effectiveEmail },
    });

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        const name = request.headers.get('x-user-name') ? decodeFromBase64(request.headers.get('x-user-name')!) : effectiveEmail.split('@')[0];
        const created = await db.user.create({ data: { email: effectiveEmail, name, role: 'STUDENT' } });
        return NextResponse.json(created);
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    const { name, bio, school, grade, favoriteSubject, role, avatar, emailNotifications, pushNotifications } = await request.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio;
    if (school !== undefined) updateData.school = school;
    if (grade !== undefined) updateData.grade = grade;
    if (favoriteSubject !== undefined) updateData.favoriteSubject = favoriteSubject;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        bio: true,
        isVerified: true,
        theme: true,
        fontSize: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}