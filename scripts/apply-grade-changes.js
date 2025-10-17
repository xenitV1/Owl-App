/**
 * Apply Pending Grade Changes Script
 *
 * This script applies pending grade changes that are due
 * Run this script every hour via cron or PM2 ecosystem
 *
 * Usage: node scripts/apply-grade-changes.js
 */

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

// Import the grade change service
async function applyPendingGradeChanges() {
  const pending = await db.pendingGradeChange.findMany({
    where: {
      scheduledFor: {
        lte: new Date(),
      },
    },
  });

  console.log(
    `[GradeChangeService] Found ${pending.length} pending grade changes to apply`,
  );

  let successCount = 0;

  for (const change of pending) {
    try {
      // Update user grade
      await db.user.update({
        where: { id: change.userId },
        data: {
          grade: change.newGrade,
          lastGradeChange: new Date(),
          pendingGrade: null,
          pendingGradeDate: null,
        },
      });

      // Get user country to reassign community
      const user = await db.user.findUnique({
        where: { id: change.userId },
        select: { country: true, grade: true },
      });

      if (user?.country) {
        // Check if system community exists
        let community = await db.community.findFirst({
          where: {
            isSystemGenerated: true,
            country: user.country,
            grade: change.newGrade,
          },
        });

        // Create if not exists
        if (!community) {
          const nameKey = `communities.${user.country.toLowerCase().replace(/\s+/g, "_")}_${change.newGrade.toLowerCase().replace(/\s+/g, "_")}`;

          community = await db.community.create({
            data: {
              name: `${user.country} - ${change.newGrade}`,
              nameKey,
              isSystemGenerated: true,
              country: user.country,
              grade: change.newGrade,
              isPublic: true,
            },
          });

          // Create main chat
          await db.communityChat.create({
            data: {
              communityId: community.id,
              name: "Main Chat",
              isMainChat: true,
              maxMessages: 2000,
            },
          });
        }

        // Add user as member
        await db.communityMember.upsert({
          where: {
            userId_communityId: {
              userId: change.userId,
              communityId: community.id,
            },
          },
          create: {
            userId: change.userId,
            communityId: community.id,
            role: "member",
          },
          update: {},
        });

        // Add to main chat
        const mainChat = await db.communityChat.findFirst({
          where: {
            communityId: community.id,
            isMainChat: true,
          },
        });

        if (mainChat) {
          await db.chatMember.upsert({
            where: {
              chatId_userId: {
                chatId: mainChat.id,
                userId: change.userId,
              },
            },
            create: {
              chatId: mainChat.id,
              userId: change.userId,
              role: "member",
            },
            update: {},
          });
        }

        console.log(
          `[GradeChangeService] User ${change.userId} reassigned to ${user.country} - ${change.newGrade}`,
        );
      }

      // Delete pending record
      await db.pendingGradeChange.delete({
        where: { id: change.id },
      });

      successCount++;
    } catch (error) {
      console.error(
        `[GradeChangeService] Error applying grade change for user ${change.userId}:`,
        error,
      );
    }
  }

  console.log(
    `[GradeChangeService] Successfully applied ${successCount}/${pending.length} grade changes`,
  );

  return successCount;
}

async function main() {
  try {
    console.log("[GradeChangeService] Starting grade change application...");
    console.log("[GradeChangeService] Current time:", new Date().toISOString());

    const count = await applyPendingGradeChanges();

    console.log(
      `[GradeChangeService] Completed. Applied ${count} grade changes.`,
    );

    await db.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[GradeChangeService] Fatal error:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

main();
