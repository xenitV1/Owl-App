const fs = require('fs');
const path = require('path');

// Environment'a göre şema generate eden script
function generateSchema() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const isDevelopment = !isProduction;

  // Base schema içeriği
  const baseSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${isProduction ? 'postgresql' : 'sqlite'}"
  url       = env("DATABASE_URL")${isProduction ? '\n  directUrl = env("DIRECT_URL")' : ''}
}`;

  // Model tanımlarını oku
  const modelsPath = path.join(__dirname, '..', 'prisma', 'models.prisma');
  let modelsContent = '';

  if (fs.existsSync(modelsPath)) {
    modelsContent = fs.readFileSync(modelsPath, 'utf8');
  } else {
    // Eğer ayrı models dosyası yoksa, mevcut schema'dan model'ları çıkar
    const currentSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (fs.existsSync(currentSchemaPath)) {
      const currentSchema = fs.readFileSync(currentSchemaPath, 'utf8');
      // generator ve datasource'dan sonraki kısmı al
      const lines = currentSchema.split('\n');
      const modelStartIndex = lines.findIndex(line =>
        !line.startsWith('generator') &&
        !line.startsWith('datasource') &&
        !line.startsWith('//') &&
        line.trim() !== ''
      );
      if (modelStartIndex !== -1) {
        modelsContent = lines.slice(modelStartIndex).join('\n');
      }
    }
  }

  // Tam şema oluştur
  const fullSchema = baseSchema + '\n\n' + modelsContent;

  // Schema dosyasını yaz
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  fs.writeFileSync(schemaPath, fullSchema);

  console.log(`✅ Schema generated for ${isProduction ? 'production (PostgreSQL)' : 'development (SQLite)'}`);
}

// Script çalıştır
if (require.main === module) {
  generateSchema();
}

module.exports = { generateSchema };
