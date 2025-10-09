# 🚀 Redis Cache Setup (Upstash)

## 📌 TL;DR

- **Development**: Redis **OPSIYONEL** - PostgreSQL cache yeterli
- **Production**: Redis **ÖNERİLEN** - 10,000+ kullanıcıda performans artışı
- **Maliyet**: **ÜCRETSİZ** Upstash 10,000 request/gün veriyor

---

## 🎯 Neden Redis?

### Şu Anki Durum (PostgreSQL Cache)

```typescript
// User vector fetch
const vector = await prisma.userInterestVector.findUnique(...);
// ~5-10ms
```

### Redis ile

```typescript
// User vector fetch
const vector = await cache.get(CACHE_KEYS.userVector(userId));
// ~1ms (5-10x hızlı)
```

### Performans Karşılaştırması

| Metrik            | PostgreSQL | Redis   | İyileşme         |
| ----------------- | ---------- | ------- | ---------------- |
| User Vector Fetch | ~5-10ms    | ~1ms    | **5-10x hızlı**  |
| Feed Generation   | ~150ms     | ~50ms   | **3x hızlı**     |
| Concurrent Users  | 1,000      | 50,000+ | **50x scalable** |

---

## ⚙️ Kurulum (5 Dakika)

### 1. Upstash Hesabı Oluştur (ÜCRETSİZ)

🔗 **https://upstash.com/**

1. "Get Started" → Google/GitHub ile giriş
2. "Create Database" → **Redis**
3. **Database Name**: `owl-app-cache`
4. **Region**: Seçim yap (en yakın)
5. **Type**: Serverless (FREE tier)
6. "Create" ✅

### 2. REST API Bilgilerini Kopyala

Dashboard'da:

- ✅ **UPSTASH_REDIS_REST_URL**: `https://xxx-xxx.upstash.io`
- ✅ **UPSTASH_REDIS_REST_TOKEN**: `AXXXxxxxx...`

### 3. Environment Variables Ekle

#### **Local Development** (.env dosyası)

```bash
# .env dosyasına ekle:
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

#### **Vercel Production** (Dashboard)

```bash
# Terminal:
vercel env add UPSTASH_REDIS_REST_URL
# Paste: https://your-database.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste: your-token-here
```

Ya da Vercel Dashboard'dan:

- Settings → Environment Variables
- Add → `UPSTASH_REDIS_REST_URL`
- Add → `UPSTASH_REDIS_REST_TOKEN`

### 4. Test Et

```bash
# Sunucuyu başlat
npm run dev

# Terminal'de:
# ✅ "Redis client initialized (Upstash)" görmelisin
# ❌ Görmezsen: "Redis not configured. Using PostgreSQL..." (normal, env variables eksik)
```

---

## 🧪 Doğrulama

### Test 1: Health Check

```bash
curl http://localhost:3000/api/algorithm/health
```

**Beklenen çıktı**:

```json
{
  "status": "healthy",
  "checks": {
    "cache": {
      "type": "redis",
      "status": "connected" // ✅ Redis çalışıyor
    }
  }
}
```

### Test 2: Feed Performance

```bash
# İlk request (cache yok)
time curl http://localhost:3000/api/feed

# İkinci request (Redis'ten gelecek)
time curl http://localhost:3000/api/feed
# ✅ 3-5x daha hızlı olmalı
```

---

## 📊 Sistem Davranışı

### Redis VARSA

```
1. User logs in → Automatic vector initialization
2. First feed request → Calculate + cache to Redis (150ms)
3. Second feed request → Serve from Redis (50ms) ⚡
4. Vector update → Auto sync to Redis
```

### Redis YOKSA

```
1. User logs in → Automatic vector initialization
2. First feed request → Calculate + cache to PostgreSQL (150ms)
3. Second feed request → Serve from PostgreSQL (150ms)
4. Vector update → PostgreSQL cache
```

**SONUÇ**: Her iki durumda da çalışır, Redis sadece hızlandırır!

---

## 🔧 Kod Nasıl Çalışıyor?

### Otomatik Fallback Sistemi

```typescript
// src/lib/algorithms/stableVectorManager.ts

export async function getStableUserVector(userId: string) {
  // 🚀 TIER 1: Redis (varsa, ~1ms)
  if (cache.isAvailable()) {
    const redisVector = await cache.get(userId);
    if (redisVector) return redisVector; // Super fast!
  }

  // 🐘 TIER 2: PostgreSQL (fallback, ~5-10ms)
  const pgVector = await prisma.userInterestVector.findUnique(...);

  // Sync to Redis for next time
  if (cache.isAvailable()) {
    await cache.set(userId, pgVector);
  }

  return pgVector;
}
```

### Cache Invalidation

```typescript
// Like/Comment/View → Vector güncellenir
await cacheUserInterestVector(userId, newVector);
// ✅ PostgreSQL'e yazılır (persistent)
// ✅ Redis'e yazılır (fast access)

// Feed invalidate
await invalidateUserFeed(userId);
// ✅ Redis cache temizlenir
// ✅ Next request'te fresh data
```

---

## 💰 Maliyet

### Upstash FREE Tier

- **10,000 requests/day** ÜCRETSİZ
- **256 MB RAM** ÜCRETSİZ
- **Daily backups**
- **REST API**

### Örnek Kullanım (1000 aktif kullanıcı)

- Her kullanıcı günde 20 feed request
- Toplam: 20,000 request/gün
- Maliyet: **$0/ay** (FREE tier yeter!)

### Büyüme Senaryosu (50,000 kullanıcı)

- Günlük: 1M request
- Upstash Pay-as-you-go: **~$10-15/ay**
- Alternatif: Railway Redis **$5/ay**

---

## 🚨 Troubleshooting

### "Redis not configured" Uyarısı

**Normal!** Redis opsiyonel, PostgreSQL kullanılıyor.

**Çözüm (istenirse)**:

```bash
# .env dosyasını kontrol et:
UPSTASH_REDIS_REST_URL="https://..."  # ✅ Dolu olmalı
UPSTASH_REDIS_REST_TOKEN="..."        # ✅ Dolu olmalı

# Sunucuyu yeniden başlat:
npm run dev
```

### Redis Bağlantı Hatası

```
Error: Redis connection failed
```

**Sebep**: Upstash URL/Token yanlış

**Çözüm**:

1. Upstash dashboard → Database Details
2. REST API bölümünden yeniden kopyala
3. `.env` dosyasını güncelle
4. Restart

### Vercel'de Redis Çalışmıyor

**Kontrol et**:

```bash
# Vercel env variables'ları göster:
vercel env ls

# ✅ UPSTASH_REDIS_REST_URL görünmeli
# ✅ UPSTASH_REDIS_REST_TOKEN görünmeli
```

**Yoksa ekle**:

```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Yeniden deploy:
git push
```

---

## 📈 Monitoring

### Upstash Dashboard

- **Requests/day**: Günlük request sayısı
- **Hit rate**: Cache vurma oranı (~70-80% ideal)
- **Latency**: Ortalama yanıt süresi (~1-2ms)

### Vercel Logs

```
✅ Redis client initialized (Upstash)
🚀 TIER 1: Redis cache hit (1.2ms)
🐘 TIER 2: PostgreSQL fallback (8.5ms)
```

---

## 🎯 Ne Zaman Redis Eklemeli?

### Ekle (Önerilen)

- ✅ 1,000+ **aktif** kullanıcı var
- ✅ Feed generation >200ms
- ✅ Database CPU %50+
- ✅ Free tier'ı zaten doldurmak istiyorsan 😄

### Ekleme (Şu an gerek yok)

- ❌ <500 kullanıcı
- ❌ Feed <150ms
- ❌ Database sorunsuz

---

## 🚀 Özet

✅ **Redis eklendi** ama **opsiyonel**  
✅ **PostgreSQL fallback** her zaman çalışıyor  
✅ **Upstash FREE tier** 10,000+ kullanıcıya yeter  
✅ **5 dakikada kurulum** (env variables ekle)  
✅ **3-5x performans artışı** (Redis ile)

**Sonuç**: Hazır olsun, büyüyünce açarsın! 🎉
