import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoJoinUserToCommunity } from "@/lib/services/systemCommunityService";
import { requestGradeChange } from "@/lib/services/gradeChangeService";

export async function GET(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        country: true,
        language: true,
        preferLocalContent: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        bio: true,
        isVerified: true,
        onboardingComplete: true,
        countryChangeCount: true,
        lastCountryChange: true,
        lastGradeChange: true,
        pendingGrade: true,
        pendingGradeDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);

    // More specific error handling
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch user profile",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const {
      name,
      bio,
      school,
      grade,
      favoriteSubject,
      role,
      avatar,
      country,
      language,
      preferLocalContent,
      onboardingComplete,
    } = await request.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio;
    if (school !== undefined) updateData.school = school;
    if (favoriteSubject !== undefined)
      updateData.favoriteSubject = favoriteSubject;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Country change logic with 2-time limit
    if (country !== undefined && country !== user.country) {
      if (user.countryChangeCount >= 2) {
        return NextResponse.json(
          {
            error: "You have reached the maximum number of country changes (2)",
          },
          { status: 400 },
        );
      }

      updateData.country = country;
      updateData.countryChangeCount = user.countryChangeCount + 1;
      updateData.lastCountryChange = new Date();

      // Auto-join to new system community if grade is set
      if (user.grade) {
        try {
          await autoJoinUserToCommunity(user.id, country, user.grade);
        } catch (error) {
          console.error("Error joining system community:", error);
        }
      }
    }

    // Grade change logic with 24-hour pending period
    if (grade !== undefined && grade !== user.grade) {
      // If this is first time setting grade (onboarding)
      if (!user.grade) {
        updateData.grade = grade;
        updateData.lastGradeChange = new Date();

        // Auto-join to system community
        if (updateData.country || user.country) {
          try {
            await autoJoinUserToCommunity(
              user.id,
              updateData.country || user.country,
              grade,
            );
          } catch (error) {
            console.error("Error joining system community:", error);
          }
        }
      } else {
        // Request grade change with 24-hour delay
        const result = await requestGradeChange(user.id, grade);

        if (!result.success) {
          return NextResponse.json(
            {
              error: result.message,
              hoursRemaining: result.hoursRemaining,
              scheduledFor: result.scheduledFor,
            },
            { status: 400 },
          );
        }

        // Don't update grade immediately, it will be applied after 24 hours
        // The pending status is already set by requestGradeChange
      }
    }

    // Language can be updated anytime
    if (language !== undefined) {
      updateData.language = language;
    }

    // Content preference can be toggled by user
    if (preferLocalContent !== undefined) {
      updateData.preferLocalContent = preferLocalContent;
    }

    // Mark onboarding as complete
    if (onboardingComplete !== undefined) {
      updateData.onboardingComplete = onboardingComplete;
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        country: true,
        language: true,
        preferLocalContent: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        bio: true,
        isVerified: true,
        onboardingComplete: true,
        countryChangeCount: true,
        lastCountryChange: true,
        lastGradeChange: true,
        pendingGrade: true,
        pendingGradeDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}
