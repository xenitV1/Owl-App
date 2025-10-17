import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Locale-based label helpers
export function getLocalizedSubjectLabel(
  subject?: string,
  locale: string = "en",
) {
  if (!subject) return "";
  const key = normalizeSubjectKey(subject);
  const mapEn: Record<string, string> = {
    all: "All Subjects",
    mathematics: "Mathematics",
    science: "Science",
    english: "English",
    history: "History",
    geography: "Geography",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    computerScience: "Computer Science",
    literature: "Literature",
    art: "Art",
    music: "Music",
    physicalEducation: "Physical Education",
    foreignLanguage: "Foreign Language",
    economics: "Economics",
    psychology: "Psychology",
    sociology: "Sociology",
    philosophy: "Philosophy",
    other: "Other",
  };
  const mapTr: Record<string, string> = {
    all: "Tüm Dersler",
    mathematics: "Matematik",
    science: "Fen Bilimleri",
    english: "İngilizce",
    history: "Tarih",
    geography: "Coğrafya",
    physics: "Fizik",
    chemistry: "Kimya",
    biology: "Biyoloji",
    computerScience: "Bilgisayar Bilimi",
    literature: "Edebiyat",
    art: "Sanat",
    music: "Müzik",
    physicalEducation: "Beden Eğitimi",
    foreignLanguage: "Yabancı Dil",
    economics: "Ekonomi",
    psychology: "Psikoloji",
    sociology: "Sosyoloji",
    philosophy: "Felsefe",
    other: "Diğer",
  };
  const dict = locale.startsWith("tr") ? mapTr : mapEn;
  return dict[key] ?? subject;
}

export function getLocalizedGradeLabel(grade?: string, locale: string = "en") {
  if (!grade) return "";
  const key = normalizeGradeKey(grade);
  const mapEn: Record<string, string> = {
    elementary: "Elementary School",
    middleSchool: "Middle School",
    highSchool: "High School",
    university: "University",
    graduate: "Graduate",
    other: "Other",
  };
  const mapTr: Record<string, string> = {
    elementary: "İlkokul",
    middleSchool: "Ortaokul",
    highSchool: "Lise",
    university: "Üniversite",
    graduate: "Mezun",
    other: "Diğer",
  };
  const dict = locale.startsWith("tr") ? mapTr : mapEn;
  return dict[key] ?? grade;
}

// Build a CDN URL for country flag SVGs (3x2 format)
export function getCountryFlagUrl(code?: string | null): string | undefined {
  if (!code) return undefined;
  const cc = code.toUpperCase().trim();
  if (!/^[A-Z]{2}$/.test(cc)) return undefined;
  return `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${cc}.svg`;
}

function normalizeSubjectKey(value: string) {
  const v = value.trim().toLowerCase();
  const map: Record<string, string> = {
    matematik: "mathematics",
    science: "science",
    fen: "science",
    "fen bilimleri": "science",
    english: "english",
    ingilizce: "english",
    history: "history",
    tarih: "history",
    geography: "geography",
    coğrafya: "geography",
    physics: "physics",
    fizik: "physics",
    chemistry: "chemistry",
    kimya: "chemistry",
    biology: "biology",
    biyoloji: "biology",
    "computer science": "computerScience",
    "bilgisayar bilimi": "computerScience",
    literature: "literature",
    edebiyat: "literature",
    art: "art",
    sanat: "art",
    music: "music",
    müzik: "music",
    "physical education": "physicalEducation",
    "beden eğitimi": "physicalEducation",
    "foreign language": "foreignLanguage",
    "yabancı dil": "foreignLanguage",
    economics: "economics",
    ekonomi: "economics",
    psychology: "psychology",
    psikoloji: "psychology",
    sociology: "sociology",
    sosyoloji: "sociology",
    philosophy: "philosophy",
    felsefe: "philosophy",
    "all subjects": "all",
    "tüm dersler": "all",
    other: "other",
    diğer: "other",
  };
  return map[v] ?? (v.replace(/\s+/g, "") as string);
}

function normalizeGradeKey(value: string) {
  const v = value.trim().toLowerCase();
  const map: Record<string, string> = {
    "elementary school": "elementary",
    ilkokul: "elementary",
    "middle school": "middleSchool",
    ortaokul: "middleSchool",
    "high school": "highSchool",
    lise: "highSchool",
    university: "university",
    üniversite: "university",
    graduate: "graduate",
    mezun: "graduate",
    other: "other",
    diğer: "other",
  };
  return map[v] ?? v;
}
