#!/usr/bin/env node

/**
 * Favicon Test Script
 * Favicon dosyalarının erişilebilirliğini ve doğru yapılandırıldığını test eder
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Test edilecek favicon dosyaları
const faviconFiles = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon-48x48.png",
  "favicon-64x64.png",
  "favicon-128x128.png",
  "favicon-180x180.png",
  "favicon-192x192.png",
  "favicon-512x512.png",
  "apple-touch-icon.png",
  "favicon.svg",
  "logo.png",
  "manifest.json",
  "browserconfig.xml",
];

// Test URL'leri
const testUrls = [
  "https://owl-app.com",
  "https://www.owl-app.com",
  "https://owl-app.com/coming-soon",
  "https://owl-app.com/tr/coming-soon",
  "https://owl-app.com/en/coming-soon",
];

function checkLocalFiles() {
  console.log("🔍 Yerel favicon dosyalarını kontrol ediliyor...");
  console.log("");

  const publicDir = path.join(__dirname, "..", "public");
  const results = [];

  faviconFiles.forEach((file) => {
    const filePath = path.join(publicDir, file);
    const exists = fs.existsSync(filePath);

    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round((stats.size / 1024) * 100) / 100;
      results.push({
        file,
        status: "✅ MEVCUT",
        size: `${sizeKB} KB`,
        lastModified: stats.mtime.toISOString().split("T")[0],
      });
    } else {
      results.push({
        file,
        status: "❌ EKSİK",
        size: "N/A",
        lastModified: "N/A",
      });
    }
  });

  // Sonuçları tablo halinde göster
  console.log("📋 Dosya Durumu:");
  console.log(
    "┌─────────────────────────┬─────────────┬─────────┬──────────────┐",
  );
  console.log(
    "│ Dosya                   │ Durum       │ Boyut   │ Son Değişim  │",
  );
  console.log(
    "├─────────────────────────┼─────────────┼─────────┼──────────────┤",
  );

  results.forEach((result) => {
    const file = result.file.padEnd(23);
    const status = result.status.padEnd(11);
    const size = result.size.padEnd(7);
    const lastModified = result.lastModified;
    console.log(`│ ${file} │ ${status} │ ${size} │ ${lastModified} │`);
  });

  console.log(
    "└─────────────────────────┴─────────────┴─────────┴──────────────┘",
  );
  console.log("");

  const missingFiles = results.filter((r) => r.status.includes("EKSİK"));
  if (missingFiles.length > 0) {
    console.log("⚠️  Eksik dosyalar:");
    missingFiles.forEach((file) => console.log(`   • ${file.file}`));
    console.log("");
  }

  return results;
}

function testUrl(url, faviconFile) {
  return new Promise((resolve) => {
    const fullUrl = `${url}/${faviconFile}`;
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol.get(fullUrl, (res) => {
      resolve({
        url: fullUrl,
        status: res.statusCode,
        contentType: res.headers["content-type"],
        size: res.headers["content-length"] || "unknown",
      });
    });

    req.on("error", (error) => {
      resolve({
        url: fullUrl,
        status: "ERROR",
        error: error.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url: fullUrl,
        status: "TIMEOUT",
        error: "Request timeout",
      });
    });
  });
}

async function testFaviconAccessibility() {
  console.log("🌐 Favicon dosyalarının web erişilebilirliği test ediliyor...");
  console.log("");

  const criticalFiles = [
    "favicon.ico",
    "favicon-32x32.png",
    "favicon-192x192.png",
  ];

  for (const url of testUrls) {
    console.log(`🔗 Test edilen URL: ${url}`);

    for (const file of criticalFiles) {
      const result = await testUrl(url, file);

      if (result.status === 200) {
        console.log(`   ✅ ${file} - ${result.status} (${result.contentType})`);
      } else if (result.status === "ERROR" || result.status === "TIMEOUT") {
        console.log(`   ❌ ${file} - ${result.status}: ${result.error}`);
      } else {
        console.log(`   ⚠️  ${file} - ${result.status}`);
      }
    }
    console.log("");
  }
}

function generateRecommendations(localResults) {
  console.log("💡 Tavsiyeler ve Sonraki Adımlar:");
  console.log("");

  const missingFiles = localResults.filter((r) => r.status.includes("EKSİK"));

  if (missingFiles.length === 0) {
    console.log("✅ Tüm favicon dosyaları mevcut!");
  } else {
    console.log("❌ Eksik dosyalar tespit edildi:");
    missingFiles.forEach((file) => {
      console.log(`   • ${file.file} - Bu dosyayı oluşturun`);
    });
    console.log("");
  }

  console.log("🔧 Google'da favicon görünürlüğünü artırmak için:");
  console.log(
    "   1. Favicon dosyalarının tüm sayfalarda erişilebilir olduğundan emin olun",
  );
  console.log("   2. Tarayıcı önbelleğini temizleyin");
  console.log(
    '   3. Google Search Console\'da "URL İnceleme" aracını kullanın',
  );
  console.log("   4. Site yeniden taranmasını isteyin");
  console.log("   5. Birkaç gün sonra Google arama sonuçlarında kontrol edin");
  console.log("");

  console.log("📊 Favicon dosya boyutları:");
  const sizeIssues = localResults.filter((r) => {
    if (r.status.includes("EKSİK")) return false;
    const sizeKB = parseFloat(r.size);
    return sizeKB > 100; // 100KB'den büyük dosyalar
  });

  if (sizeIssues.length > 0) {
    console.log("   ⚠️  Büyük dosyalar (optimize edilebilir):");
    sizeIssues.forEach((file) => {
      console.log(`      • ${file.file}: ${file.size}`);
    });
  } else {
    console.log("   ✅ Tüm dosya boyutları uygun");
  }
  console.log("");

  console.log("🎯 Test URL'leri:");
  testUrls.forEach((url) => {
    console.log(`   • ${url}/favicon.ico`);
    console.log(`   • ${url}/favicon-32x32.png`);
    console.log(`   • ${url}/favicon-192x192.png`);
  });
}

async function runTests() {
  console.log("🚀 Favicon Test Scripti Başlatılıyor...");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Yerel dosya kontrolü
    const localResults = checkLocalFiles();

    // Web erişilebilirlik testi (sadece kritik dosyalar için)
    await testFaviconAccessibility();

    // Tavsiyeler
    generateRecommendations(localResults);

    console.log("✅ Test tamamlandı!");
  } catch (error) {
    console.error("❌ Test hatası:", error.message);
    process.exit(1);
  }
}

// Script çalıştır
if (require.main === module) {
  runTests().catch((error) => {
    console.error("❌ Beklenmeyen hata:", error);
    process.exit(1);
  });
}

module.exports = { runTests, checkLocalFiles, testUrl };
