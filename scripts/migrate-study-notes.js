/**
 * Migration Script: Add StudyNote table to database
 * Run with: node scripts/migrate-study-notes.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("📚 Starting StudyNote migration...\n");

try {
  // Check if migration already exists
  const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Create migration
  console.log("1️⃣ Creating Prisma migration...");
  execSync("npx prisma migrate dev --name add_study_notes --create-only", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("\n2️⃣ Applying migration...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("\n3️⃣ Generating Prisma client...");
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("\n✅ Migration completed successfully!");
  console.log("\n📝 StudyNote table has been added to the database.");
  console.log("   - Users can now save study notes");
  console.log("   - Generate flashcards/questions from saved notes");
  console.log("   - API endpoints ready at /api/study-notes\n");
} catch (error) {
  console.error("\n❌ Migration failed:", error.message);
  console.error("\nPlease try running manually:");
  console.error("  1. npx prisma migrate dev --name add_study_notes");
  console.error("  2. npx prisma generate\n");
  process.exit(1);
}
