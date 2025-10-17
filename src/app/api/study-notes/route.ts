import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppCreateStudyNoteRequest as CreateStudyNoteRequest } from "@/types/studyNote";

// GET - List user's study notes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const subject = searchParams.get("subject");
    const ageGroup = searchParams.get("ageGroup");

    const where: any = { userId: user.id };
    if (subject) where.subject = subject;
    if (ageGroup) where.ageGroup = ageGroup;

    const [notes, total] = await Promise.all([
      prisma.studyNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.studyNote.count({ where }),
    ]);

    return NextResponse.json({
      notes,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching study notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch study notes" },
      { status: 500 },
    );
  }
}

// POST - Create new study note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateStudyNoteRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.ageGroup) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, ageGroup" },
        { status: 400 },
      );
    }

    const studyNote = await prisma.studyNote.create({
      data: {
        title: body.title,
        content: body.content,
        subject: body.subject,
        ageGroup: body.ageGroup,
        language: body.language || "tr",
        sourceDocument: body.sourceDocument,
        userId: user.id,
        isPublic: body.isPublic || false,
      },
    });

    return NextResponse.json(studyNote, { status: 201 });
  } catch (error) {
    console.error("Error creating study note:", error);
    return NextResponse.json(
      { error: "Failed to create study note" },
      { status: 500 },
    );
  }
}
