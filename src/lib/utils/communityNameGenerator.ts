/**
 * Community Name Generator Utility
 *
 * Generates localized community names dynamically based on country and grade
 */

import { COUNTRIES } from "@/constants/countries";
import { getGradeDisplay } from "@/utils/userProfile";

export function generateCommunityName(
  country: string,
  grade: string,
  locale: string = "en",
): string {
  const gradeText = getGradeDisplay(grade, locale);

  // If country is a code, map to name and flag
  const code = country?.toUpperCase?.() || "";
  const c = COUNTRIES.find((c) => c.code === code);
  const countryDisplay = c ? `${c.flag ? c.flag + " " : ""}${c.name}` : country;

  return `${countryDisplay} - ${gradeText}`;
}

/**
 * Generate i18n key for a community
 */
export function generateCommunityI18nKey(
  country: string,
  grade: string,
): string {
  return `communities.${country.toLowerCase().replace(/\s+/g, "_")}_${grade.toLowerCase().replace(/\s+/g, "_")}`;
}

/**
 * Format community name with proper locale
 */
export function formatCommunityName(
  community: {
    name: string;
    nameKey?: string | null;
    country?: string | null;
    grade?: string | null;
  },
  locale: string = "en",
): string {
  // If it's a system-generated community, use dynamic generation
  if (community.country && community.grade) {
    return generateCommunityName(community.country, community.grade, locale);
  }

  // Otherwise, use the stored name
  return community.name;
}
