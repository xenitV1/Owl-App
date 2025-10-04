#!/usr/bin/env node

/**
 * Favicon Generator Script
 * Mevcut logo.png dosyasından farklı boyutlarda favicon dosyaları oluşturur
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Favicon boyutları (Google'ın önerdiği standart boyutlar)
const faviconSizes = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 64, name: "favicon-64x64.png" },
  { size: 128, name: "favicon-128x128.png" },
  { size: 180, name: "favicon-180x180.png" },
  { size: 192, name: "favicon-192x192.png" },
  { size: 512, name: "favicon-512x512.png" },
];

// Apple Touch Icon boyutu
const appleTouchIcon = { size: 180, name: "apple-touch-icon.png" };

async function generateFavicons() {
  const publicDir = path.join(__dirname, "..", "public");
  const sourceLogo = path.join(publicDir, "logo.png");

  // Kaynak logo dosyasının varlığını kontrol et
  if (!fs.existsSync(sourceLogo)) {
    console.error("❌ Hata: logo.png dosyası bulunamadı!");
    console.log("📁 Beklenen konum:", sourceLogo);
    process.exit(1);
  }

  console.log("🎯 Favicon dosyaları oluşturuluyor...");
  console.log("📁 Kaynak dosya:", sourceLogo);
  console.log("📁 Hedef klasör:", publicDir);
  console.log("");

  try {
    // Favicon dosyalarını oluştur
    for (const favicon of faviconSizes) {
      const outputPath = path.join(publicDir, favicon.name);

      await sharp(sourceLogo)
        .resize(favicon.size, favicon.size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 }, // Şeffaf arka plan
        })
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);

      console.log(
        `✅ ${favicon.name} (${favicon.size}x${favicon.size}) oluşturuldu`,
      );
    }

    // Apple Touch Icon oluştur
    const appleOutputPath = path.join(publicDir, appleTouchIcon.name);
    await sharp(sourceLogo)
      .resize(appleTouchIcon.size, appleTouchIcon.size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // Beyaz arka plan
      })
      .png({
        quality: 100,
        compressionLevel: 9,
      })
      .toFile(appleOutputPath);

    console.log(
      `✅ ${appleTouchIcon.name} (${appleTouchIcon.size}x${appleTouchIcon.size}) oluşturuldu`,
    );

    console.log("");
    console.log("🎉 Tüm favicon dosyaları başarıyla oluşturuldu!");
    console.log("");
    console.log("📋 Oluşturulan dosyalar:");
    faviconSizes.forEach((favicon) => {
      console.log(`   • ${favicon.name} (${favicon.size}x${favicon.size})`);
    });
    console.log(
      `   • ${appleTouchIcon.name} (${appleTouchIcon.size}x${appleTouchIcon.size})`,
    );
    console.log("");
    console.log("🔍 Sonraki adımlar:");
    console.log("   1. Favicon dosyalarının doğru yüklendiğini kontrol edin");
    console.log("   2. Tarayıcı önbelleğini temizleyin");
    console.log(
      "   3. Google Search Console'da site yeniden taranmasını isteyin",
    );
    console.log(
      "   4. Birkaç gün sonra Google arama sonuçlarında kontrol edin",
    );
  } catch (error) {
    console.error("❌ Favicon oluşturma hatası:", error.message);
    process.exit(1);
  }
}

// Script çalıştır
if (require.main === module) {
  generateFavicons().catch((error) => {
    console.error("❌ Beklenmeyen hata:", error);
    process.exit(1);
  });
}

module.exports = { generateFavicons, faviconSizes, appleTouchIcon };
