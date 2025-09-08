import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; size: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id, size } = resolvedParams;
    
    if (!id || !size) {
      return NextResponse.json(
        { error: 'Image ID and size are required' },
        { status: 400 }
      );
    }

    // Validate size parameter
    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: 'Invalid size. Must be small, medium, or large' },
        { status: 400 }
      );
    }

    // Get the image data from database
    const imageData = await db.postImage.findUnique({
      where: { id },
      select: {
        smallData: true,
        mediumData: true,
        largeData: true,
        mimeType: true,
        width: true,
        height: true,
      },
    });

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get the appropriate size data
    let imageBuffer: Buffer | null = null;
    switch (size) {
      case 'small':
        imageBuffer = imageData.smallData ? Buffer.from(imageData.smallData) : 
                     imageData.mediumData ? Buffer.from(imageData.mediumData) : 
                     imageData.largeData ? Buffer.from(imageData.largeData) : null;
        break;
      case 'medium':
        imageBuffer = imageData.mediumData ? Buffer.from(imageData.mediumData) : 
                     imageData.largeData ? Buffer.from(imageData.largeData) : null;
        break;
      case 'large':
        imageBuffer = imageData.largeData ? Buffer.from(imageData.largeData) : null;
        break;
      default:
        imageBuffer = imageData.mediumData ? Buffer.from(imageData.mediumData) : 
                     imageData.largeData ? Buffer.from(imageData.largeData) : null;
    }

    if (!imageBuffer) {
      return NextResponse.json(
        { error: 'Image size not available' },
        { status: 404 }
      );
    }

    // Return the image with proper headers
    return new NextResponse(imageBuffer as any, {
      headers: {
        'Content-Type': imageData.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving responsive image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
