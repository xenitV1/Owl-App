export type ProviderOptionType = 'text' | 'select';

export interface ProviderOption {
  key: string;
  label: string;
  type: ProviderOptionType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>; // for select
}

export type RssCategory = 'social' | 'news' | 'tech' | 'developer' | 'science' | 'academia';

export type RssLang = 'en' | 'tr' | 'all';

export interface RssProvider {
  id: string;
  name: string;
  description?: string;
  category: RssCategory;
  options: ProviderOption[]; // empty for fixed feeds
  buildUrl: (opts: Record<string, string>) => string | null;
  example?: Record<string, string>;
  lang?: RssLang; // if set, non-social providers can be filtered by language
}

export const rssProviders: RssProvider[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Kanal veya kullanıcı videoları',
    category: 'social',
    options: [
      {
        key: 'mode',
        label: 'Tür',
        type: 'select',
        options: [
          { value: 'user', label: 'Kullanıcı (ad/handle/url)' },
          { value: 'popular', label: 'Popüler (trending)' }
        ],
        required: true
      },
      { key: 'value', label: 'Kimlik', type: 'text', placeholder: '@handle veya isim (UC… kabul edilir)', required: false },
      { key: 'region', label: 'Bölge', type: 'text', placeholder: 'TR, US, DE...', required: false }
    ],
    buildUrl: (o) => {
      if (o.mode === 'user' && o.value) return `yt:resolve:${o.value}`; // special marker handled in UI
      if (o.mode === 'popular') return `yt:popular:${o.region || 'TR'}`; // special marker handled in UI
      return null;
    },
    example: { mode: 'channel', value: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' }
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Playlist, album veya sanatçı',
    category: 'social',
    options: [
      {
        key: 'type',
        label: 'Tür',
        type: 'select',
        options: [
          { value: 'playlist', label: 'Playlist' },
          { value: 'album', label: 'Albüm' },
          { value: 'artist', label: 'Sanatçı' }
        ],
        required: true
      },
      { key: 'id', label: 'Spotify ID', type: 'text', placeholder: 'Playlist/Album/Artist ID veya URL', required: true }
    ],
    buildUrl: (o) => {
      if (o.type && o.id) return `spotify:${o.type}:${o.id}`; // special marker handled in UI
      return null;
    },
    example: { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' }
  },
  // ---- Science & Popular Science (TR) ----
  {
    id: 'evrimagaci',
    name: 'Evrim Ağacı',
    description: 'Bilim ve popüler bilim yazıları',
    category: 'science',
    options: [],
    buildUrl: () => 'https://evrimagaci.org/',
    lang: 'tr'
  },
  {
    id: 'bilimvegelecek',
    name: 'Bilim ve Gelecek',
    description: 'Bilim kültürü ve felsefesi',
    category: 'science',
    options: [],
    buildUrl: () => 'https://bilimvegelecek.com.tr/',
    lang: 'tr'
  },
  {
    id: 'popsci_tr',
    name: 'Popular Science Türkiye',
    description: 'Popüler bilim içerikleri',
    category: 'science',
    options: [],
    buildUrl: () => 'https://popsci.com.tr/',
    lang: 'tr'
  },
  {
    id: 'tubitak_bilimgenc',
    name: 'TÜBİTAK Bilim Genç',
    description: 'Gençlere yönelik bilim içerikleri',
    category: 'science',
    options: [],
    buildUrl: () => 'https://bilimgenc.tubitak.gov.tr/',
    lang: 'tr'
  },

  // ---- Academic Announcements & Projects (TR) ----
  {
    id: 'tubitak_duyurular',
    name: 'TÜBİTAK Duyurular',
    description: 'Program ve proje duyuruları',
    category: 'academia',
    options: [],
    buildUrl: () => 'https://www.tubitak.gov.tr/tr/duyurular',
    lang: 'tr'
  },
  {
    id: 'yok_duyurular',
    name: 'YÖK Duyurular',
    description: 'Yükseköğretim Kurulu duyuruları',
    category: 'academia',
    options: [],
    buildUrl: () => 'https://www.yok.gov.tr/duyurular',
    lang: 'tr'
  },
  {
    id: 'tuba_haberler',
    name: 'TÜBA Haberler',
    description: 'Türkiye Bilimler Akademisi haberleri',
    category: 'academia',
    options: [],
    buildUrl: () => 'https://tuba.gov.tr/tr/haberler',
    lang: 'tr'
  },
  {
    id: 'tuseb_haberler',
    name: 'TÜSEB Haberler',
    description: 'Sağlık Enstitüleri Başkanlığı haber/duyuru',
    category: 'academia',
    options: [],
    buildUrl: () => 'https://www.tuseb.gov.tr/haberler',
    lang: 'tr'
  },
  {
    id: 'ulusal_ajans',
    name: 'Türkiye Ulusal Ajansı (Erasmus+)',
    description: 'Erasmus+ ve ESC duyuruları',
    category: 'academia',
    options: [],
    buildUrl: () => 'https://www.ua.gov.tr',
    lang: 'tr'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Subreddit veya kullanıcı gönderileri',
    category: 'social',
    options: [
      { key: 'mode', label: 'Tür', type: 'select', options: [ { value: 'sub', label: 'Subreddit' }, { value: 'user', label: 'Kullanıcı' } ], required: true },
      { key: 'value', label: 'Ad', type: 'text', placeholder: 'programming veya username', required: true }
    ],
    buildUrl: (o) => {
      if (o.mode === 'sub' && o.value) return `https://www.reddit.com/r/${encodeURIComponent(o.value)}/.rss`;
      if (o.mode === 'user' && o.value) return `https://www.reddit.com/user/${encodeURIComponent(o.value)}/.rss`;
      return null;
    }
  },
  {
    id: 'hn',
    name: 'Hacker News',
    description: 'Ön sayfa veya en yeniler',
    category: 'tech',
    options: [ { key: 'mode', label: 'Akış', type: 'select', options: [ { value: 'front', label: 'Front Page' }, { value: 'new', label: 'Newest' } ], required: true } ],
    buildUrl: (o) => {
      if (o.mode === 'front') return 'https://hnrss.org/frontpage';
      if (o.mode === 'new') return 'https://hnrss.org/newest';
      return null;
    }
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Kullanıcı veya yayın',
    category: 'tech',
    options: [
      { key: 'mode', label: 'Tür', type: 'select', options: [ { value: 'user', label: 'Kullanıcı' }, { value: 'pub', label: 'Yayın' } ], required: true },
      { key: 'value', label: 'Ad', type: 'text', placeholder: '@username veya publication', required: true }
    ],
    buildUrl: (o) => {
      if (o.mode === 'user' && o.value) return `https://medium.com/feed/${o.value.startsWith('@') ? o.value : '@' + o.value}`;
      if (o.mode === 'pub' && o.value) return `https://medium.com/feed/${encodeURIComponent(o.value)}`;
      return null;
    }
  },
  {
    id: 'devto',
    name: 'DEV Community',
    description: 'Kullanıcı veya etiket',
    category: 'developer',
    options: [
      { key: 'mode', label: 'Tür', type: 'select', options: [ { value: 'user', label: 'Kullanıcı' }, { value: 'tag', label: 'Etiket' } ], required: true },
      { key: 'value', label: 'Değer', type: 'text', placeholder: 'username veya tag', required: true }
    ],
    buildUrl: (o) => {
      if (o.mode === 'user' && o.value) return `https://dev.to/feed/${encodeURIComponent(o.value)}`;
      if (o.mode === 'tag' && o.value) return `https://dev.to/feed/tag/${encodeURIComponent(o.value)}`;
      return null;
    }
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repo Releases veya Commits (Atom)',
    category: 'developer',
    options: [
      { key: 'owner', label: 'Sahip', type: 'text', required: true },
      { key: 'repo', label: 'Repo', type: 'text', required: true },
      { key: 'mode', label: 'Tür', type: 'select', options: [ { value: 'releases', label: 'Releases' }, { value: 'commits', label: 'Commits' } ], required: true }
    ],
    buildUrl: (o) => {
      if (!o.owner || !o.repo) return null;
      if (o.mode === 'releases') return `https://github.com/${encodeURIComponent(o.owner)}/${encodeURIComponent(o.repo)}/releases.atom`;
      if (o.mode === 'commits') return `https://github.com/${encodeURIComponent(o.owner)}/${encodeURIComponent(o.repo)}/commits.atom`;
      return null;
    }
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    description: 'Etiket veya kullanıcı',
    category: 'developer',
    options: [
      { key: 'mode', label: 'Tür', type: 'select', options: [ { value: 'tag', label: 'Etiket' }, { value: 'user', label: 'Kullanıcı ID' } ], required: true },
      { key: 'value', label: 'Değer', type: 'text', placeholder: 'javascript veya 22656', required: true }
    ],
    buildUrl: (o) => {
      if (o.mode === 'tag' && o.value) return `https://stackoverflow.com/feeds/tag/${encodeURIComponent(o.value)}`;
      if (o.mode === 'user' && o.value) return `https://stackoverflow.com/feeds/user/${encodeURIComponent(o.value)}`;
      return null;
    }
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    description: 'Güncel ürünler (genel)',
    category: 'tech',
    options: [],
    buildUrl: () => 'https://www.producthunt.com/feed'
  },
  {
    id: 'bbc',
    name: 'BBC News',
    description: 'Genel haberler',
    category: 'news',
    options: [],
    buildUrl: () => 'https://feeds.bbci.co.uk/news/rss.xml',
    lang: 'en'
  },
  {
    id: 'theverge',
    name: 'The Verge',
    description: 'Teknoloji haberleri',
    category: 'tech',
    options: [],
    buildUrl: () => 'https://www.theverge.com/rss/index.xml',
    lang: 'en'
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    description: 'Startup ve teknoloji',
    category: 'tech',
    options: [],
    buildUrl: () => 'http://feeds.feedburner.com/TechCrunch/',
    lang: 'en'
  }
  ,
  // ---- Turkish news providers ----
  {
    id: 'bbcturkce',
    name: 'BBC Türkçe',
    description: 'BBC Türkçe - Genel',
    category: 'news',
    options: [],
    buildUrl: () => 'https://feeds.bbci.co.uk/turkce/rss.xml',
    lang: 'tr'
  },
  {
    id: 'ntv',
    name: 'NTV - Gündem',
    description: 'NTV Gündem',
    category: 'news',
    options: [],
    buildUrl: () => 'https://www.ntv.com.tr/gundem.rss',
    lang: 'tr'
  },
  {
    id: 'cnnturk',
    name: 'CNN Türk',
    description: 'CNN Türk - Türkiye',
    category: 'news',
    options: [],
    buildUrl: () => 'https://www.cnnturk.com/feed/rss/turkiye',
    lang: 'tr'
  },
  {
    id: 'anadoluajansi',
    name: 'Anadolu Ajansı',
    description: 'AA Güncel',
    category: 'news',
    options: [],
    buildUrl: () => 'https://www.aa.com.tr/tr/rss/default?cat=guncel',
    lang: 'tr'
  },
  {
    id: 'dwturkce',
    name: 'DW Türkçe',
    description: 'Deutsche Welle Türkçe - Genel',
    category: 'news',
    options: [],
    buildUrl: () => 'http://rss.dw.com/rdf/rss-tur-all',
    lang: 'tr'
  }
];

export function getProvider(id: string): RssProvider | undefined {
  return rssProviders.find(p => p.id === id);
}

export const rssCategories: Array<{ id: RssCategory; i18nKey: string }> = [
  { id: 'social', i18nKey: 'rss.category.social' },
  { id: 'news', i18nKey: 'rss.category.news' },
  { id: 'tech', i18nKey: 'rss.category.tech' },
  { id: 'developer', i18nKey: 'rss.category.developer' },
  { id: 'science', i18nKey: 'rss.category.science' },
  { id: 'academia', i18nKey: 'rss.category.academia' },
];


