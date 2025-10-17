import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UpdateStudyNoteRequest } from "@/types/studyNote";

// GET - Get single study note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const studyNote = await prisma.studyNote.findUnique({
      where: { id },
    });

    if (!studyNote) {
      return NextResponse.json(
        { error: "Study note not found" },
        { status: 404 },
      );
    }

    // Check if user owns the note
    if (studyNote.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(studyNote);
  } catch (error) {
    console.error("Error fetching study note:", error);
    return NextResponse.json(
      { error: "Failed to fetch study note" },
      { status: 500 },
    );
  }
}

// PATCH - Update study note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const studyNote = await prisma.studyNote.findUnique({
      where: { id: id },
    });

    if (!studyNote) {
      return NextResponse.json(
        { error: "Study note not found" },
        { status: 404 },
      );
    }

    if (studyNote.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateStudyNoteRequest = await request.json();

    const updatedNote = await prisma.studyNote.update({
      where: { id: id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating study note:", error);
    return NextResponse.json(
      { error: "Failed to update study note" },
      { status: 500 },
    );
  }
}

// DELETE - Delete study note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const studyNote = await prisma.studyNote.findUnique({
      where: { id: id },
    });

    if (!studyNote) {
      return NextResponse.json(
        { error: "Study note not found" },
        { status: 404 },
      );
    }

    if (studyNote.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.studyNote.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting study note:", error);
    return NextResponse.json(
      { error: "Failed to delete study note" },
      { status: 500 },
    );
  }
}
