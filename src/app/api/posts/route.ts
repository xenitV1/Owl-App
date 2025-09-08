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

    if (subject) {
      where.subject = subject;
    }

    if (school) {
      where.author = {
        school: school,
      };
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

    // Handle following posts
    if (following) {
      // Try NextAuth session first
      let userEmail: string | null = null;
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        userEmail = session.user.email as string;
      } else {
        // Fallback to Firebase token from header
        const firebaseToken = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!firebaseToken) {
          return NextResponse.json(
            { error: 'Unauthorized to view following posts' },
            { status: 401 }
          );
        }

        try {
          // Import Firebase Admin SDK
          const admin = (await import('@/lib/firebase-admin')).default;

          // Check if Firebase Admin is properly initialized
          if (!admin.apps.length || !admin.app().options.credential) {
            console.warn('Firebase Admin not properly configured, skipping token verification');
            // For development, accept the token without verification
            // This is not secure for production!
            userEmail = 'development@example.com';
          } else {
            const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
            userEmail = decodedToken.email || null;
          }
        } catch (error) {
          console.error('Firebase token verification failed:', error);
          // For development, if Firebase Admin is not configured, accept the request
          if (process.env.NODE_ENV === 'development') {
            console.warn('Development mode: accepting request without Firebase token verification');
            userEmail = 'development@example.com';
          } else {
            return NextResponse.json(
              { error: 'Invalid authentication token' },
              { status: 401 }
            );
          }
        }
      }

      if (!userEmail) {
        return NextResponse.json(
          { error: 'Unauthorized to view following posts' },
          { status: 401 }
        );
      }

      const currentUser = await db.user.findUnique({
        where: { email: userEmail },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const followingIds = await db.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });

      where.authorId = {
        in: followingIds.map(f => f.followingId),
      };
    }

    // Determine ordering based on query parameters
    let orderBy: any[] = [];
    
    if (trending) {
      // For trending, order by engagement (likes + comments) and recency
      orderBy = [
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
      ];
    } else if (recent) {
      // For recent, order by creation date
      orderBy = [
        {
          createdAt: 'desc',
        },
      ];
    } else {
      // Default ordering
      orderBy = [
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
        _count: {
          select: {
            likes: true,
            comments: true,
            pools: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Fetch image metadata for posts that have images
    const postsWithImageMetadata = await Promise.all(
      posts.map(async (post) => {
        if (post.image) {
          try {
            const imageData = await db.postImage.findUnique({
              where: { id: post.image },
              select: {
                width: true,
                height: true,
                placeholder: true,
                responsive: true,
              },
            });
            
            return {
              ...post,
              imageMetadata: imageData,
            };
          } catch (error) {
            console.error('Error fetching image metadata for post:', post.id, error);
            return post;
          }
        }
        return post;
      })
    );

    const total = await db.post.count({ where });

    const response = NextResponse.json({
      posts: postsWithImageMetadata,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

    apiDebugLogger.logResponse(logEntry, 200, {
      postsCount: posts.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
    
    timer();
    return response;
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const timer = apiDebugLogger.startTimer('POST /api/posts');
  const logEntry = await apiDebugLogger.logRequest(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    let effectiveEmail: string | null = session?.user?.email ?? null;
    // Dev-only fallback: allow Firebase-authenticated client to pass email header
    if (!effectiveEmail && process.env.NODE_ENV !== 'production') {
      const headerEmail = request.headers.get('x-user-email');
      if (headerEmail) {
        effectiveEmail = decodeFromBase64(headerEmail);
      }
    }
    
    if (!effectiveEmail) {
      apiDebugLogger.logResponse(logEntry, 401, { error: 'Unauthorized' });
      timer();
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const headerName = request.headers.get('x-user-name') ? decodeFromBase64(request.headers.get('x-user-name')!) : undefined;
    const defaultName = headerName || effectiveEmail.split('@')[0];
    const user = await db.user.upsert({
      where: { email: effectiveEmail },
      create: {
        email: effectiveEmail,
        name: defaultName,
        role: 'STUDENT',
      },
      update: {},
    });

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