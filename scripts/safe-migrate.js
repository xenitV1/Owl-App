const { execSync } = require("child_process");

/**
 * Safe migration script for production deployments
 * - Only runs on production/Vercel environments
 * - Uses 'prisma migrate deploy' which is data-safe
 * - Never drops or recreates tables (preserves data)
 * - Skips gracefully if no DATABASE_URL
 */
async function safeMigrate() {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL;
  const hasDatabase = !!process.env.DATABASE_URL;
  const isDevelopment = !isProduction;

  // Skip migration in development (use 'npm run db:migrate' instead)
  if (isDevelopment) {
    console.log("⏭️ Skipping migrations in development mode");
    console.log('💡 Use "npm run db:migrate" for development migrations');
    return;
  }

  // Skip if no database URL configured
  if (!hasDatabase) {
    console.log("⚠️ DATABASE_URL not found - skipping migrations");
    return;
  }

  try {
    console.log("🗄️ Running production database migrations...");
    console.log("📊 Migration type: SAFE (preserves existing data)");

    // prisma migrate deploy:
    // - Only applies pending migrations
    // - Never drops tables or data
    // - Production-safe command
    // - Idempotent (can run multiple times safely)
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
    });

    console.log("✅ Migrations completed successfully");
    console.log("💾 All existing data preserved");
  } catch (error) {
    console.error("❌ Migration failed!");
    console.error("Error:", error.message);

    // In production, fail the build if migration fails
    // This prevents deploying broken code
    if (isProduction) {
      console.error("🛑 Build stopped - fix migrations before deploying");
      process.exit(1);
    }
  }
}

// Run migration
safeMigrate().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
