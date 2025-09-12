# Git Commit Rehberi - OWL Projesi

Bu dosya, güncellenen dosyalar için ayrı ayrı commit mesajlarını içerir. Her dosya için yapılan değişiklikler analiz edilmiş ve uygun commit mesajları oluşturulmuştur.

## Değiştirilen Dosyalar ve Commit Mesajları

## Örnek (Sadece Referans İçin)
Bu bölüm örnektir; çalıştırmayın. Gerçek commit komutları aşağıdaki dosya başlıklarında verilmiştir.

### 1. Layout Dosyası (Örnek)
**Dosya:** `src/app/[locale]/layout.tsx`
**Commit Mesajı:**
```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat: Add ResizeObserverErrorHandler to layout

- Import ResizeObserverErrorHandler component
- Add component to layout to handle ResizeObserver errors globally
- Improves error handling for canvas and workspace components"
```

### 2. Work Environment Sayfası (Örnek)
**Dosya:** `src/app/[locale]/work-environment/page.tsx`
**Commit Mesajı:**
```bash
git add src/app/[locale]/work-environment/page.tsx
git commit -m "feat: Improve keyboard interaction handling in work environment

- Add isInEditor detection for keyboard events
- Prevent space key from triggering pan mode when editing rich notes
- Add isHoveringCard state to disable pan mode when hovering over cards
- Remove 'note' type from card type options (deprecated)
- Improve user experience by preventing accidental canvas manipulation during text editing"
```
----------------------------------------------------------------------------------------------------------