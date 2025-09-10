import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Helper function to decode base64 strings that may contain Unicode
const decodeFromBase64 = (str: string): string => {
  try {
    return atob(str);
  } catch (e) {
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
    const type = searchParams.get('type'); // 'posts', 'communities', 'users', 'trending', 'following'
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || undefined;
    const subject = searchParams.get('subject') || undefined;
    const communityId = searchParams.get('communityId') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const skip = (page - 1) * limit;

    // Get current user for following posts
    let currentUser: { id: string } | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
    }

    switch (type) {
      case 'posts':
        return await getPosts({ limit, skip, search, subject, communityId, userId, currentUser });
      
      case 'communities':
        return await getCommunities({ limit, skip, search });
      
      case 'users':
        return await getUsers({ limit, skip, search });
      
      case 'trending':
        return await getTrendingPosts({ limit, skip, subject });
      
      case 'following':
        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required for following posts' },
            { status: 401 }
          );
        }
        return await getFollowingPosts({ limit, skip, currentUser });
      
      case 'discover':
        return await getDiscoverContent({ limit, skip });
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: posts, communities, users, trending, following, discover' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching platform content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform content' },
      { status: 500 }
    );
  }
}

async function getPosts({ limit, skip, search, subject, communityId, userId, currentUser }: any) {
  const where: any = {
    isPublic: true,
  };

  if (subject) {
    where.subject = subject;
  }

  if (communityId) {
    where.communityId = communityId;
  }

  if (userId) {
    where.authorId = userId;
  }

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        content: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        subject: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const posts = await db.post.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          pools: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });

  const total = await db.post.count({ where });

  return NextResponse.json({
    type: 'posts',
    data: posts,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getCommunities({ limit, skip, search }: any) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const communities = await db.community.findMany({
    where,
    include: {
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });

  const total = await db.community.count({ where });

  return NextResponse.json({
    type: 'communities',
    data: communities,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getUsers({ limit, skip, search }: any) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { school: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
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
          followers: true,
          following: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });

  const total = await db.user.count({ where });

  return NextResponse.json({
    type: 'users',
    data: users,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getTrendingPosts({ limit, skip, subject }: any) {
  const where: any = {
    isPublic: true,
  };

  if (subject) {
    where.subject = subject;
  }

  const posts = await db.post.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          pools: true,
        },
      },
    },
    orderBy: [
      {
        likes: {
          _count: 'desc',
        },
      },
      {
        comments: {
          _count: 'desc',
        },
      },
      {
        createdAt: 'desc',
      },
    ],
    skip,
    take: limit,
  });

  const total = await db.post.count({ where });

  return NextResponse.json({
    type: 'trending',
    data: posts,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getFollowingPosts({ limit, skip, currentUser }: any) {
  const followingIds = await db.follow.findMany({
    where: { followerId: currentUser.id },
    select: { followingId: true },
  });

  const posts = await db.post.findMany({
    where: {
      isPublic: true,
      authorId: {
        in: followingIds.map(f => f.followingId),
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          pools: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });

  const total = await db.post.count({
    where: {
      isPublic: true,
      authorId: {
        in: followingIds.map(f => f.followingId),
      },
    },
  });

  return NextResponse.json({
    type: 'following',
    data: posts,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getDiscoverContent({ limit, skip }: any) {
  // Get popular subjects
  const popularSubjects = await db.post.groupBy({
    by: ['subject'],
    where: {
      isPublic: true,
      subject: {
        not: null,
      },
    },
    _count: {
      subject: true,
    },
    orderBy: {
      _count: {
        subject: 'desc',
      },
    },
    take: 10,
  });

  // Get recent posts
  const recentPosts = await db.post.findMany({
    where: {
      isPublic: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          pools: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });

  return NextResponse.json({
    type: 'discover',
    data: {
      popularSubjects: popularSubjects
        .filter(item => item.subject)
        .map(item => ({
          name: item.subject!,
          count: item._count.subject,
        })),
      recentPosts,
    },
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total: recentPosts.length,
      pages: Math.ceil(recentPosts.length / limit),
    },
  });
}
