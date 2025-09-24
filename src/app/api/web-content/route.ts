import { NextRequest } from 'next/server';
import { JSDOM } from 'jsdom';
import { extractArticleFromHtml } from '@/lib/ai/contentExtractor';
import { summarizeText } from '@/lib/ai/readingMode';

export const dynamic = 'force-dynamic';

interface WebContent {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  siteName?: string;
  structuredContent?: StructuredContentItem[];
}

interface StructuredContentItem {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'image';
  level?: number; // for headings (1-6)
  content: string;
  items?: string[]; // for lists
  src?: string; // for images
  alt?: string; // for images
}

function extractWebContent(url: string, html: string): WebContent {
  const extracted = extractArticleFromHtml(html, { url, minTextLength: 400 });
  const content = extracted.contentText
    .replace(/\s*(Advertisement|Sponsored|Related Articles?|More from|Read more|Share this|Comments?)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const excerpt = summarizeText(content, 2) || extracted.excerpt || content.slice(0, 200);

  return {
    url,
    title: extracted.title,
    content,
    excerpt,
    author: extracted.author,
    publishedTime: extracted.publishedTime,
    modifiedTime: extracted.modifiedTime,
    image: extracted.image,
    siteName: extracted.siteName,
    structuredContent: extracted.structuredContent,
  };
}

async function fetchWebContent(url: string): Promise<WebContent> {
  console.info('[WebContent] fetch start', { url });

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'OwlWebContent/1.0 (+https://owl-platform.com)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
      'Cache-Control': 'no-cache'
    },
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`Not HTML content: ${contentType}`);
  }

  const html = await res.text();
  console.info('[WebContent] fetched HTML length', { length: html.length });

  const webContent = extractWebContent(url, html);
  console.info('[WebContent] extracted content', {
    title: webContent.title,
    contentLength: webContent.content.length,
    hasAuthor: !!webContent.author
  });

  return webContent;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const webContent = await fetchWebContent(url);

    return new Response(JSON.stringify(webContent), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[WebContent] error', { error: e?.message, url: req.url });
    return new Response(JSON.stringify({
      error: e?.message || 'Failed to fetch web content',
      url: req.url
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
