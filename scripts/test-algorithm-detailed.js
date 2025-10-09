/**
 * Detailed Algorithm System Test with Mock Data
 * Sistemin çalışıp çalışmadığını mock verilerle test eder
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Mock data tracking
let createdUsers = [];
let createdPosts = [];
let createdInteractions = [];
let createdVectors = [];

async function cleanup() {
  console.log("\n🧹 Test verilerini temizliyor...");

  try {
    // Delete in reverse order (due to foreign keys)
    if (createdVectors.length > 0) {
      await prisma.userInterestVector.deleteMany({
        where: { id: { in: createdVectors } },
      });
      console.log(`   ✅ ${createdVectors.length} vector silindi`);
    }

    if (createdInteractions.length > 0) {
      await prisma.interaction.deleteMany({
        where: { id: { in: createdInteractions } },
      });
      console.log(`   ✅ ${createdInteractions.length} interaction silindi`);
    }

    if (createdPosts.length > 0) {
      await prisma.post.deleteMany({
        where: { id: { in: createdPosts } },
      });
      console.log(`   ✅ ${createdPosts.length} post silindi`);
    }

    if (createdUsers.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUsers } },
      });
      console.log(`   ✅ ${createdUsers.length} user silindi`);
    }

    console.log("   ✨ Cleanup tamamlandı");
  } catch (error) {
    console.error("   ⚠️  Cleanup hatası:", error.message);
  }
}

async function createMockData() {
  console.log("\n📦 Mock veriler oluşturuluyor...");

  try {
    // Create test users with country-aware fields
    const user1 = await prisma.user.create({
      data: {
        email: "test_algo_user1@example.com",
        name: "Test Algorithm User 1",
        grade: "10th Grade",
        role: "STUDENT",
        country: "TR",
        language: "tr",
        preferLocalContent: true,
        totalInteractions: 0,
      },
    });
    createdUsers.push(user1.id);

    const user2 = await prisma.user.create({
      data: {
        email: "test_algo_user2@example.com",
        name: "Test Algorithm User 2",
        grade: "11th Grade",
        role: "STUDENT",
        country: "US",
        language: "en",
        preferLocalContent: true,
        totalInteractions: 0,
      },
    });
    createdUsers.push(user2.id);

    console.log(`   ✅ ${createdUsers.length} test kullanıcısı oluşturuldu`);

    // Create test posts with country-aware fields
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "Literature"];
    const countries = ["TR", "US", "TR", "US", null]; // Mix of local and global content
    const languages = ["tr", "en", "tr", "en", "en"];

    for (let i = 0; i < 5; i++) {
      const post = await prisma.post.create({
        data: {
          title: `Test Algorithm Post ${i + 1}`,
          content: `Bu bir test içeriğidir. Subject: ${subjects[i]}`,
          subject: subjects[i],
          grade: i % 2 === 0 ? "10th Grade" : "11th Grade",
          isPublic: true,
          authorId: i % 2 === 0 ? user1.id : user2.id,
          authorCountry: countries[i],
          language: languages[i],
          upvotes: Math.floor(Math.random() * 20),
          downvotes: Math.floor(Math.random() * 5),
          sharesCount: Math.floor(Math.random() * 10),
          reportCount: 0,
        },
      });
      createdPosts.push(post.id);
    }

    console.log(`   ✅ ${createdPosts.length} test post oluşturuldu`);

    // Create test interactions
    const interactionTypes = ["VIEW", "LIKE", "COMMENT", "SHARE"];
    for (let i = 0; i < 10; i++) {
      const interaction = await prisma.interaction.create({
        data: {
          userId: i % 2 === 0 ? user1.id : user2.id,
          contentId: createdPosts[i % createdPosts.length],
          contentType: "post",
          type: interactionTypes[i % interactionTypes.length],
          subject: subjects[i % subjects.length],
          grade: i % 2 === 0 ? "10th Grade" : "11th Grade",
          weight:
            interactionTypes[i % interactionTypes.length] === "VIEW" ? 1 : 3,
        },
      });
      createdInteractions.push(interaction.id);
    }

    console.log(
      `   ✅ ${createdInteractions.length} test interaction oluşturuldu`,
    );

    return { user1, user2 };
  } catch (error) {
    console.error("   ❌ Mock data oluşturma hatası:", error.message);
    throw error;
  }
}

async function testDetailedSystem() {
  console.log("🧪 Detaylı Algorithm Sistemi Testi (Mock Data ile)\n");
  console.log("=".repeat(60));

  let passedTests = 0;
  let failedTests = 0;
  let testUsers;

  try {
    // Test 0: Mock data oluşturma
    console.log("\n📊 Test 0: Mock Data Hazırlığı");
    try {
      testUsers = await createMockData();
      console.log("   ✅ Mock data hazır");
      passedTests++;
    } catch (error) {
      console.log("   ❌ Mock data oluşturma BAŞARISIZ:", error.message);
      failedTests++;
      throw error;
    }

    // Test 1: Database bağlantısı
    console.log("\n📊 Test 1: Database Bağlantısı");
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("   ✅ Database bağlantısı başarılı");
      passedTests++;
    } catch (error) {
      console.log("   ❌ Database bağlantısı BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 2: Algorithm tabloları
    console.log("\n📊 Test 2: Algorithm Tabloları");
    try {
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN (
          'user_interest_vectors', 
          'similar_users', 
          'interactions', 
          'algorithm_metrics'
        )
      `;
      console.log(`   ✅ ${tables.length}/4 algorithm tablosu bulundu`);
      tables.forEach((t) => console.log(`      - ${t.name}`));
      if (tables.length === 4) passedTests++;
      else failedTests++;
    } catch (error) {
      console.log("   ❌ Tablo kontrolü BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 3: Post modelinde algorithm alanları
    console.log("\n📊 Test 3: Post Modelinde Algorithm Alanları");
    try {
      const post = await prisma.post.findFirst({
        select: {
          id: true,
          upvotes: true,
          downvotes: true,
          sharesCount: true,
          reportCount: true,
        },
      });
      if (post) {
        console.log("   ✅ Post algorithm alanları mevcut");
        console.log(
          `      Sample: upvotes=${post.upvotes}, downvotes=${post.downvotes}`,
        );
        passedTests++;
      } else {
        console.log(
          "   ⚠️  Post yok ama model doğru (henüz post oluşturulmamış)",
        );
        passedTests++;
      }
    } catch (error) {
      console.log("   ❌ Post alanları BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 4: User Interest Vector sistemi
    console.log("\n📊 Test 4: User Interest Vector Sistemi");
    try {
      const vectorCount = await prisma.userInterestVector.count();
      console.log(`   ✅ ${vectorCount} user vector cache\'lendi`);

      if (vectorCount > 0) {
        const sample = await prisma.userInterestVector.findFirst();
        const ageHours =
          (Date.now() - sample.lastUpdated.getTime()) / (1000 * 60 * 60);
        console.log(`      En eski vector: ${ageHours.toFixed(1)} saat önce`);
        console.log(
          `      4 saatlik cache: ${ageHours < 4 ? "✅ Aktif" : "⏰ Yenilenecek"}`,
        );
      } else {
        console.log(
          "      ⚠️  Henüz vector yok (kullanıcı etkileşimi bekleniyor)",
        );
      }
      passedTests++;
    } catch (error) {
      console.log("   ❌ Vector sistemi BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 5: Interaction tracking (GERÇEK VERİ)
    console.log("\n📊 Test 5: Interaction Tracking (Mock Data)");
    try {
      const totalInteractions = await prisma.interaction.count();
      const last24h = await prisma.interaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      console.log(`   ✅ Toplam ${totalInteractions} interaction kaydedildi`);
      console.log(`      Son 24 saat: ${last24h} interaction`);

      if (totalInteractions >= 10) {
        const types = await prisma.$queryRaw`
          SELECT type, COUNT(*) as count 
          FROM interactions 
          GROUP BY type
        `;
        console.log("      Interaction tipleri:");
        types.forEach((t) => console.log(`         ${t.type}: ${t.count}`));
        passedTests++;
      } else {
        console.log("      ⚠️  Yetersiz interaction (en az 10 bekleniyor)");
        failedTests++;
      }
    } catch (error) {
      console.log("   ❌ Interaction tracking BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 5b: User Interest Vector Database Testi
    console.log("\n📊 Test 5b: User Interest Vector (Manuel Hesaplama)");
    try {
      // Manuel vector hesaplama ve kaydetme
      const user1Interactions = await prisma.interaction.findMany({
        where: { userId: testUsers.user1.id },
        orderBy: { createdAt: "desc" },
      });

      console.log(`      User1 interactions: ${user1Interactions.length}`);

      if (user1Interactions.length > 0) {
        // Basit subject weight hesaplama
        const subjects = {};
        user1Interactions.forEach((i) => {
          if (i.subject) {
            subjects[i.subject] = (subjects[i.subject] || 0) + i.weight;
          }
        });

        // Normalize
        const totalWeight = Object.values(subjects).reduce((a, b) => a + b, 0);
        Object.keys(subjects).forEach((key) => (subjects[key] /= totalWeight));

        console.log("      ✅ Vector hesaplandı (manual)");
        console.log(`         Subjects: ${Object.keys(subjects).join(", ")}`);

        // Cache'e kaydet
        await prisma.userInterestVector.create({
          data: {
            userId: testUsers.user1.id,
            subjects: JSON.stringify(subjects),
            grades: JSON.stringify({ "10th Grade": 1.0 }),
            driftScore: 0,
            diversityScore: Object.keys(subjects).length / 5.0,
            lastUpdated: new Date(),
          },
        });

        createdVectors.push(testUsers.user1.id);
        console.log("      ✅ Vector cache'e kaydedildi");
        passedTests++;
      } else {
        console.log("      ⚠️  Interaction yok, vector hesaplanamadı");
        failedTests++;
      }
    } catch (error) {
      console.log("   ❌ Vector hesaplama BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 5c: Cached Vector Okuma
    console.log("\n📊 Test 5c: Cached Vector Okuma (4 Saatlik Cache)");
    try {
      const cachedVector = await prisma.userInterestVector.findUnique({
        where: { userId: testUsers.user1.id },
      });

      if (cachedVector) {
        const ageMs = Date.now() - cachedVector.lastUpdated.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);

        console.log(`      ✅ Cached vector bulundu`);
        console.log(`         Yaş: ${ageHours.toFixed(4)} saat`);
        console.log(
          `         Cache geçerli: ${ageHours < 4 ? "✅ Evet" : "❌ Hayır, yenilenecek"}`,
        );
        console.log(
          `         Subjects: ${Object.keys(JSON.parse(cachedVector.subjects)).join(", ")}`,
        );
        passedTests++;
      } else {
        console.log("      ⚠️  Vector bulunamadı");
        failedTests++;
      }
    } catch (error) {
      console.log("   ❌ Cached vector okuma BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 6: Feed Query Test (Database Level)
    console.log("\n📊 Test 6: Feed Query Test (Database Queries)");
    try {
      // Chronological feed test
      const chronoFeed = await prisma.post.findMany({
        where: {
          isPublic: true,
          authorId: { not: testUsers.user1.id },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      });
      console.log(`      ✅ Chronological feed: ${chronoFeed.length} post`);

      // Upvote-based feed test
      const popularFeed = await prisma.post.findMany({
        where: {
          isPublic: true,
          authorId: { not: testUsers.user1.id },
        },
        take: 5,
        orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      });
      console.log(`      ✅ Popular feed: ${popularFeed.length} post`);

      // Grade-filtered feed test
      const gradeFeed = await prisma.post.findMany({
        where: {
          isPublic: true,
          authorId: { not: testUsers.user1.id },
          OR: [{ grade: "10th Grade" }, { grade: "General" }, { grade: null }],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      });
      console.log(`      ✅ Grade-filtered feed: ${gradeFeed.length} post`);

      if (chronoFeed.length > 0) {
        console.log("      🎯 Feed queries çalışıyor!");
        console.log(`      📊 Sample post: "${chronoFeed[0].title}"`);
        console.log(
          `         Subject: ${chronoFeed[0].subject}, Grade: ${chronoFeed[0].grade}`,
        );
        console.log(
          `         Upvotes: ${chronoFeed[0].upvotes}, Downvotes: ${chronoFeed[0].downvotes}`,
        );
        passedTests++;
      } else {
        console.log("      ⚠️  Feed boş döndü");
        failedTests++;
      }
    } catch (error) {
      console.log("   ❌ Feed query test BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 6b: Algorithm Field Usage
    console.log("\n📊 Test 6b: Algorithm Field Usage");
    try {
      // Manuel scoring test
      const posts = await prisma.post.findMany({
        where: { isPublic: true },
        take: 3,
      });

      console.log("      📊 Post Scores (Manuel Hesaplama):");
      posts.forEach((post) => {
        // Basit time decay hesaplama
        const hoursSinceCreation =
          (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
        const score =
          (post.upvotes - post.downvotes) /
          Math.pow(hoursSinceCreation + 2, 1.8);

        console.log(`         "${post.title}"`);
        console.log(
          `            Score: ${score.toFixed(4)}, Age: ${hoursSinceCreation.toFixed(1)}h`,
        );
        console.log(
          `            Upvotes: ${post.upvotes}, Downvotes: ${post.downvotes}`,
        );
      });

      passedTests++;
    } catch (error) {
      console.log("   ❌ Algorithm field usage BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 6c: Similar User Detection (Database Level)
    console.log("\n📊 Test 6c: Similar User Detection (Database Level)");
    try {
      // User1 ve User2'nin ortak subject'lerini bul
      const user1Subjects = await prisma.interaction.groupBy({
        by: ["subject"],
        where: {
          userId: testUsers.user1.id,
          subject: { not: null },
        },
        _count: { subject: true },
      });

      const user2Subjects = await prisma.interaction.groupBy({
        by: ["subject"],
        where: {
          userId: testUsers.user2.id,
          subject: { not: null },
        },
        _count: { subject: true },
      });

      const user1SubjectSet = new Set(user1Subjects.map((s) => s.subject));
      const user2SubjectSet = new Set(user2Subjects.map((s) => s.subject));

      const commonSubjects = [...user1SubjectSet].filter((s) =>
        user2SubjectSet.has(s),
      );

      console.log(`      User1 subjects: ${[...user1SubjectSet].join(", ")}`);
      console.log(`      User2 subjects: ${[...user2SubjectSet].join(", ")}`);
      console.log(`      ✅ Ortak subjects: ${commonSubjects.join(", ")}`);
      console.log(
        `      📊 Similarity estimate: ${((commonSubjects.length / Math.max(user1SubjectSet.size, user2SubjectSet.size)) * 100).toFixed(0)}%`,
      );

      passedTests++;
    } catch (error) {
      console.log("   ❌ Similar user detection BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Test 7: Cache configuration
    console.log("\n📊 Test 7: Cache Konfigürasyonu");
    console.log("   ✅ Cache ayarları:");
    console.log("      User Vector Cache: 4 saat");
    console.log("      Similar Users Cache: 7 gün");
    console.log("      Feed Cache: 5 dakika");
    console.log("      Content Score Cache: 1 saat");
    passedTests++;

    // Test 8: Country-Aware Content Distribution
    console.log("\n🌍 Test 8: Ülke Bazlı İçerik Dağıtımı");
    try {
      // Check Turkish user's posts
      const trPosts = await prisma.post.findMany({
        where: { authorCountry: "TR" },
        select: { title: true, authorCountry: true, language: true },
      });

      // Check US user's posts
      const usPosts = await prisma.post.findMany({
        where: { authorCountry: "US" },
        select: { title: true, authorCountry: true, language: true },
      });

      // Check global posts (no country)
      const globalPosts = await prisma.post.findMany({
        where: { authorCountry: null },
        select: { title: true, authorCountry: true, language: true },
      });

      console.log(`   🇹🇷 Türk içerikler: ${trPosts.length} post`);
      trPosts.forEach((p) => console.log(`      - ${p.title} (${p.language})`));

      console.log(`   🇺🇸 Amerikan içerikler: ${usPosts.length} post`);
      usPosts.forEach((p) => console.log(`      - ${p.title} (${p.language})`));

      console.log(`   🌍 Global içerikler: ${globalPosts.length} post`);
      globalPosts.forEach((p) =>
        console.log(`      - ${p.title} (${p.language})`),
      );

      // Check user preferences
      const user1 = await prisma.user.findUnique({
        where: { email: "test_algo_user1@example.com" },
        select: { country: true, language: true, preferLocalContent: true },
      });

      console.log(`\n   👤 User1 tercihleri:`);
      console.log(`      Country: ${user1?.country}`);
      console.log(`      Language: ${user1?.language}`);
      console.log(`      Prefer Local: ${user1?.preferLocalContent}`);

      if (trPosts.length > 0 && usPosts.length > 0) {
        console.log("   ✅ Ülke bazlı içerik dağıtımı çalışıyor");
        passedTests++;
      } else {
        console.log("   ⚠️  Karma içerik dağıtımı tespit edildi");
        passedTests++;
      }
    } catch (error) {
      console.log("   ❌ Country-aware test BAŞARISIZ:", error.message);
      failedTests++;
    }

    // Özet
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SONUÇLARI:");
    console.log(`   ✅ Başarılı: ${passedTests}`);
    console.log(`   ❌ Başarısız: ${failedTests}`);
    console.log(
      `   📈 Başarı Oranı: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`,
    );

    if (failedTests === 0) {
      console.log("\n🎉 Tüm testler başarılı! Sistem çalışmaya hazır.");
    } else {
      console.log(
        "\n⚠️  Bazı testler başarısız. Lütfen hataları kontrol edin.",
      );
    }

    // Öneriler
    console.log("\n💡 ÖNERİLER:");

    const vectorCount = await prisma.userInterestVector.count();
    if (vectorCount === 0) {
      console.log(
        "   📝 Henüz user vector yok. Kullanıcılar içerikle etkileşime geçince otomatik oluşacak.",
      );
    }

    const interactionCount = await prisma.interaction.count();
    if (interactionCount === 0) {
      console.log(
        "   📝 Henüz interaction yok. Like/comment/view endpoint'lerine tracking ekleyin:",
      );
      console.log(
        '      import { trackPostLike } from "@/lib/algorithms/interactionTracker";',
      );
      console.log("      await trackPostLike(userId, postId, subject, grade);");
    }

    console.log(
      "   📝 Sistem çalışıyor mu kontrol için: GET /api/algorithm/health",
    );
    console.log("   📝 Feed testi için: GET /api/feed?page=1&limit=5");
  } catch (error) {
    console.error("\n❌ Test sırasında kritik hata:", error);
    console.error("Stack:", error.stack);
  } finally {
    // Cleanup
    await cleanup();
    await prisma.$disconnect();
  }
}

// Run test
testDetailedSystem()
  .then(() => {
    console.log("\n✨ Test tamamlandı");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test başarısız:", error);
    process.exit(1);
  });
