const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Production database schema güncelleniyor...');

  try {
    await prisma.$connect();
    console.log('✅ Database bağlantısı başarılı');

    // Waitlist tablosunun varlığını kontrol et
    try {
      const waitlistCount = await prisma.waitlist.count();
      console.log(`✅ Waitlist tablosu mevcut - ${waitlistCount} kayıt var`);
    } catch (error) {
      console.log('❌ Waitlist tablosu bulunamadı:', error.message);
      console.log('🔧 Lütfen "npm run db:push" komutunu çalıştırın');
    }

    // Tüm tabloları kontrol et
    const tables = [
      'user', 'post', 'community', 'privateGroup', 'communityMember', 
      'groupMember', 'follow', 'comment', 'like', 'pool', 'poolCategory',
      'notification', 'report', 'userBlock', 'userMute', 'moderationAction',
      'appeal', 'contentFilter', 'adminActivityLog', 'waitlist'
    ];

    console.log('\n📊 Tablo durumu:');
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`✅ ${table}: ${count} kayıt`);
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }

    console.log('\n🎉 Schema kontrolü tamamlandı');
  } catch (error) {
    console.error('❌ Database hatası:', error);
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
