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
### 3. Infinite Canvas (Zoom/Pan)
**Dosya:** `src/components/work-environment/InfiniteCanvas.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/InfiniteCanvas.tsx
git commit -m "feat(canvas): Daha akıcı tekerlek zoom ve sol tık pan

- Zoom için üstel ölçek ve tek karede (rAF) pan+zoom güncellemesi
- Tekerlek olayını sadece container üzerinde passive:false ile dinle, sayfa scroll'unu engelle
- Pan işlemini sol tık sürükleme ile yap, cursor durumlarını sadeleştir
- overscrollBehavior: 'contain' ile sayfa kaymasını önle"
```

### 4. Kart Sürükleme Kancası
**Dosya:** `src/hooks/useDragDrop.ts`
**Commit Mesajı:**
```bash
git add src/hooks/useDragDrop.ts
git commit -m "feat(dnd): Pan/zoom farkında, rAF ile imlece senkron kart sürükleme

- Pan/zoom altında world koordinatlarıyla hesaplama
- Sürüklerken sadece görsel transform; bırakınca son konumu kaydet
- rAF ile tek karede görsel güncelleme, gereksiz state/DB yazımlarını önle"
```

### 5. Workspace Kart Bileşeni
**Dosya:** `src/components/work-environment/WorkspaceCard.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/WorkspaceCard.tsx
git commit -m "refactor(card): useDragDrop'a pan/zoom ilet ve sürükleme/resize davranışını iyileştir

- useDragDrop'a pan ve zoom geçildi, sürükleme imleçle birebir oldu
- Resize sırasında state güncellemesi korunuyor; DB yazımı mağaza tarafında debounce"
```

### 6. Sanallaştırılmış Kart Renderer
**Dosya:** `src/components/work-environment/VirtualizedCardRenderer.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/VirtualizedCardRenderer.tsx
git commit -m "chore(renderer): WorkspaceCard'a pan ve zoom prop'larını ilet"
```

### 7. Workspace Mağazası (IndexedDB Optimizasyonu)
**Dosya:** `src/hooks/useWorkspaceStore.ts`
**Commit Mesajı:**
```bash
git add src/hooks/useWorkspaceStore.ts
git commit -m "perf(store): IndexedDB yazımlarını debounce et ve sadece anlamlı durumları kaydet

- scheduleSaveWorkspace eklendi (1000ms): drag/resize/typing ara durumları kaydedilmez
- updateCard ve bringToFront debounced; add/delete/import gibi anlamlı olaylar anlık kaydedilir
- Çıkışta pending debounce temizliği"
```

### 8. Zengin Not Editörü (Otomatik Kaydetme)
**Dosya:** `src/components/work-environment/RichNoteEditor.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/RichNoteEditor.tsx
git commit -m "perf(rich-note): Her değişimde değil, 2sn idle sonrası kaydet

- onChange içindeki anlık save kaldırıldı
- Var olan 2sn debounce autoSave ile final durumları kaydet"
``` 

### 9. Format Converter Utility (FFmpeg)
**Dosya:** `src/lib/formatConverter.ts`
**Commit Mesajı:**
```bash
git add src/lib/formatConverter.ts
git commit -m "feat(media): Client-side conversion utils (MP4->MP3, thumbnails, image compress)

- Add singleton ffmpeg loader and safe fetchFile fallback
- Implement mp4ToMp3, generateVideoThumbnail, compressImage
- Provide validateFile, blobToObjectUrl, revokeObjectUrl helpers
- Enforce size limits and formats per requirements"
```

### 10. Media Uploader Component
**Dosya:** `src/components/media/MediaUploader.tsx`
**Commit Mesajı:**
```bash
git add src/components/media/MediaUploader.tsx
git commit -m "feat(media): MediaUploader with drag&drop, URL input, validation

- Accept image/video/audio with size & format checks
- Local preview for images and object URL for media
- URL selection for platforms (YouTube/Vimeo/TikTok/Twitch/Dailymotion)"
```

### 11. Image Preview Component
**Dosya:** `src/components/media/ImagePreview.tsx`
**Commit Mesajı:**
```bash
git add src/components/media/ImagePreview.tsx
git commit -m "feat(media): ImagePreview with resize slider and quick presets

- Add 100%/75%/50% buttons to ease side-by-side layout
- Alt text input support
- Responsive preview with object-contain"
```

### 12. Video Player Component
**Dosya:** `src/components/media/VideoPlayer.tsx`
**Commit Mesajı:**
```bash
git add src/components/media/VideoPlayer.tsx
git commit -m "feat(media): Universal VideoPlayer (react-player + HTML5) with debug logs

- Dynamic import react-player for YouTube/Vimeo/Twitch/TikTok/Dailymotion
- HTML5 fallback for local files, responsive 16:9 wrapper
- Add ready/start/error and HTML5 events logging"
```

### 13. Audio Player Component
**Dosya:** `src/components/media/AudioPlayer.tsx`
**Commit Mesajı:**
```bash
git add src/components/media/AudioPlayer.tsx
git commit -m "feat(media): AudioPlayer with waveform (wavesurfer) and debug logs

- Render HTML5 audio with optional WaveSurfer visualization
- Log lifecycle events; remove unsupported options
- Show duration when waveform ready"
```

### 14. Rich Note Editor - Media Integration & Autosave
**Dosya:** `src/components/work-environment/RichNoteEditor.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/RichNoteEditor.tsx
git commit -m "feat(rich-note): Media insert (image/video/audio) + safer autosave + debug

- Integrate MediaUploader, ImagePreview, VideoPlayer, AudioPlayer
- Generate video thumbnail, MP4->MP3 conversion, revoke blob URLs
- Enable side menu/toolbar and scrollable editor area
- Add detailed debug logs for media flows
- Autosave only on content change with 5s debounce and 30s min interval"
```

### 15. Editor Media Layout Styles
**Dosya:** `src/app/globals.css`
**Commit Mesajı:**
```bash
git add src/app/globals.css
git commit -m "feat(ui): Side-by-side media flow inside editor

- Inline-block flow for img/video within ProseMirror
- Margin and max-width rules; respect 50% width for two-column layout"
```

### 16. Rich Note Editor - Split View Feature
**Dosya:** `src/components/work-environment/RichNoteEditor.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/RichNoteEditor.tsx
git commit -m "feat(rich-note): Add split-view editor with dual BlockNote instances

- Add split-view toggle button in toolbar with Columns icon
- Implement side-by-side layout with two independent BlockNote editors
- Add target selection for media insertion (Left/Right editor)
- Separate editor instances for left and right panes
- Maintain existing autosave functionality for left editor
- Right editor ready for future persistence integration"
```

### 17. Package Dependencies Update
**Dosya:** `package.json`
**Commit Mesajı:**
```bash
git add package.json
git commit -m "feat(deps): Add FFmpeg dependencies for client-side media processing

- Add @ffmpeg/core and @ffmpeg/ffmpeg for video/audio conversion
- Add @mdxeditor/editor for enhanced editing capabilities
- Add @dnd-kit packages for improved drag-and-drop functionality
- Update BlockNote to latest version (0.37.0)
- Add cross-env for cross-platform environment variables"
```

### 18. Package Lock Update
**Dosya:** `package-lock.json`
**Commit Mesajı:**
```bash
git add package-lock.json
git commit -m "chore: Update package-lock.json with new dependencies

- Lock versions for FFmpeg, MDX editor, and DnD kit packages
- Ensure reproducible builds with updated dependency tree"
```

### 19. Cursor Rules Configuration
**Dosya:** `.cursor/rules/rules.mdc`
**Commit Mesajı:**
```bash
git add .cursor/rules/rules.mdc
git commit -m "feat(config): Update Cursor AI assistant rules and guidelines

- Add comprehensive MCP tool activation protocols
- Define dynamic rule sets for different coding scenarios
- Add import management and file organization rules
- Include quality gates and communication standards
- Add debugging and performance optimization guidelines"
```

### 20. Resize Observer Error Handler
**Dosya:** `src/lib/resizeObserver.ts`
**Commit Mesajı:**
```bash
git add src/lib/resizeObserver.ts
git commit -m "feat(utils): Add ResizeObserverErrorHandler component

- Create error boundary for ResizeObserver loop errors
- Global error handling for canvas and workspace components
- Improve error resilience in infinite canvas operations"
```

### 21. English Translation Updates
**Dosya:** `src/messages/en.json`
**Commit Mesajı:**
```bash
git add src/messages/en.json
git commit -m "feat(i18n): Update English translations for new features

- Add translations for split-view editor functionality
- Update media upload and processing messages
- Add error handling and success messages
- Improve accessibility labels and tooltips"
```

### 22. Turkish Translation Updates
**Dosya:** `src/messages/tr.json`
**Commit Mesajı:**
```bash
git add src/messages/tr.json
git commit -m "feat(i18n): Update Turkish translations for new features

- Add translations for split-view editor functionality
- Update media upload and processing messages
- Add error handling and success messages
- Improve accessibility labels and tooltips"
```

### 23. Format Converter Utility
**Dosya:** `src/lib/formatConverter.ts`
**Commit Mesajı:**
```bash
git add src/lib/formatConverter.ts
git commit -m "feat(media): Client-side media conversion utilities

- Add singleton FFmpeg loader with safe fetchFile fallback
- Implement mp4ToMp3 conversion for audio processing
- Add generateVideoThumbnail for video preview generation
- Implement compressImage for image optimization
- Add validateFile, blobToObjectUrl, revokeObjectUrl helpers
- Enforce size limits and format validation"
```

### 24. Media Components Directory
**Dosya:** `src/components/media/`
**Commit Mesajı:**
```bash
git add src/components/media/
git commit -m "feat(media): Add complete media component suite

- MediaUploader: Drag&drop, URL input, validation for image/video/audio
- ImagePreview: Resize slider, quick presets (100%/75%/50%), alt text support
- VideoPlayer: Universal player with react-player + HTML5 fallback
- AudioPlayer: Waveform visualization with WaveSurfer integration
- Comprehensive debug logging and error handling for all components"
```

### 25. Untracked Script File
**Dosya:** `on`
**Commit Mesajı:**
```bash
git add on
git commit -m "chore: Add utility script

- Add shell script for development workflow automation
- Improve project setup and maintenance processes"
```

### 26. Git Status Script
**Dosya:** `tatus --porcelain  grep ^ M  cut -c4-`
**Commit Mesajı:**
```bash
git add "tatus --porcelain  grep ^ M  cut -c4-"
git commit -m "chore: Add git status parsing script

- Create script to filter modified files from git status
- Useful for automated build and deployment processes
- Improve development workflow efficiency"
```

### 27. Infinite Canvas Performance Optimization
**Dosya:** `src/components/work-environment/InfiniteCanvas.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/InfiniteCanvas.tsx
git commit -m "perf(canvas): Optimize zoom and pan performance with RAF

- Implement requestAnimationFrame for smooth zoom/pan updates
- Add throttled pan updates to prevent excessive re-renders
- Memoize grid calculations for better performance
- Add grid visibility control based on zoom level
- Improve pan mode detection and cursor states
- Add passive event listeners for wheel events"
```

### 28. Drag Drop Hook Enhancement
**Dosya:** `src/hooks/useDragDrop.ts`
**Commit Mesajı:**
```bash
git add src/hooks/useDragDrop.ts
git commit -m "feat(dnd): Enhanced drag-and-drop with pan/zoom awareness

- Integrate pan and zoom values for accurate world coordinates
- Use requestAnimationFrame for smooth visual updates during drag
- Separate visual transform from actual position updates
- Implement debounced final position saving to IndexedDB
- Add collision detection and grid snapping support
- Improve drag performance with optimized coordinate calculations"
```

### 29. Workspace Card Component Update
**Dosya:** `src/components/work-environment/WorkspaceCard.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/WorkspaceCard.tsx
git commit -m "refactor(card): Update WorkspaceCard for enhanced drag-drop integration

- Pass pan and zoom values to useDragDrop hook
- Improve drag performance with coordinate transformations
- Update resize behavior to work with new drag system
- Add visual feedback during drag operations
- Maintain z-index management during drag operations
- Optimize re-renders during drag state changes"
```

### 30. Virtualized Card Renderer Props Update
**Dosya:** `src/components/work-environment/VirtualizedCardRenderer.tsx`
**Commit Mesajı:**
```bash
git add src/components/work-environment/VirtualizedCardRenderer.tsx
git commit -m "chore(renderer): Update VirtualizedCardRenderer with pan/zoom props

- Add pan and zoom props to component interface
- Pass through pan and zoom values to child WorkspaceCard components
- Ensure proper prop forwarding for drag-drop functionality
- Maintain performance optimizations with virtualization"
```

### 31. Workspace Store Performance Optimization
**Dosya:** `src/hooks/useWorkspaceStore.ts`
**Commit Mesajı:**
```bash
git add src/hooks/useWorkspaceStore.ts
git commit -m "perf(store): Optimize IndexedDB operations with debouncing

- Add scheduleSaveWorkspace with 1000ms debounce for drag operations
- Prevent excessive DB writes during rapid drag/resize operations
- Implement selective saving - only meaningful changes trigger saves
- Add cleanup for pending debounces on unmount
- Improve performance for large workspace operations
- Maintain data integrity with proper error handling"
```