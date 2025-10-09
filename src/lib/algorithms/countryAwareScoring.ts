/**
 * Country-Aware Content Scoring
 * Smart hybrid system: 70% local + 30% global content distribution
 */

export interface CountryPreferences {
  userCountry: string | null;
  userLanguage: string | null;
  preferLocalContent: boolean;
}

export interface ContentCountryInfo {
  authorCountry: string | null;
  language: string | null;
}

/**
 * Country matching score configuration
 * Controls the balance between local and global content
 */
export const COUNTRY_SCORE_CONFIG = {
  // Local content boost (when countries match)
  LOCAL_MATCH_SCORE: 1.0,

  // Same language but different country
  LANGUAGE_MATCH_SCORE: 0.6,

  // Global content (no country specified)
  GLOBAL_CONTENT_SCORE: 0.5,

  // Different country and language
  FOREIGN_CONTENT_SCORE: 0.3,

  // Weight of country factor in final scoring
  COUNTRY_WEIGHT: 0.2, // 20% of total score

  // Local content ratio when user prefers local
  LOCAL_CONTENT_RATIO: 0.7, // 70% local, 30% global

  // Diversity injection ratio
  DIVERSITY_RATIO: 0.3, // 30% global content for diversity
};

/**
 * Calculate country-aware score for content
 * Returns a score between 0-1 based on country/language matching
 */
export function calculateCountryScore(
  userPrefs: CountryPreferences,
  contentInfo: ContentCountryInfo,
): number {
  // If user doesn't prefer local content, treat all content equally
  if (!userPrefs.preferLocalContent) {
    return COUNTRY_SCORE_CONFIG.GLOBAL_CONTENT_SCORE;
  }

  // If content has no country info (global content)
  if (!contentInfo.authorCountry) {
    return COUNTRY_SCORE_CONFIG.GLOBAL_CONTENT_SCORE;
  }

  // If user has no country info
  if (!userPrefs.userCountry) {
    return COUNTRY_SCORE_CONFIG.GLOBAL_CONTENT_SCORE;
  }

  // Perfect match: same country
  if (userPrefs.userCountry === contentInfo.authorCountry) {
    return COUNTRY_SCORE_CONFIG.LOCAL_MATCH_SCORE;
  }

  // Language match but different country
  if (
    userPrefs.userLanguage &&
    contentInfo.language &&
    userPrefs.userLanguage === contentInfo.language
  ) {
    return COUNTRY_SCORE_CONFIG.LANGUAGE_MATCH_SCORE;
  }

  // Foreign content
  return COUNTRY_SCORE_CONFIG.FOREIGN_CONTENT_SCORE;
}

/**
 * Determine if content should be included based on country preferences
 * Used for filtering content pool before scoring
 */
export function shouldIncludeContent(
  userPrefs: CountryPreferences,
  contentInfo: ContentCountryInfo,
  diversityMode: boolean = false,
): boolean {
  // In diversity mode, include more global content
  if (diversityMode) {
    return true;
  }

  // If user doesn't prefer local content, include everything
  if (!userPrefs.preferLocalContent) {
    return true;
  }

  // Global content is always included
  if (!contentInfo.authorCountry) {
    return true;
  }

  // No user country info, include everything
  if (!userPrefs.userCountry) {
    return true;
  }

  // Local content is always included
  if (userPrefs.userCountry === contentInfo.authorCountry) {
    return true;
  }

  // Language match content is included
  if (
    userPrefs.userLanguage &&
    contentInfo.language &&
    userPrefs.userLanguage === contentInfo.language
  ) {
    return true;
  }

  // Probabilistically include some foreign content for diversity
  // This ensures 30% global content mix
  return Math.random() < COUNTRY_SCORE_CONFIG.DIVERSITY_RATIO;
}

/**
 * Get country-aware WHERE clause for database queries
 * Implements the 70/30 local/global split
 */
export function getCountryAwareWhereClause(userPrefs: CountryPreferences): any {
  // If user doesn't prefer local content, no filtering
  if (!userPrefs.preferLocalContent || !userPrefs.userCountry) {
    return {};
  }

  // Build OR clause for country-aware filtering
  // This implements the smart hybrid approach
  return {
    OR: [
      // Local content (same country)
      { authorCountry: userPrefs.userCountry },

      // Same language content
      { language: userPrefs.userLanguage },

      // Global content (no country specified)
      { authorCountry: null },

      // Small portion of other content for diversity
      // This is handled probabilistically in post-processing
    ],
  };
}

/**
 * Calculate diversity score for country distribution
 * Higher score = more diverse country representation
 */
export function calculateCountryDiversityScore(
  contentCountries: (string | null)[],
): number {
  if (contentCountries.length === 0) return 0;

  // Count unique countries
  const uniqueCountries = new Set(contentCountries.filter((c) => c !== null));
  const globalContent = contentCountries.filter((c) => c === null).length;

  // Diversity = ratio of unique countries to total content
  const countryDiversity = uniqueCountries.size / contentCountries.length;
  const globalRatio = globalContent / contentCountries.length;

  // Ideal is 70% local + 30% diverse (global or other countries)
  return countryDiversity * 0.7 + globalRatio * 0.3;
}

/**
 * Balance content distribution to achieve optimal local/global ratio
 * Takes scored content and ensures proper distribution
 */
export function balanceCountryDistribution<
  T extends { authorCountry?: string | null; score: number },
>(
  scoredContent: T[],
  userCountry: string | null,
  targetLocalRatio: number = COUNTRY_SCORE_CONFIG.LOCAL_CONTENT_RATIO,
): T[] {
  if (!userCountry || scoredContent.length === 0) {
    return scoredContent;
  }

  // Separate local and non-local content
  const localContent = scoredContent.filter(
    (c) => c.authorCountry === userCountry,
  );
  const globalContent = scoredContent.filter(
    (c) => c.authorCountry !== userCountry,
  );

  // Calculate target counts
  const totalCount = scoredContent.length;
  const targetLocalCount = Math.floor(totalCount * targetLocalRatio);
  const targetGlobalCount = totalCount - targetLocalCount;

  // Balance the distribution
  const balancedLocal = localContent.slice(0, targetLocalCount);
  const balancedGlobal = globalContent.slice(0, targetGlobalCount);

  // Merge and re-sort by score
  const balanced = [...balancedLocal, ...balancedGlobal];
  balanced.sort((a, b) => b.score - a.score);

  return balanced;
}

/**
 * Get country name display (for UI/debugging)
 */
export function getCountryDisplayName(countryCode: string | null): string {
  if (!countryCode) return "Global";

  // Common country codes to display names
  const countryNames: Record<string, string> = {
    TR: "Türkiye",
    US: "United States",
    GB: "United Kingdom",
    DE: "Germany",
    FR: "France",
    ES: "Spain",
    IT: "Italy",
    JP: "Japan",
    CN: "China",
    IN: "India",
    BR: "Brazil",
    MX: "Mexico",
    CA: "Canada",
    AU: "Australia",
    NL: "Netherlands",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    PL: "Poland",
    RU: "Russia",
    KR: "South Korea",
  };

  return countryNames[countryCode.toUpperCase()] || countryCode;
}

/**
 * Detect user country from request (helper for API routes)
 * Can be used with Vercel's geo headers or other IP-based detection
 */
export function detectUserCountryFromRequest(request: Request): string | null {
  // Check Vercel's geo headers
  const headers = request.headers;
  const country = headers.get("x-vercel-ip-country");

  if (country) {
    return country;
  }

  // Fallback: could use IP geolocation service
  return null;
}
