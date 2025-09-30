#!/usr/bin/env node

/**
 * Firebase'den NextAuth'a API Route Migration Script
 *
 * Bu script kalan tüm API route'larında Firebase token kullanımını
 * NextAuth session kullanımına çevirir.
 *
 * Kullanım: node scripts/migrate-api-routes.js
 */

const fs = require('fs');
const path = require('path');

// Firebase kullanan API route'ları (kritik olanlar hariç)
const apiRoutesToMigrate = [
  'src/app/api/posts/route.ts',
  'src/app/api/communities/route.ts',
  'src/app/api/blocks/route.ts',
  'src/app/api/blocks/status/[userId]/route.ts',
  'src/app/api/follow/route.ts',
  'src/app/api/platform-content/route.ts',
  'src/app/api/posts/[id]/route.ts',
  'src/app/api/users/comments/route.ts',
  'src/app/api/recommendations/route.ts',
  'src/app/api/users/posts/route.ts',
  'src/app/api/users/likes/route.ts',
  'src/app/api/comments/[id]/route.ts',
  'src/app/api/pools/route.ts',
  'src/app/api/spotify/auth/route.ts',
  'src/app/api/users/[id]/following/route.ts',
  'src/app/api/users/[id]/followers/route.ts',
  'src/app/api/pool-categories/route.ts',
  'src/app/api/pools/[id]/route.ts',
  'src/app/api/pool-categories/[id]/route.ts',
  'src/app/api/user/preferences/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/reports/[id]/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/mutes/route.ts',
  'src/app/api/mutes/[id]/route.ts',
  'src/app/api/content-filters/route.ts',
  'src/app/api/content-filters/[id]/route.ts',
  'src/app/api/follow/[id]/status/route.ts',
  'src/app/api/appeals/route.ts',
  'src/app/api/appeals/[id]/route.ts',
  'src/app/api/blocks/[id]/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/stats/route.ts',
  'src/app/api/admin/analytics/route.ts',
  'src/app/api/admin/activity-logs/route.ts',
];

function migrateApiRoute(filePath) {
  console.log(`\n🔄 Migrating ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 1. Import'ları güncelle
    if (content.includes("verifyIdToken")) {
      // verifyIdToken import'unu kaldır
      content = content.replace(
        /import\s*{\s*verifyIdToken\s*}\s*from\s*['"]@\/lib\/firebase-admin['"];?\s*/g,
        ''
      );
      hasChanges = true;
    }

    if (content.includes("decodeFromBase64")) {
      // decodeFromBase64 fonksiyonunu kaldır
      content = content.replace(
        /\/\/ Helper function to decode base64 strings that may contain Unicode[\s\S]*?};\s*/g,
        ''
      );
      hasChanges = true;
    }

    // getServerSession import'unu ekle (eğer yoksa)
    if (!content.includes('getServerSession') && content.includes('NextRequest')) {
      content = content.replace(
        /import\s*{\s*NextRequest,\s*NextResponse\s*}\s*from\s*['"]next\/server['"];?\s*/,
        `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';`
      );
      hasChanges = true;
    }

    // 2. Firebase token kodunu NextAuth session koduyla değiştir
    const firebaseTokenPattern = /let\s+userEmail:\s*string\s*\|\s*null\s*=\s*null;[\s\S]*?if\s*\(\s*!userEmail\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\);\s*\}/g;

    if (firebaseTokenPattern.test(content)) {
      content = content.replace(
        firebaseTokenPattern,
        `// Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }`
      );
      hasChanges = true;
    }

    // 3. User sorgularını güncelle
    content = content.replace(
      /where:\s*\{\s*email:\s*userEmail\s*\}/g,
      "where: { email: session.user.email }"
    );

    // 4. Development fallback kodunu kaldır
    content = content.replace(
      /\/\/ Development fallback[\s\S]*?}\s*}\s*}\s*}/g,
      ''
    );

    // Değişiklik varsa dosyayı kaydet
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} migrated successfully`);
    } else {
      console.log(`⚠️  ${filePath} no changes needed`);
    }

  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting Firebase to NextAuth API Route Migration');
  console.log('==================================================');

  let migratedCount = 0;
  let errorCount = 0;

  for (const routePath of apiRoutesToMigrate) {
    try {
      migrateApiRoute(routePath);
      migratedCount++;
    } catch (error) {
      console.error(`❌ Failed to migrate ${routePath}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${migratedCount} files`);
  console.log(`❌ Failed migrations: ${errorCount} files`);

  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test the migrated API routes');
    console.log('2. Update client-side code to use NextAuth session');
    console.log('3. Remove Firebase dependencies');
    console.log('4. Clean up environment variables');
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { migrateApiRoute, main };
