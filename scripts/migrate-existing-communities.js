/**
 * Migrate Existing Communities Script
 *
 * This script:
 * 1. Marks all existing communities as user-created (not system-generated)
 * 2. Creates system communities for all existing users with country+grade
 * 3. Auto-joins users to their appropriate system communities
 *
 * Usage: node scripts/migrate-existing-communities.js
 *
 * WARNING: This script should only be run once during migration!
 */

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function markExistingCommunitiesAsUserCreated() {
  console.log("[Migration] Marking existing communities as user-created...");

  const result = await db.community.updateMany({
    where: {},
    data: {
      isSystemGenerated: false,
    },
  });

  console.log(`[Migration] Updated ${result.count} existing communities`);
  return result.count;
}

async function createSystemCommunitiesForUsers() {
  console.log("[Migration] Creating system communities for existing users...");

  // Get all users with both country and grade set
  const users = await db.user.findMany({
    where: {
      country: { not: null },
      grade: { not: null },
    },
    select: {
      id: true,
      country: true,
      grade: true,
    },
  });

  console.log(`[Migration] Found ${users.length} users with country and grade`);

  // Group users by country+grade
  const communityMap = new Map();

  for (const user of users) {
    const key = `${user.country}__${user.grade}`;
    if (!communityMap.has(key)) {
      communityMap.set(key, {
        country: user.country,
        grade: user.grade,
        users: [],
      });
    }
    communityMap.get(key).users.push(user.id);
  }

  console.log(
    `[Migration] Need to create ${communityMap.size} unique system communities`,
  );

  let createdCount = 0;
  let joinedCount = 0;

  for (const [key, data] of communityMap) {
    try {
      const { country, grade, users } = data;

      // Check if community already exists
      let community = await db.community.findFirst({
        where: {
          isSystemGenerated: true,
          country,
          grade,
        },
      });

      // Create if doesn't exist
      if (!community) {
        const nameKey = `communities.${country.toLowerCase().replace(/\s+/g, "_")}_${grade.toLowerCase().replace(/\s+/g, "_")}`;

        community = await db.community.create({
          data: {
            name: `${country} - ${grade}`,
            nameKey,
            isSystemGenerated: true,
            country,
            grade,
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

        createdCount++;
        console.log(`[Migration] Created community: ${country} - ${grade}`);
      }

      // Join all users to this community
      for (const userId of users) {
        try {
          // Add as community member
          await db.communityMember.upsert({
            where: {
              userId_communityId: {
                userId,
                communityId: community.id,
              },
            },
            create: {
              userId,
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
                  userId,
                },
              },
              create: {
                chatId: mainChat.id,
                userId,
                role: "member",
              },
              update: {},
            });
          }

          joinedCount++;
        } catch (error) {
          console.error(
            `[Migration] Error joining user ${userId} to community:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error(`[Migration] Error creating community for ${key}:`, error);
    }
  }

  console.log(`[Migration] Created ${createdCount} system communities`);
  console.log(`[Migration] Joined ${joinedCount} users to their communities`);

  return { createdCount, joinedCount };
}

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("COMMUNITY MIGRATION SCRIPT");
    console.log("=".repeat(60));
    console.log("Start time:", new Date().toISOString());
    console.log();

    // Step 1: Mark existing communities
    const markedCount = await markExistingCommunitiesAsUserCreated();
    console.log();

    // Step 2: Create system communities and join users
    const { createdCount, joinedCount } =
      await createSystemCommunitiesForUsers();
    console.log();

    console.log("=".repeat(60));
    console.log("MIGRATION COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log("Summary:");
    console.log(
      `  - Marked ${markedCount} existing communities as user-created`,
    );
    console.log(`  - Created ${createdCount} new system communities`);
    console.log(`  - Joined ${joinedCount} users to their system communities`);
    console.log("End time:", new Date().toISOString());
    console.log("=".repeat(60));

    await db.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("=".repeat(60));
    console.error("MIGRATION FAILED");
    console.error("=".repeat(60));
    console.error("Error:", error);
    console.error("=".repeat(60));

    await db.$disconnect();
    process.exit(1);
  }
}

// Confirmation check
if (process.argv.includes("--confirm")) {
  main();
} else {
  console.log("=".repeat(60));
  console.log("MIGRATION SCRIPT - CONFIRMATION REQUIRED");
  console.log("=".repeat(60));
  console.log();
  console.log("This script will:");
  console.log("1. Mark all existing communities as user-created");
  console.log("2. Create system communities for users with country+grade");
  console.log("3. Auto-join users to their system communities");
  console.log();
  console.log("⚠️  WARNING: This should only be run once!");
  console.log();
  console.log(
    "To proceed, run: node scripts/migrate-existing-communities.js --confirm",
  );
  console.log("=".repeat(60));
  process.exit(0);
}
