// Script to clean up invalid image references in posts
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupInvalidImages() {
  console.log('🔍 Scanning for posts with invalid image references...\n');

  try {
    // Find posts with image field that looks like a filename (not a CUID)
    const posts = await prisma.post.findMany({
      where: {
        image: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        image: true,
      },
    });

    console.log(`Found ${posts.length} posts with images\n`);

    const invalidPosts = [];

    for (const post of posts) {
      // Check if image is a valid CUID (our system uses CUIDs for image IDs)
      // CUIDs are 25 characters long and alphanumeric
      const isCUID = /^[a-z0-9]{25}$/i.test(post.image);
      
      if (!isCUID) {
        invalidPosts.push(post);
        console.log(`❌ Invalid image reference: "${post.image}"`);
        console.log(`   Post: ${post.title.substring(0, 50)}...`);
        console.log(`   ID: ${post.id}\n`);
      }
    }

    if (invalidPosts.length === 0) {
      console.log('✅ No invalid image references found!');
      return;
    }

    console.log(`\n📊 Found ${invalidPosts.length} posts with invalid image references\n`);
    console.log('🧹 Cleaning up...\n');

    // Update posts to remove invalid image references
    for (const post of invalidPosts) {
      await prisma.post.update({
        where: { id: post.id },
        data: { image: null },
      });
      console.log(`✅ Cleaned: ${post.title.substring(0, 50)}...`);
    }

    console.log(`\n✅ Cleanup complete! Removed ${invalidPosts.length} invalid image references.`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInvalidImages();

