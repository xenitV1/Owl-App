import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
// GET /api/communities - Get all communities or search communities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const userId = searchParams.get("userId");
    const joined = searchParams.get("joined") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeAllSystem = searchParams.get("includeAllSystem") === "true";

    let whereClause: any = {};

    // Get current user for block filtering
    const session = await getServerSession(authOptions);
    const currentUser = session?.user?.email
      ? await db.user.findUnique({
          where: { email: session.user.email },
        })
      : null;

    // Add block filtering for members
    let memberFilter: any = {};
    if (currentUser) {
      const blockedUserIds = await db.userBlock
        .findMany({
          where: { blockerId: currentUser.id },
          select: { blockedId: true },
        })
        .then((blocks) => blocks.map((b) => b.blockedId));

      const blockingUserIds = await db.userBlock
        .findMany({
          where: { blockedId: currentUser.id },
          select: { blockerId: true },
        })
        .then((blocks) => blocks.map((b) => b.blockerId));

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

      if (allBlockedIds.length > 0) {
        memberFilter.user = {
          id: {
            notIn: allBlockedIds,
          },
        };
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (joined && userId) {
      whereClause.members = {
        some: {
          userId: userId,
        },
      };
    }

    // Visibility rule for system-generated communities:
    // By default, users should only see system communities that match their grade.
    // They can see user-created communities regardless.
    if (!includeAllSystem) {
      const gradeFilter = currentUser?.grade || "__NO_GRADE__";
      // Ensure base whereClause is AND-able
      whereClause.AND = [
        {
          OR: [
            { isSystemGenerated: false },
            {
              isSystemGenerated: true,
              grade: gradeFilter,
              // country intentionally not filtered to allow viewing same-grade other countries
            },
          ],
        },
      ];
    }

    const communities = await db.community.findMany({
      where: whereClause,
      include: {
        members: {
          where: memberFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await db.community.count({
      where: whereClause,
    });

    return NextResponse.json({
      communities,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 },
    );
  }
}

// POST /api/communities - Create a new community
export async function POST(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get current user from database
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, avatar } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Community name is required" },
        { status: 400 },
      );
    }

    // Check if community name already exists
    const existingCommunity = await db.community.findUnique({
      where: { name: name.trim() },
    });

    if (existingCommunity) {
      return NextResponse.json(
        { error: "Community with this name already exists" },
        { status: 400 },
      );
    }

    // Create community
    const community = await db.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        avatar: avatar || null,
        members: {
          create: {
            userId: currentUser.id,
            role: "admin",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 },
    );
  }
}
