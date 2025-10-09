import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's echoes
    const echoes = await db.echo.findMany({
      where: { userId },
      include: {
        post: {
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
                echoes: true,
              },
            },
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
      where: { userId },
    });

    return NextResponse.json({
      echoes,
      totalCount,
      page,
      limit,
      hasMore: (page + 1) * limit < totalCount,
    });
  } catch (error) {
    console.error("Error fetching user echoes:", error);
    return NextResponse.json(
      { error: "Failed to fetch echoes" },
      { status: 500 },
    );
  }
}
