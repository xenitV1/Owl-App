import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const currentUserId = searchParams.get("currentUserId"); // For editing existing user

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Username validation rules
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({
        available: false,
        message: "Username must be between 3 and 20 characters",
      });
    }

    // Check if username contains only allowed characters (letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        message: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Check if username starts or ends with underscore
    if (username.startsWith("_") || username.endsWith("_")) {
      return NextResponse.json({
        available: false,
        message: "Username cannot start or end with an underscore",
      });
    }

    // Check if username has consecutive underscores
    if (username.includes("__")) {
      return NextResponse.json({
        available: false,
        message: "Username cannot contain consecutive underscores",
      });
    }

    // Check for uniqueness (case-insensitive)
    const existingUser = await db.user.findFirst({
      where: {
        username: {
          equals: username,
          // mode: 'insensitive' // Case-insensitive comparison - Remove this as it might not be supported
        },
        // Exclude current user when editing
        ...(currentUserId && { id: { not: currentUserId } }),
      },
    });

    // If we found a user, do case-insensitive comparison manually
    if (
      existingUser &&
      existingUser.username &&
      existingUser.username.toLowerCase() === username.toLowerCase()
    ) {
      return NextResponse.json({
        available: false,
        message: "Username is already taken",
      });
    }

    // Check for reserved usernames (optional)
    const reservedUsernames = [
      "admin",
      "administrator",
      "moderator",
      "system",
      "support",
      "help",
      "info",
      "contact",
    ];
    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json({
        available: false,
        message: "This username is reserved",
      });
    }

    return NextResponse.json({
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 },
    );
  }
}
