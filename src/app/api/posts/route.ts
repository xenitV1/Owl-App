import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContentFilterService } from '@/lib/contentFilter';
import { ImageOptimizer } from '@/lib/imageOptimizer';
import apiDebugLogger, { withApiDebug } from '@/lib/apiDebug';

export async function GET(request: NextRequest) {
  const timer = apiDebugLogger.startTimer('GET /api/posts');
  const logEntry = await apiDebugLogger.logRequest(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const subject = searchParams.get('subject');
    const school = searchParams.get('school');
    const trending = searchParams.get('trending') === 'true';
    const following = searchParams.get('following') === 'true';
    const recent = searchParams.get('recent') === 'true';
    const search = searchParams.get('search');
    const subjects = searchParams.get('subjects') === 'true';

    console.log('Posts API request parameters:', {
      page, limit, subject, school, trending, following, recent, search, subjects
    });

    const skip = (page - 1) * limit;

    // Handle popular subjects request
    if (subjects) {
      const subjectCounts = await db.post.groupBy({
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
        take: limit,
      });

      const popularSubjects = subjectCounts
        .filter(item => item.subject)
        .map(item => ({
          name: item.subject!,
          count: item._count.subject,
        }));

      return NextResponse.json({
        subjects: popularSubjects,
      });
    }

    const where: any = {
      isPublic: true,
    };

    // Get current user for block filtering
    let currentUser: any = null;

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email }
      });
    }

    // Apply filters based on query parameters
    if (subject) {
      where.subject = subject;
    }
    if (school) {
      where.author = {
        school: school
      };
    }

    // Apply following filter
    if (following && currentUser) {
      where.author = {
        ...where.author,
        followers: {
          some: {
            followerId: currentUser.id
          }
        }
      };
    }

    // Apply trending/recent filters
    let orderBy: any = { createdAt: 'desc' };
    if (trending) {
      orderBy = [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ];
    } else if (recent) {
      orderBy = { createdAt: 'desc' };
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply block filtering
    if (currentUser) {
      where.NOT = {
        author: {
          OR: [
            { blockedBy: { some: { blockerId: currentUser.id } } },
            { blockedUsers: { some: { blockedId: currentUser.id } } }
          ]
        }
      };
    }

    // Get posts with total count
    const [posts, totalPosts] = await Promise.all([
      db.post.findMany({
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
          likes: currentUser ? {
            where: {
              userId: currentUser.id
            },
            select: {
              id: true
            }
          } : false,
          pools: currentUser ? {
            where: {
              userId: currentUser.id
            },
            select: {
              id: true
            }
          } : false,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.post.count({ where })
    ]);

    // Transform posts to include isLiked and isSaved flags
    const transformedPosts = posts.map(post => ({
      ...post,
      isLikedByCurrentUser: currentUser ? (post.likes && Array.isArray(post.likes) && post.likes.length > 0) : false,
      isSavedByCurrentUser: currentUser ? (post.pools && Array.isArray(post.pools) && post.pools.length > 0) : false,
      likes: undefined, // Remove the likes array from response
      pools: undefined, // Remove the pools array from response
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        pages: Math.ceil(totalPosts / limit),
        total: totalPosts,
        hasMore: page < Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST method - Create new post
export async function POST(request: NextRequest) {
      const timer = apiDebugLogger.startTimer('POST /api/posts');
      const logEntry = await apiDebugLogger.logRequest(request);

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
          where: { email: session.user.email }
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const subject = formData.get('subject') as string;
        const image = formData.get('image') as File;

        console.log('Post creation data:', {
          title: title?.substring(0, 50),
          hasContent: !!content,
          subject,
          hasImage: !!image,
          imageSize: image?.size
        });

        if (!title || !title.trim()) {
          apiDebugLogger.logResponse(logEntry, 400, { error: 'Title is required' });
          timer();
          return NextResponse.json(
            { error: 'Title is required' },
            { status: 400 }
          );
        }

        let imagePath: string | null = null;
    let imageMetadata: {
      buffer: Buffer;
      responsiveImages?: any;
      originalName: string;
      mimeType: string;
      size: number;
      width: number;
      height: number;
      format: string;
      quality: number;
      placeholder: string;
      responsive: Record<string, any>;
    } | null = null;
    
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      let buffer = Buffer.from(bytes);

      // Validate image
      const validation = ImageOptimizer.validateImage(buffer);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      try {
        // Optimize image with WebP support
        const optimizedImage = await ImageOptimizer.optimizeImage(buffer, {
          format: 'webp',
          quality: 85,
          maxSize: 5 * 1024 * 1024 // 5MB max
        });

        // Generate responsive images
        const responsiveImages = await ImageOptimizer.generateResponsiveImages(buffer, [
          { width: 320, name: 'small' },
          { width: 640, name: 'medium' },
          { width: 1024, name: 'large' }
        ]);

        // Generate placeholder for lazy loading
        const placeholder = await ImageOptimizer.generatePlaceholder(buffer);

        // Don't create PostImage here - will create after Post is created
        // Store image data temporarily for later use
        imageMetadata = {
          buffer: optimizedImage.buffer,
          responsiveImages,
          originalName: image.name,
          mimeType: image.type,
          size: image.size,
          width: optimizedImage.width,
          height: optimizedImage.height,
          format: optimizedImage.format,
          quality: optimizedImage.quality,
          placeholder,
          responsive: responsiveImages ? Object.keys(responsiveImages).reduce((acc, key) => {
            const responsiveImage = responsiveImages![key];
            if (responsiveImage) {
              acc[key] = {
                width: responsiveImage.width,
                height: responsiveImage.height,
                size: responsiveImage.size,
              };
            }
            return acc;
          }, {} as Record<string, any>) : {}
        };



      } catch (error) {
        console.error('Error processing image:', error);
        console.error('Error details:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        apiDebugLogger.logError(logEntry, error);
        apiDebugLogger.logResponse(logEntry, 500, { error: 'Failed to process image' });
        timer();
        return NextResponse.json(
          { error: 'Failed to process image' },
          { status: 500 }
        );
      }
    }

    const post = await db.post.create({
      data: {
        title: title.trim(),
        content: content?.trim() || null,
        subject: subject?.trim() || null,
        image: null, // Will be updated after PostImage creation
        authorId: user.id,
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
    });

    // Create PostImage with the actual post ID if there's image data
    if (imageMetadata && imageMetadata.buffer) {
      const postImage = await db.postImage.create({
        data: {
          postId: post.id, // Use real post ID now
          originalName: imageMetadata.originalName,
          mimeType: imageMetadata.mimeType,
          size: imageMetadata.size,
          optimizedData: new Uint8Array(imageMetadata.buffer),
          smallData: imageMetadata.responsiveImages?.small ? new Uint8Array(imageMetadata.responsiveImages.small.buffer) : null,
          mediumData: imageMetadata.responsiveImages?.medium ? new Uint8Array(imageMetadata.responsiveImages.medium.buffer) : null,
          largeData: imageMetadata.responsiveImages?.large ? new Uint8Array(imageMetadata.responsiveImages.large.buffer) : null,
          width: imageMetadata.width,
          height: imageMetadata.height,
          placeholder: imageMetadata.placeholder,
          responsive: imageMetadata.responsive
        }
      });

      // Update post with image reference
      await db.post.update({
        where: { id: post.id },
        data: { image: postImage.id }
      });

      imagePath = postImage.id;
    }

    console.log('Post created successfully:', {
      postId: post.id,
      title: post.title,
      hasImage: !!post.image,
      authorId: post.authorId
    });

    // Apply content filtering
    const contentToCheck = `${title} ${content || ''}`.trim();
    if (contentToCheck) {
      const filterResult = await ContentFilterService.checkContent(contentToCheck, 'POST');
      
      if (filterResult.matched) {
        console.log('Content filter matched:', {
          postId: post.id,
          filterResult
        });
        
        // Apply the filter action
        await ContentFilterService.applyFilterAction(
          filterResult,
          post.id,
          'POST',
          user.id
        );

        // If the content was removed/blocked, return a different response
        if (filterResult.action === 'BLOCK' || filterResult.action === 'REMOVE') {
          apiDebugLogger.logResponse(logEntry, 201, {
            message: 'Post was blocked by content filter',
            filterResult,
            blocked: true
          });
          timer();
          return NextResponse.json({
            message: 'Post was blocked by content filter',
            filterResult,
            blocked: true
          }, { status: 201 });
        }

        // If flagged or escalated, include that info in the response
        apiDebugLogger.logResponse(logEntry, 201, {
          ...post,
          filterResult,
          flagged: true
        });
        timer();
        return NextResponse.json({
          ...post,
          filterResult,
          flagged: true
        }, { status: 201 });
      }
    }

    apiDebugLogger.logResponse(logEntry, 201, post);
    timer();
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}