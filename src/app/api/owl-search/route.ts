import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  pagemap?: {
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
    metatags?: Array<{
      'og:image'?: string;
      'twitter:image'?: string;
      'og:title'?: string;
      'og:description'?: string;
    }>;
  };
}

interface GoogleSearchResponse {
  items?: SearchResult[];
  searchInformation: {
    totalResults: string;
    searchTime: number;
  };
  queries: {
    request: Array<{
      searchTerms: string;
      count: number;
      startIndex: number;
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const start = searchParams.get('start') || '1';
    const num = searchParams.get('num') || '10';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Google Custom Search API configuration
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.warn('Google Custom Search API credentials not configured');
      
      // Fallback to mock data for development
      return NextResponse.json({
        items: [
          {
            title: `${query} - Google Search`,
            link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: `Search results for "${query}". This is a mock result for development purposes.`,
            displayLink: 'google.com',
            formattedUrl: 'https://www.google.com/search?q=' + encodeURIComponent(query),
            pagemap: {
              cse_thumbnail: [{
                src: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
                width: '272',
                height: '92'
              }]
            }
          },
          {
            title: `${query} - Wikipedia`,
            link: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
            snippet: `Wikipedia article about "${query}". Learn more about this topic from the free encyclopedia.`,
            displayLink: 'wikipedia.org',
            formattedUrl: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(query.replace(/\s+/g, '_'))
          },
          {
            title: `${query} - News`,
            link: `https://news.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: `Latest news about "${query}". Stay updated with the most recent developments.`,
            displayLink: 'news.google.com',
            formattedUrl: 'https://news.google.com/search?q=' + encodeURIComponent(query)
          }
        ],
        searchInformation: {
          totalResults: '3',
          searchTime: 0.123
        },
        queries: {
          request: [{
            searchTerms: query,
            count: 3,
            startIndex: 1
          }]
        }
      });
    }

    // Make request to Google Custom Search API
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('cx', searchEngineId);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('start', start);
    searchUrl.searchParams.set('num', num);
    searchUrl.searchParams.set('safe', 'active');

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data: GoogleSearchResponse = await response.json();

    // Transform results for our card system
    const transformedResults = data.items?.map((item, index) => ({
      id: `search-result-${index}`,
      title: item.title,
      url: item.link,
      description: item.snippet,
      domain: item.displayLink,
      thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || 
                 item.pagemap?.metatags?.[0]?.['og:image'] ||
                 item.pagemap?.metatags?.[0]?.['twitter:image'],
      favicon: `https://www.google.com/s2/favicons?domain=${item.displayLink}`,
      timestamp: new Date().toISOString(),
      searchQuery: query
    })) || [];

    return NextResponse.json({
      query,
      results: transformedResults,
      totalResults: data.searchInformation.totalResults,
      searchTime: data.searchInformation.searchTime,
      pagination: {
        start: parseInt(start),
        count: parseInt(num),
        hasMore: data.items && data.items.length === parseInt(num)
      }
    });

  } catch (error) {
    console.error('Owl Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
