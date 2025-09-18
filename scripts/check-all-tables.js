const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking all database tables...');

  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    // Check all tables
    const tables = [
      'user', 'post', 'community', 'privateGroup', 'communityMember', 
      'groupMember', 'follow', 'comment', 'like', 'pool', 'poolCategory',
      'notification', 'report', 'userBlock', 'userMute', 'moderationAction',
      'appeal', 'contentFilter', 'adminActivityLog', 'waitlist'
    ];

    for (const table of tables) {
      try {
        // Try to count records in each table
        const modelName = table.charAt(0).toUpperCase() + table.slice(1);
        const result = await prisma[table].count();
        console.log(`✓ ${table} table exists with ${result} records`);
      } catch (error) {
        console.log(`✗ ${table} table: ${error.message}`);
      }
    }

    console.log('Database schema check completed');
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });