# Gelişmiş Dinamik İçerik Öneri Algoritması

## Genel Bakış

Bu sistem, kullanıcılara kişiselleştirilmiş ve kaliteli içerik önerileri sunmak için 5 temel matematiksel algoritmanın güçlü yönlerini birleştirir ve 13 kritik soruna karşı önlemler içerir.

## Core Algoritmalar

### 1. Time-Decay Scoring (Hacker News Formula)

- **Dosya**: `timeDecayScoring.ts`
- **Özellikler**:
  - Minimal hesaplama (O(1) complexity)
  - Seasonal gravity adjustment (sınav vs tatil dönemleri)
  - Kanıtlanmış formül

### 2. Wilson Score (Reddit Best Algorithm)

- **Dosya**: `wilsonScore.ts`
- **Özellikler**:
  - Manipülasyona dayanıklı
  - Time-aware bot detection
  - İlk saatlerde şüpheli aktivite kontrolü

### 3. User Interest Vector (TF-IDF + Cosine Similarity)

- **Dosya**: `userInterestVector.ts`
- **Özellikler**:
  - Kişiselleştirilmiş öneriler
  - Vector pruning (memory leak önleme)
  - Diversity score tracking

### 4. Collaborative Filtering (User-User Similarity)

- **Dosya**: `collaborativeFiltering.ts`
- **Özellikler**:
  - Similar user bulma
  - Cold start cascade prevention
  - Minimum maturity requirements

### 5. Community Influence Score

- **Dosya**: `communityInfluence.ts`
- **Özellikler**:
  - Topluluk bazlı öneriler (placeholder - geliştirilecek)
  - Dinamik entegrasyon hazırlığı

## Koruma Mekanizmaları

### Drift Detection

- **Dosya**: `driftDetection.ts`
- Kullanıcı ilgilerinin zamanla değişimini tespit eder
- Grade transition'ları smooth olarak handle eder

### Diversity Injection

- **Dosya**: `diversityInjection.ts`
- Echo chamber oluşumunu önler
- Adaptive diversity configuration
- Serendipity posts

### Grade Level Matching

- **Dosya**: `gradeLevelMatching.ts`
- İçeriğin kullanıcının seviyesine uygunluğunu kontrol eder
- Hierarchy-based scoring

### Quality Filters

- **Dosya**: `qualityFilters.ts`
- Spam detection
- Author trust scoring
- Report count filtering

## Hybrid Scoring System

### Ana Sistem

- **Dosya**: `hybridScoring.ts`
- Tüm algoritmaları birleştirir
- Adaptive weights (cold start stratejisi)
- Grade match ve quality filter multipliers

### Cold Start Handler

- **Dosya**: `coldStartHandler.ts`
- Yeni kullanıcılar için özel stratejiler
- Grade-based default interests
- Progressive personalization

## Cache & Performance

### Cache Manager

- **Dosya**: `cacheManager.ts`
- Adaptive TTL (user activity bazlı)
- Activity level detection

### Smart Cache Manager

- **Dosya**: `../cache/smartCacheManager.ts`
- Stampede protection
- Staggered invalidation

### Fallback Strategies

- **Dosya**: `fallbackStrategies.ts`
- Circuit breaker pattern
- Multi-tier fallback (hybrid → simplified → chronological)

## Feed Generation

### Main Feed Generator

- **Dosya**: `feedGenerator.ts`
- `generateHybridFeed()` - Tam algoritma sistemi
- `generateSimplifiedFeed()` - Time Decay + Wilson
- `generateChronologicalFeed()` - Basit kronolojik sıralama

## Background Jobs

### Algorithm Jobs

- **Dosya**: `../jobs/algorithmJobs.ts`
- **Daily**: Drift detection, cleanup, vector pruning
- **Weekly**: Similar users recalculation, LSH index rebuild

## Monitoring

### Health Monitor

- **Dosya**: `../monitoring/algorithmHealthMonitor.ts`
- Performance metrics
- Cache hit rates
- Error tracking
- Automatic alerting

## API Endpoints

### Feed Endpoint

- **Route**: `/api/feed`
- Hybrid feed generation with fallback
- Metadata: algorithm used, pagination info

### Drift Check

- **Route**: `/api/algorithm/drift-check`
- Manual drift detection trigger
- Vector recalculation if needed

### Grade Transition

- **Route**: `/api/algorithm/grade-transition`
- Handle user grade changes
- Preserve subject interests

### Metrics

- **Route**: `/api/algorithm/metrics`
- Admin-only health metrics
- Real-time monitoring data

### Maintenance Cron

- **Route**: `/api/cron/algorithm-maintenance`
- Scheduled maintenance tasks
- Daily & weekly jobs

## Helper Functions

### Database Helpers

- **Dosya**: `helpers.ts`
- `getInteractions()` - Kullanıcı etkileşimlerini getir
- `getLikesHistory()` - Like geçmişi
- `getUserInterestVector()` - Vector cache
- `cacheUserInterestVector()` - Vector kaydet
- `recordInteraction()` - Etkileşim kaydet

## Kullanım Örnekleri

### Feed Generation

```typescript
import { generateHybridFeed } from "@/lib/algorithms/feedGenerator";

const posts = await generateHybridFeed(userId, {
  page: 1,
  limit: 20,
  filterByGrade: true,
});
```

### Drift Detection

```typescript
import { DriftDetector } from "@/lib/algorithms/driftDetection";
import { getInteractions } from "@/lib/algorithms/helpers";

const detector = new DriftDetector();
const analysis = await detector.detectConceptDrift(userId, getInteractions);

if (analysis.hasDrift) {
  // Recalculate vector
}
```

### Score Calculation

```typescript
import { calculateHybridScore } from "@/lib/algorithms/hybridScoring";

const score = await calculateHybridScore(
  content,
  userId,
  context,
  getLikesHistory,
  getUserInteraction,
);
```

## Performance Beklentileri

### Hesaplama Süreleri (10K içerik için)

- Time Decay: ~10ms
- Wilson Score: ~15ms
- User Interest: ~50ms (cached)
- Collaborative: ~80ms
- **Toplam**: ~210ms (acceptable)

### Cache Hit Rates (Hedef)

- User Interest Vector: >90%
- Similar Users: >85%
- Content Scores: >70%
- Feed: >60%

### Bellek Kullanımı

- Kullanıcı başına: ~4KB
- 100K kullanıcı: ~400MB

## Migration & Rollout

Sistem 5 fazlı migration stratejisi kullanır:

1. Data Collection
2. Shadow Mode
3. A/B Testing
4. Gradual Rollout
5. Optimization

Detaylar: `../migration/algorithmMigration.ts`

## Troubleshooting

### Feed boş dönüyor

- Fallback system devrede, chronological çalışmalı
- Circuit breaker durumunu kontrol edin

### Yavaş response

- Cache hit rates kontrolü
- Database query optimization
- Monitor metrics endpoint'ini inceleyin

### Drift detection çalışmıyor

- Cron job'ların çalıştığını kontrol edin
- Interaction data'nın kayıtlı olduğunu kontrol edin

## Geliştirme Roadmap

### Yapılacaklar

- [ ] LSH indexing implementasyonu
- [ ] Community influence full implementation
- [ ] Real-time drift detection
- [ ] A/B testing framework
- [ ] Advanced analytics dashboard

## Lisans

Bu sistem Owl-App projesinin bir parçasıdır.
