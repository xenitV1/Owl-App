import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';import { db } from '@/lib/db';
export async function POST(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    const { postId, categoryId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if category exists and belongs to user (if provided)
    if (categoryId) {
      const category = await db.poolCategory.findFirst({
        where: {
          id: categoryId,
          userId: user.id
        }
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Check if user already saved the post
    const existingPool = await db.pool.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        },
      },
    });

    if (existingPool) {
      // Unsave the post
      await db.pool.delete({
        where: {
          id: existingPool.id,
        },
      });

      return NextResponse.json({
        saved: false,
        poolsCount: await db.pool.count({
          where: { postId },
        }),
      });
    } else {
      // Save the post
      await db.pool.create({
        data: {
          userId: user.id,
          postId: postId,
          categoryId: categoryId || null,
        },
      });

      return NextResponse.json({
        saved: true,
        poolsCount: await db.pool.count({
          where: { postId },
        }),
      });
    }
  } catch (error) {
    console.error('Error toggling pool:', error);
    return NextResponse.json(
      { error: 'Failed to toggle pool' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = { userId: user.id };
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Add block filtering - exclude posts from blocked users
    const blockedUserIds = await db.userBlock.findMany({
      where: { blockerId: user.id },
      select: { blockedId: true }
    }).then(blocks => blocks.map(b => b.blockedId));

    const blockingUserIds = await db.userBlock.findMany({
      where: { blockedId: user.id },
      select: { blockerId: true }
    }).then(blocks => blocks.map(b => b.blockerId));

    const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

    // Update where clause to exclude blocked users' posts
    if (allBlockedIds.length > 0) {
      whereClause.post = {
        ...whereClause.post,
        authorId: {
          notIn: allBlockedIds
        }
      };
    }

    const [pools, totalCount] = await Promise.all([
      db.pool.findMany({
        where: whereClause,
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  school: true,
                  grade: true
                }
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  pools: true
                }
              }
            }
          },
          category: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.pool.count({ where: whereClause })
    ]);

    const posts = pools.map(pool => pool.post);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pools' },
      { status: 500 }
    );
  }
}