const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const prisma = new PrismaClient();

// Function to generate a unique username
async function generateUniqueUsername(name, email, existingUsernames) {
  let baseUsername;

  if (name) {
    // Use name as base, clean it up
    baseUsername = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_") // Replace non-alphanumeric with underscore
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
      .substring(0, 15); // Limit to 15 characters
  } else {
    // Use email prefix as base
    baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 15);
  }

  // If baseUsername is empty after cleaning, use a default
  if (!baseUsername || baseUsername.length < 3) {
    baseUsername = "user";
  }

  // Try to find a unique username
  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Add random suffix if not the first attempt
    if (attempts > 0) {
      // Use cryptographically secure random integer to prevent predictability
      const randomSuffix = crypto.randomInt(0, 10000);
      username = `${baseUsername}${randomSuffix}`;
    }

    // Check if username is unique (case-insensitive)
    const isUnique = !existingUsernames.some(
      (existing) => existing.toLowerCase() === username.toLowerCase(),
    );

    if (isUnique) {
      return username;
    }

    attempts++;
  }

  // If we couldn't find a unique username, use timestamp
  return `${baseUsername}${Date.now()}`;
}

async function main() {
  try {
    console.log("Starting username migration...");

    // Get all users without usernames
    const usersWithoutUsername = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: "" },
          { username: { isNull: true } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });

    console.log(`Found ${usersWithoutUsername.length} users without usernames`);

    if (usersWithoutUsername.length === 0) {
      console.log("All users already have usernames. Migration complete.");
      return;
    }

    // Get all existing usernames to check for uniqueness
    const existingUsers = await prisma.user.findMany({
      where: {
        username: {
          not: null,
          not: "",
        },
      },
      select: {
        username: true,
      },
    });

    const existingUsernames = existingUsers
      .map((u) => u.username)
      .filter(Boolean);

    console.log(`Found ${existingUsernames.length} existing usernames`);

    // Generate and update usernames
    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithoutUsername) {
      try {
        // Skip if user already has a username (double check)
        if (user.username && user.username.trim() !== "") {
          skippedCount++;
          continue;
        }

        const newUsername = await generateUniqueUsername(
          user.name,
          user.email,
          existingUsernames,
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { username: newUsername },
        });

        // Add to existing usernames for uniqueness check
        existingUsernames.push(newUsername);

        console.log(
          `Updated user ${user.email} (${user.name || "no name"}) -> username: ${newUsername}`,
        );
        updatedCount++;
      } catch (error) {
        console.error(`Error updating user ${user.id}:`, error);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Updated: ${updatedCount} users`);
    console.log(`Skipped: ${skippedCount} users`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
