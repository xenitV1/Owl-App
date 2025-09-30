import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';import { db } from '@/lib/db';
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
    let userEmail: string | null = null;
    
    // Use NextAuth session instead of Firebase tokens
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
        return await getUsers({ limit, skip, search, currentUser });
      
      case 'trending':
        return await getTrendingPosts({ limit, skip, subject, currentUser });
      
      case 'following':
        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required for following posts' },
            { status: 401 }
          );
        }
        return await getFollowingPosts({ limit, skip, currentUser });
      
      case 'discover':
        return await getDiscoverContent({ limit, skip, currentUser });
      
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

async function getUsers({ limit, skip, search, currentUser }: any) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { school: { contains: search, mode: 'insensitive' } },
    ];
  }

  // currentUser is passed as parameter from main GET function

  // Add block filtering
  if (currentUser) {
    const blockedUserIds = await db.userBlock.findMany({
      where: { blockerId: currentUser.id },
      select: { blockedId: true }
    }).then(blocks => blocks.map(b => b.blockedId));

    const blockingUserIds = await db.userBlock.findMany({
      where: { blockedId: currentUser.id },
      select: { blockerId: true }
    }).then(blocks => blocks.map(b => b.blockerId));

    const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

    if (allBlockedIds.length > 0) {
      where.id = {
        ...where.id,
        notIn: allBlockedIds
      };
    }
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

async function getTrendingPosts({ limit, skip, subject, currentUser }: any) {
  const where: any = {
    isPublic: true,
  };

  if (subject) {
    where.subject = subject;
  }

  // Add block filtering - exclude posts from blocked users
  if (currentUser) {
    const blockedUserIds = await db.userBlock.findMany({
      where: { blockerId: currentUser.id },
      select: { blockedId: true }
    }).then(blocks => blocks.map(b => b.blockedId));

    const blockingUserIds = await db.userBlock.findMany({
      where: { blockedId: currentUser.id },
      select: { blockerId: true }
    }).then(blocks => blocks.map(b => b.blockerId));

    const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

    if (allBlockedIds.length > 0) {
      where.authorId = {
        notIn: allBlockedIds
      };
    }
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

  const where: any = {
    isPublic: true,
    authorId: {
      in: followingIds.map(f => f.followingId),
    },
  };

  // Add block filtering - exclude posts from blocked users
  const blockedUserIds = await db.userBlock.findMany({
    where: { blockerId: currentUser.id },
    select: { blockedId: true }
  }).then(blocks => blocks.map(b => b.blockedId));

  const blockingUserIds = await db.userBlock.findMany({
    where: { blockedId: currentUser.id },
    select: { blockerId: true }
  }).then(blocks => blocks.map(b => b.blockerId));

  const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

  if (allBlockedIds.length > 0) {
    where.authorId = {
      in: followingIds.map(f => f.followingId).filter(id => !allBlockedIds.includes(id)),
    };
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

async function getDiscoverContent({ limit, skip, currentUser }: any) {
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

  // Get recent posts with block filtering
  const where: any = {
    isPublic: true,
  };

  // Add block filtering - exclude posts from blocked users
  if (currentUser) {
    const blockedUserIds = await db.userBlock.findMany({
      where: { blockerId: currentUser.id },
      select: { blockedId: true }
    }).then(blocks => blocks.map(b => b.blockedId));

    const blockingUserIds = await db.userBlock.findMany({
      where: { blockedId: currentUser.id },
      select: { blockerId: true }
    }).then(blocks => blocks.map(b => b.blockerId));

    const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

    if (allBlockedIds.length > 0) {
      where.authorId = {
        notIn: allBlockedIds
      };
    }
  }

  const recentPosts = await db.post.findMany({
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
