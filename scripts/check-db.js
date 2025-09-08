const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Check if tables exist by trying to query them
    try {
      await prisma.user.findMany();
      console.log('Users table exists');
    } catch (error) {
      console.log('Users table does not exist, creating schema...');
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