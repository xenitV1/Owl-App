const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking posts in database...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Check posts table
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            pools: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\nFound ${posts.length} posts in database:`);
    
    if (posts.length === 0) {
      console.log('No posts found. Database is empty.');
    } else {
      posts.forEach((post, index) => {
        console.log(`\n${index + 1}. Post ID: ${post.id}`);
        console.log(`   Title: ${post.title}`);
        console.log(`   Author: ${post.author.name} (${post.author.email})`);
        console.log(`   Subject: ${post.subject || 'N/A'}`);
        console.log(`   Image: ${post.image ? 'Yes' : 'No'}`);
        console.log(`   Likes: ${post._count.likes}, Comments: ${post._count.comments}, Saves: ${post._count.pools}`);
        console.log(`   Created: ${post.createdAt}`);
        console.log(`   Public: ${post.isPublic}`);
      });
    }

    // Check users table
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`\nFound ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    });

  } catch (error) {
    console.error('Database error:', error);
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
