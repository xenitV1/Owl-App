import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get echoes for this post
    const echoes = await db.echo.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            school: true,
            grade: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: page * limit,
      take: limit,
    });

    // Get total count
    const totalCount = await db.echo.count({
      where: { postId },
    });

    return NextResponse.json({
      echoes,
      totalCount,
      page,
      limit,
      hasMore: (page + 1) * limit < totalCount,
    });
  } catch (error) {
    console.error("Error fetching post echoes:", error);
    return NextResponse.json(
      { error: "Failed to fetch echoes" },
      { status: 500 },
    );
  }
}
