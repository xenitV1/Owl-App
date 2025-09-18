# Vercel Deployment Rehberi - Owl Platform Coming Soon

Bu rehber, Owl Platform'unun Coming Soon sayfasını Vercel'e nasıl deploy edeceğinizi adım adım açıklar.

## 🚀 **Neden Vercel?**

### ✅ **Discord ve Büyük Şirketler Kullanıyor**
- **Discord** - Frontend infrastructure
- **Netflix** - A/B testing platforms  
- **TikTok** - Marketing websites
- **GitHub** - Developer documentation
- **Twilio** - Developer portals

### ⚡ **Next.js Native Support**
- Next.js'in yaratıcısı
- Otomatik optimizasyonlar
- Edge functions
- Image optimization
- Automatic HTTPS & CDN

### 💰 **Maliyet Avantajı**
- **Hobby Plan**: $20/ay (ticari kullanım için)
- **Pro Plan**: $20/ay (gelişmiş özellikler)
- GoDaddy'dan çok daha ucuz ve hızlı

## 📋 **Gereksinimler**

- GitHub hesabı
- Vercel hesabı (ücretsiz)
- Domain adınız (opsiyonel)

## 🎯 **Adım 1: Vercel Hesabı Oluştur**

1. [vercel.com](https://vercel.com) adresine gidin
2. "Sign Up" tıklayın
3. GitHub hesabınızla giriş yapın
4. Ücretsiz hesap oluşturun

## 🔧 **Adım 2: Projeyi Deploy Et**

### Seçenek A: Vercel Dashboard ile (Önerilen)

1. **Vercel Dashboard**'a gidin
2. **"New Project"** tıklayın
3. **GitHub Repository**'nizi seçin
4. **Import** tıklayın

### Seçenek B: Vercel CLI ile

```bash
# 1. Vercel CLI yükle
npm i -g vercel

# 2. Proje dizininde
cd /path/to/your/owll/project

# 3. Deploy
vercel

# 4. Production deploy
vercel --prod
```

## ⚙️ **Adım 3: Build Ayarları**

Vercel otomatik olarak Next.js projelerini tanır, ancak manuel ayarlar:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## 🌍 **Adım 4: Custom Domain Bağla**

### 4.1 Vercel Dashboard'da
1. **Settings** → **Domains**
2. **"Add Domain"** tıklayın
3. Domain'inizi girin: `yourdomain.com`
4. **"Add"** tıklayın

### 4.2 DNS Ayarları
GoDaddy DNS Manager'da:

```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**Veya Vercel'in önerdiği IP adreslerini kullanın**

## 🔐 **Adım 5: Environment Variables**

### Gerekli Environment Variables:
```bash
# Firebase (eğer kullanıyorsanız)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Diğer
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Vercel'de Ayarlama:
1. **Settings** → **Environment Variables**
2. **"Add New"** tıklayın
3. Variable'ları ekleyin
4. **"Save"** tıklayın

## 🎨 **Adım 6: Coming Soon Sayfası Erişim**

Deployment sonrası sayfalarınız:

### Türkçe Versiyon
- `https://yourdomain.vercel.app/tr/coming-soon`
- `https://yourdomain.com/tr/coming-soon`

### İngilizce Versiyon  
- `https://yourdomain.vercel.app/en/coming-soon`
- `https://yourdomain.com/en/coming-soon`

## 🔄 **Adım 7: Ana Domain Yönlendirmesi**

Ana domain'i Coming Soon sayfasına yönlendirmek için:

```typescript
// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/tr/coming-soon');
}
```

## 📊 **Adım 8: Analytics ve Monitoring**

### Vercel Analytics (Ücretsiz)
1. **Settings** → **Analytics**
2. **"Enable Vercel Analytics"** aktif edin
3. Real-time visitor data alın

### Google Analytics (Opsiyonel)
```typescript
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 🚀 **Adım 9: Performance Optimizasyonu**

### Otomatik Optimizasyonlar
Vercel otomatik olarak sağlar:
- ✅ **Image Optimization** - WebP/AVIF formatları
- ✅ **Code Splitting** - Otomatik bundle splitting  
- ✅ **Edge Caching** - Global CDN
- ✅ **Compression** - Gzip/Brotli
- ✅ **HTTP/2** - Modern protocol

### Manuel Optimizasyonlar
```typescript
// next.config.ts (zaten mevcut)
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
}
```

## 🔍 **Adım 10: Test ve Doğrulama**

### 1. Sayfa Testleri
- [ ] `https://yourdomain.com` → `/tr/coming-soon` yönlendiriyor
- [ ] Türkçe versiyon açılıyor
- [ ] İngilizce versiyon açılıyor (`/en/coming-soon`)
- [ ] Tema değiştirme çalışıyor
- [ ] Dil değiştirme çalışıyor
- [ ] Mobile responsive

### 2. Performance Testleri
```bash
# PageSpeed Insights
https://pagespeed.web.dev/

# Vercel Speed Insights
https://vercel.com/analytics
```

### 3. SEO Kontrolü
- [ ] Meta tags yükleniyor
- [ ] Open Graph tags
- [ ] Twitter Cards
- [ ] Sitemap.xml

## 🎯 **Deployment Sonrası**

### Otomatik Deployments
Her GitHub push'ta otomatik deploy:
```bash
git add .
git commit -m "Update coming soon page"
git push origin main
# Vercel otomatik deploy eder
```

### Preview Deployments
Her Pull Request'te preview URL:
```
https://owll-git-feature-branch-yourusername.vercel.app
```

## 📈 **Monitoring ve Analytics**

### Vercel Dashboard'da Görüntüleyebileceğiniz:
- 📊 **Real-time Analytics** - Visitor data
- ⚡ **Performance Metrics** - Core Web Vitals
- 🌍 **Geographic Data** - Visitor locations
- 📱 **Device Data** - Mobile/Desktop usage
- 🔗 **Top Pages** - Most visited pages

### Custom Monitoring
```typescript
// src/lib/analytics.ts
export function trackEvent(event: string, data?: any) {
  if (typeof window !== 'undefined') {
    // Vercel Analytics
    window.va?.track(event, data);
    
    // Google Analytics
    window.gtag?.('event', event, data);
  }
}
```

## 🚨 **Sorun Giderme**

### Yaygın Sorunlar

#### 1. Build Hatası
```bash
# Local test
npm run build

# Vercel logs
vercel logs [deployment-url]
```

#### 2. Environment Variables
- Vercel Dashboard → Settings → Environment Variables
- Production, Preview, Development için ayrı ayrı ayarlayın

#### 3. Domain DNS
- DNS propagation 24-48 saat sürebilir
- `nslookup yourdomain.com` ile kontrol edin

#### 4. 404 Hatası
- `_redirects` dosyası ekleyin (gerekirse)
- Next.js routing'i kontrol edin

## 💡 **Pro Tips**

### 1. Branch-based Deployments
```bash
# Feature branch
git checkout -b feature/new-design
git push origin feature/new-design
# Otomatik preview URL oluşur
```

### 2. Environment-specific Configs
```typescript
// vercel.json
{
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "https://yourdomain.com"
    }
  }
}
```

### 3. Custom Headers
```typescript
// next.config.ts (zaten mevcut)
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

## 🎉 **Sonuç**

Vercel ile deployment:
- ⚡ **5 dakikada** deploy
- 🌍 **Global CDN** - Dünya çapında hız
- 🔒 **Otomatik HTTPS** - Güvenlik
- 📊 **Analytics** - Performance tracking
- 💰 **Uygun maliyet** - $20/ay
- 🚀 **Discord seviyesi** infrastructure

### Sonraki Adımlar:
1. **Email List Integration** - Mailchimp/ConvertKit
2. **A/B Testing** - Vercel Edge Functions
3. **Social Media Integration** - Open Graph optimization
4. **SEO Enhancement** - Structured data
5. **Performance Monitoring** - Real User Monitoring

---

**Discord'un da Vercel kullandığını unutmayın - siz de aynı seviyede infrastructure'a sahip oluyorsunuz!** 🚀
