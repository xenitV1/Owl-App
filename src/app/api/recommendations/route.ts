import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'content'; // 'content' or 'users'
    const limit = parseInt(searchParams.get('limit') || '10');

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (type === 'content') {
      const recommendations = await getContentRecommendations(currentUser.id, limit);
      return NextResponse.json({ recommendations });
    } else if (type === 'users') {
      const recommendations = await getUserRecommendations(currentUser, limit);
      return NextResponse.json({ recommendations });
    } else {
      return NextResponse.json({ error: 'Invalid recommendation type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}

async function getContentRecommendations(userId: string, limit: number) {
  try {
    // Get user's engagement patterns
    const userEngagement = await db.user.findUnique({
      where: { id: userId },
      select: {
        favoriteSubject: true,
        school: true,
        grade: true,
        likes: {
          select: {
            post: {
              select: {
                subject: true,
                author: {
                  select: {
                    school: true,
                    grade: true,
                  },
                },
              },
            },
          },
          take: 20, // Last 20 likes
        },
        pools: {
          select: {
            post: {
              select: {
                subject: true,
                author: {
                  select: {
                    school: true,
                    grade: true,
                  },
                },
              },
            },
          },
          take: 20, // Last 20 saves
        },
        following: {
          select: {
            following: {
              select: {
                id: true,
                school: true,
                grade: true,
                favoriteSubject: true,
              },
            },
          },
        },
      },
    });

    if (!userEngagement) {
      return getFallbackContentRecommendations(limit);
    }

    // Extract user preferences from engagement data
    const preferredSubjects = new Set<string>();
    const preferredSchools = new Set<string>();
    const preferredGrades = new Set<string>();
    const followedUsers = new Set<string>();

    // Add user's own preferences
    if (userEngagement.favoriteSubject) {
      preferredSubjects.add(userEngagement.favoriteSubject);
    }
    if (userEngagement.school) {
      preferredSchools.add(userEngagement.school);
    }
    if (userEngagement.grade) {
      preferredGrades.add(userEngagement.grade);
    }

    // Analyze liked posts
    userEngagement.likes.forEach(like => {
      if (like.post.subject) {
        preferredSubjects.add(like.post.subject);
      }
      if (like.post.author?.school) {
        preferredSchools.add(like.post.author.school);
      }
      if (like.post.author?.grade) {
        preferredGrades.add(like.post.author.grade);
      }
    });

    // Analyze saved posts
    userEngagement.pools.forEach(pool => {
      if (pool.post.subject) {
        preferredSubjects.add(pool.post.subject);
      }
      if (pool.post.author?.school) {
        preferredSchools.add(pool.post.author.school);
      }
      if (pool.post.author?.grade) {
        preferredGrades.add(pool.post.author.grade);
      }
    });

    // Get followed users
    userEngagement.following.forEach(follow => {
      followedUsers.add(follow.following.id);
      if (follow.following.school) {
        preferredSchools.add(follow.following.school);
      }
      if (follow.following.grade) {
        preferredGrades.add(follow.following.grade);
      }
      if (follow.following.favoriteSubject) {
        preferredSubjects.add(follow.following.favoriteSubject);
      }
    });

    // Build recommendation query
    const where: any = {
      isPublic: true,
      authorId: {
        not: userId, // Exclude user's own posts
      },
    };

    // Create preference-based scoring conditions
    const preferenceConditions: any[] = [];

    if (preferredSubjects.size > 0) {
      preferenceConditions.push({
        subject: {
          in: Array.from(preferredSubjects),
        },
      });
    }

    if (preferredSchools.size > 0) {
      preferenceConditions.push({
        author: {
          school: {
            in: Array.from(preferredSchools),
          },
        },
      });
    }

    if (preferredGrades.size > 0) {
      preferenceConditions.push({
        author: {
          grade: {
            in: Array.from(preferredGrades),
          },
        },
      });
    }

    if (followedUsers.size > 0) {
      preferenceConditions.push({
        authorId: {
          in: Array.from(followedUsers),
        },
      });
    }

    if (preferenceConditions.length > 0) {
      where.OR = preferenceConditions;
    }

    // Get recommendations with engagement scoring
    const recommendations = await db.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            school: true,
            grade: true,
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
      take: limit,
    });

    return recommendations;
  } catch (error) {
    console.error('Error in content recommendations:', error);
    return getFallbackContentRecommendations(limit);
  }
}

async function getUserRecommendations(currentUser: any, limit: number) {
  try {
    // Get users that current user is not following
    const followingIds = await db.follow.findMany({
      where: { followerId: currentUser.id },
      select: { followingId: true },
    });

    const excludedIds = [currentUser.id, ...followingIds.map(f => f.followingId)];

    // Get user's engagement patterns for collaborative filtering
    const userEngagement = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        likes: {
          select: {
            post: {
              select: {
                authorId: true,
              },
            },
          },
        },
        pools: {
          select: {
            post: {
              select: {
                authorId: true,
              },
            },
          },
        },
      },
    });

    // Find users who engage with similar content
    const similarUserIds = new Set<string>();
    
    if (userEngagement) {
      // Get authors of posts that current user has liked or saved
      const engagedAuthorIds = new Set<string>();
      
      userEngagement.likes.forEach(like => {
        if (like.post.authorId) {
          engagedAuthorIds.add(like.post.authorId);
        }
      });
      
      userEngagement.pools.forEach(pool => {
        if (pool.post.authorId) {
          engagedAuthorIds.add(pool.post.authorId);
        }
      });

      // Find users who also engage with these authors' content
      if (engagedAuthorIds.size > 0) {
        const similarEngagements = await db.like.findMany({
          where: {
            post: {
              authorId: {
                in: Array.from(engagedAuthorIds),
              },
            },
            userId: {
              notIn: excludedIds,
            },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
          take: limit * 2,
        });

        similarEngagements.forEach(engagement => {
          similarUserIds.add(engagement.userId);
        });
      }
    }

    // Build recommendation query with multiple strategies
    const where: any = {
      id: {
        notIn: excludedIds,
      },
      role: 'STUDENT',
    };

    const recommendationConditions: any[] = [];

    // Priority 1: Users with similar interests (school, grade, subject)
    if (currentUser.school || currentUser.grade || currentUser.favoriteSubject) {
      const interestConditions: any[] = [];
      
      if (currentUser.school) {
        interestConditions.push({ school: currentUser.school });
      }
      if (currentUser.grade) {
        interestConditions.push({ grade: currentUser.grade });
      }
      if (currentUser.favoriteSubject) {
        interestConditions.push({ favoriteSubject: currentUser.favoriteSubject });
      }

      if (interestConditions.length > 0) {
        recommendationConditions.push({
          OR: interestConditions,
        });
      }
    }

    // Priority 2: Users with similar engagement patterns
    if (similarUserIds.size > 0) {
      recommendationConditions.push({
        id: {
          in: Array.from(similarUserIds),
        },
      });
    }

    if (recommendationConditions.length > 0) {
      where.OR = recommendationConditions;
    }

    const recommendedUsers = await db.user.findMany({
      where,
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
        {
          createdAt: 'desc',
        },
      ],
      take: limit,
    });

    return recommendedUsers;
  } catch (error) {
    console.error('Error in user recommendations:', error);
    return getFallbackUserRecommendations(currentUser.id, limit);
  }
}

function getFallbackContentRecommendations(limit: number) {
  // Fallback to trending posts
  return db.post.findMany({
    where: {
      isPublic: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          school: true,
          grade: true,
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
    take: limit,
  });
}

function getFallbackUserRecommendations(userId: string, limit: number) {
  // Fallback to active users
  return db.user.findMany({
    where: {
      id: {
        not: userId,
      },
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
}