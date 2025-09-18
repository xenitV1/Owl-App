# GoDaddy Deployment Rehberi - Coming Soon Sayfası

Bu rehber, Owl Platform'unun Coming Soon sayfasını GoDaddy'ye nasıl deploy edeceğinizi adım adım açıklar.

## 📋 Gereksinimler

- GoDaddy hesabı
- Domain adınız
- Node.js (yerel geliştirme için)
- Git (opsiyonel)

## 🚀 Deployment Seçenekleri

### Seçenek 1: Vercel ile Deployment (Önerilen)

#### Adım 1: Vercel Hesabı Oluştur
1. [vercel.com](https://vercel.com) adresine gidin
2. GitHub hesabınızla giriş yapın
3. Ücretsiz hesap oluşturun

#### Adım 2: Projeyi Vercel'e Deploy Et
1. Vercel dashboard'ında "New Project" tıklayın
2. GitHub repository'nizi bağlayın
3. Build ayarları:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Adım 3: Environment Variables (Gerekirse)
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Adım 4: Custom Domain Bağla
1. Vercel dashboard → Settings → Domains
2. "Add Domain" tıklayın
3. Domain'inizi girin: `yourdomain.com`
4. DNS ayarlarını takip edin

### Seçenek 2: GoDaddy Web Hosting ile

#### Adım 1: Static Export Hazırla
```bash
# Proje dizininde
npm install
npm run build
npm run export
```

#### Adım 2: GoDaddy File Manager
1. GoDaddy cPanel'e giriş yapın
2. File Manager'ı açın
3. `public_html` klasörüne gidin
4. `out` klasöründeki tüm dosyaları yükleyin

#### Adım 3: .htaccess Dosyası Oluştur
`public_html` klasörüne `.htaccess` dosyası ekleyin:

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### Seçenek 3: GoDaddy + GitHub Pages

#### Adım 1: GitHub Actions Workflow
`.github/workflows/deploy.yml` dosyası oluşturun:

```yaml
name: Deploy to GoDaddy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build project
      run: npm run build
      
    - name: Export static files
      run: npm run export
      
    - name: Deploy to GoDaddy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./out
```

## 🌐 DNS Ayarları

### Vercel için DNS Ayarları
1. GoDaddy DNS Manager'a gidin
2. Aşağıdaki kayıtları ekleyin:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Direct Hosting için
```
Type: A
Name: @
Value: [GoDaddy IP adresiniz]

Type: CNAME
Name: www
Value: yourdomain.com
```

## 🔧 Build Konfigürasyonu

### next.config.ts Güncellemesi
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // GoDaddy için
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  basePath: '',
}

module.exports = nextConfig
```

### package.json Scripts
```json
{
  "scripts": {
    "build": "next build",
    "export": "next export",
    "deploy": "npm run build && npm run export"
  }
}
```

## 🎨 Coming Soon Sayfası Erişim

Deployment sonrası sayfaya erişim:

### Türkçe Versiyon
- `https://yourdomain.com/tr/coming-soon`
- `https://yourdomain.com/en/coming-soon` (İngilizce)

### Ana Sayfa Yönlendirmesi
Ana domain'i Coming Soon sayfasına yönlendirmek için:

```javascript
// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/tr/coming-soon');
}
```

## 🔍 Test ve Doğrulama

### 1. Sayfa Testleri
- [ ] Türkçe versiyon açılıyor
- [ ] İngilizce versiyon açılıyor
- [ ] Tema değiştirme çalışıyor
- [ ] Dil değiştirme çalışıyor
- [ ] Responsive tasarım çalışıyor

### 2. Performance Testleri
- [ ] PageSpeed Insights kontrolü
- [ ] Mobile uyumluluk
- [ ] SEO meta tags

### 3. SEO Ayarları
```typescript
// src/app/[locale]/coming-soon/layout.tsx
export const metadata = {
  title: 'Yakında Geliyor - Owl Platform',
  description: 'Öğrenciler için sosyal medya platformu yakında hizmete giriyor',
  keywords: 'eğitim, sosyal medya, öğrenci, not paylaşımı',
  openGraph: {
    title: 'Owl Platform - Yakında Geliyor',
    description: 'Öğrenciler için özel sosyal medya platformu',
    images: ['/logo.png']
  }
}
```

## 🚨 Sorun Giderme

### Yaygın Sorunlar

#### 1. 404 Hatası
- `.htaccess` dosyasının doğru yerde olduğundan emin olun
- `index.html` dosyasının root dizinde olduğunu kontrol edin

#### 2. CSS/JS Yüklenmiyor
- Asset path'lerini kontrol edin
- Cache'i temizleyin
- Browser developer tools'da network sekmesini kontrol edin

#### 3. Routing Sorunları
- `trailingSlash: true` ayarını kontrol edin
- `.htaccess` rewrite kurallarını doğrulayın

### Debug Komutları
```bash
# Local test
npm run dev

# Build test
npm run build
npm run export

# File size kontrolü
ls -la out/

# Serve test
npx serve out/
```

## 📞 Destek

Sorun yaşarsanız:
1. GoDaddy Support: 1-480-505-8877
2. Vercel Support: [vercel.com/support](https://vercel.com/support)
3. GitHub Issues: Repository'nizde issue açın

## 🎯 Sonraki Adımlar

1. **Analytics Ekleme**: Google Analytics veya Vercel Analytics
2. **Email List**: E-posta toplama sistemi
3. **Social Media**: Sosyal medya entegrasyonu
4. **SEO Optimization**: Meta tags ve structured data
5. **Performance Monitoring**: Uptime monitoring

---

**Not**: Bu rehber, Owl Platform'unun Coming Soon sayfası için hazırlanmıştır. Farklı projeler için ayarlamalar gerekebilir.
