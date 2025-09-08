import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const recommended = searchParams.get('recommended') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Handle recommended users
    if (recommended) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized to get recommendations' },
          { status: 401 }
        );
      }

      const currentUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          school: true,
          grade: true,
          favoriteSubject: true,
        },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'Current user not found' },
          { status: 404 }
        );
      }

      // Get users that current user is not following
      const followingIds = await db.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });

      const excludedIds = [currentUser.id, ...followingIds.map(f => f.followingId)];

      // Find users with similar interests
      const recommendedUsers = await db.user.findMany({
        where: {
          id: {
            notIn: excludedIds,
          },
          OR: [
            {
              school: currentUser.school,
            },
            {
              grade: currentUser.grade,
            },
            {
              favoriteSubject: currentUser.favoriteSubject,
            },
          ],
          role: 'STUDENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: [
          {
            posts: {
              _count: 'desc',
            },
          },
          {
            followers: {
              _count: 'desc',
            },
          },
        ],
        take: limit,
      });

      return NextResponse.json({
        users: recommendedUsers,
      });
    }

    // Handle single user lookup
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    let user;
    
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
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
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
              pools: true,
              followers: true,
              following: true,
            },
          },
        },
      });
      // Dev fallback: if not found by id, try header email and create if necessary
      if (!user && process.env.NODE_ENV !== 'production') {
        const headerEmail = request.headers.get('x-user-email') ? decodeFromBase64(request.headers.get('x-user-email')!) : null;
        const headerName = request.headers.get('x-user-name') ? decodeFromBase64(request.headers.get('x-user-name')!) : (headerEmail?.split('@')[0]);
        if (headerEmail) {
          user = await db.user.upsert({
            where: { email: headerEmail },
            create: { email: headerEmail, name: headerName || 'User', role: 'STUDENT' },
            update: {},
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
              createdAt: true,
              _count: {
                select: {
                  posts: true,
                  comments: true,
                  likes: true,
                  pools: true,
                  followers: true,
                  following: true,
                },
              },
            },
          });
        }
      }
    } else {
      user = await db.user.findUnique({
        where: { email: email! },
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
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
              pools: true,
              followers: true,
              following: true,
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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

    const { name, school, grade, favoriteSubject, bio, role, avatar } = await request.json();

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(school !== undefined && { school }),
        ...(grade !== undefined && { grade }),
        ...(favoriteSubject !== undefined && { favoriteSubject }),
        ...(bio !== undefined && { bio }),
        ...(role !== undefined && { role }),
        ...(avatar !== undefined && { avatar }),
      },
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
        createdAt: true,
        updatedAt: true,
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