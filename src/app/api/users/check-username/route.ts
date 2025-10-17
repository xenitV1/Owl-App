import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Check Username Availability API
 * POST /api/users/check-username
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    // Validation
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        {
          available: false,
          error: "Username gerekli",
        },
        { status: 400 },
      );
    }

    // Trim whitespace and convert to lowercase
    const cleanUsername = username.trim().toLowerCase();

    // Length validation
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        {
          available: false,
          error: "Username en az 3 karakter olmalıdır",
        },
        { status: 400 },
      );
    }

    if (cleanUsername.length > 20) {
      return NextResponse.json(
        {
          available: false,
          error: "Username en fazla 20 karakter olabilir",
        },
        { status: 400 },
      );
    }

    // Character validation (alphanumeric and underscore only)
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        {
          available: false,
          error: "Username sadece harf, rakam ve alt çizgi içerebilir",
        },
        { status: 400 },
      );
    }

    // Check if username starts with number
    if (/^[0-9]/.test(cleanUsername)) {
      return NextResponse.json(
        {
          available: false,
          error: "Username harf ile başlamalıdır",
        },
        { status: 400 },
      );
    }

    // Check for reserved usernames
    const reservedUsernames = [
      "admin",
      "administrator",
      "root",
      "system",
      "api",
      "www",
      "mail",
      "ftp",
      "support",
      "help",
      "contact",
      "about",
      "privacy",
      "terms",
      "legal",
      "moderator",
      "mod",
      "staff",
      "team",
      "owl",
      "app",
      "owlapp",
    ];

    if (reservedUsernames.includes(cleanUsername)) {
      return NextResponse.json(
        {
          available: false,
          error: "Bu username kullanılamaz",
        },
        { status: 400 },
      );
    }

    // Check database for existing username
    const existingUser = await db.user.findUnique({
      where: { username: cleanUsername },
    });

    const available = !existingUser;

    return NextResponse.json({
      available,
      message: available
        ? "Kullanıcı adı kullanılabilir"
        : "Bu kullanıcı adı alınmış",
      username: cleanUsername,
    });
  } catch (error) {
    console.error("[API] Error checking username:", error);
    return NextResponse.json(
      { error: "Username kontrolü sırasında hata oluştu" },
      { status: 500 },
    );
  }
}
