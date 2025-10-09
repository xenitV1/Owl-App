import { NextRequest, NextResponse } from "next/server";

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
  page_fetched?: string;
  thumbnail?: {
    src: string;
  };
  meta_url?: {
    scheme: string;
    netloc: string;
    hostname: string;
    favicon: string;
    path: string;
  };
}

interface BraveSearchResponse {
  query: {
    original: string;
    show_strict_warning: boolean;
    altered?: string;
    safesearch: boolean;
    is_navigational: boolean;
    is_geolocal: boolean;
    local_decision: string;
    local_locations_idx: number;
    is_trending: boolean;
    is_news_breaking: boolean;
    ask_for_location: boolean;
    language: string;
    spellcheck_off: boolean;
    country: string;
    bad_results: boolean;
    should_fallback: boolean;
    postal_code: string;
    city: string;
    header_country: string;
    more_results_available: boolean;
    state: string;
  };
  type: string;
  web?: {
    type: string;
    results: BraveWebResult[];
    family_friendly: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const start = searchParams.get("start") || "1";
    const num = searchParams.get("num") || "10";

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    // Brave Search API configuration
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;

    if (!apiKey) {
      console.warn("Brave Search API key not configured");

      // Fallback to mock data for development
      return NextResponse.json({
        query,
        results: [
          {
            id: "search-result-0",
            title: `${query} - Search Result`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            description: `Search results for "${query}". This is a mock result for development purposes. Please configure BRAVE_SEARCH_API_KEY.`,
            domain: "example.com",
            thumbnail: null,
            favicon: "https://www.google.com/s2/favicons?domain=example.com",
            timestamp: new Date().toISOString(),
            searchQuery: query,
          },
        ],
        totalResults: "1",
        searchTime: 0.123,
        pagination: {
          start: parseInt(start),
          count: 1,
          hasMore: false,
        },
      });
    }

    // Calculate offset for pagination (Brave uses offset, not start index)
    const offset = parseInt(start) - 1;
    const count = Math.min(parseInt(num), 20); // Brave max is 20 per request

    // Make request to Brave Search API
    const searchUrl = new URL("https://api.search.brave.com/res/v1/web/search");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("count", count.toString());
    if (offset > 0) {
      searchUrl.searchParams.set("offset", offset.toString());
    }
    searchUrl.searchParams.set("safesearch", "moderate");
    searchUrl.searchParams.set("text_decorations", "false");
    searchUrl.searchParams.set("spellcheck", "true");

    const startTime = Date.now();
    const response = await fetch(searchUrl.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brave Search API error:", response.status, errorText);
      throw new Error(`Brave Search API error: ${response.status}`);
    }

    const data: BraveSearchResponse = await response.json();
    const searchTime = (Date.now() - startTime) / 1000;

    // Transform Brave results to our format
    const transformedResults =
      data.web?.results?.map((item, index) => ({
        id: `search-result-${offset + index}`,
        title: item.title,
        url: item.url,
        description: item.description,
        domain: item.meta_url?.hostname || new URL(item.url).hostname,
        thumbnail: item.thumbnail?.src || null,
        favicon:
          item.meta_url?.favicon ||
          `https://www.google.com/s2/favicons?domain=${item.meta_url?.hostname || new URL(item.url).hostname}`,
        timestamp: new Date().toISOString(),
        searchQuery: query,
        pageAge: item.page_age,
      })) || [];

    return NextResponse.json({
      query,
      results: transformedResults,
      totalResults: data.query.more_results_available
        ? "1000+"
        : transformedResults.length.toString(),
      searchTime,
      pagination: {
        start: parseInt(start),
        count: transformedResults.length,
        hasMore: data.query.more_results_available,
      },
      metadata: {
        provider: "Brave Search",
        country: data.query.country,
        language: data.query.language,
        safeSearch: data.query.safesearch,
      },
    });
  } catch (error) {
    console.error("Owl Search API error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
