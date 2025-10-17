/**
 * System Community Discovery API
 * GET /api/communities/system/discover
 *
 * Returns system communities based on user's grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getSystemCommunitiesByGrade,
  getUserSystemCommunity,
} from "@/lib/services/systemCommunityService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        country: true,
        grade: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.grade) {
      return NextResponse.json(
        { error: "Please complete your profile with grade information" },
        { status: 400 },
      );
    }

    // Get user's own system community
    const userCommunity = await getUserSystemCommunity(user.id);

    // Get other communities with same grade (different countries)
    const otherCommunities = await getSystemCommunitiesByGrade(
      user.grade,
      user.country || undefined,
    );

    // Check which communities user has joined
    const userMemberships = await db.communityMember.findMany({
      where: {
        userId: user.id,
        communityId: {
          in: otherCommunities.map((c) => c.id),
        },
      },
      select: { communityId: true },
    });

    const joinedCommunityIds = new Set(
      userMemberships.map((m) => m.communityId),
    );

    const communitiesWithMembership = otherCommunities.map((community) => ({
      ...community,
      isJoined: joinedCommunityIds.has(community.id),
    }));

    return NextResponse.json({
      userCommunity,
      discoverableCommunities: communitiesWithMembership,
    });
  } catch (error) {
    console.error("[API] Error in system community discovery:", error);
    return NextResponse.json(
      { error: "Failed to fetch system communities" },
      { status: 500 },
    );
  }
}
