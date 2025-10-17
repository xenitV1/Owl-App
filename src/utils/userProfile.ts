import {
  GRADES_EN,
  GRADES_TR,
  SUBJECTS_EN,
  SUBJECTS_TR,
} from "@/constants/userProfile";

// Helper function to encode Unicode strings to base64
export const encodeToBase64 = (str: string): string => {
  try {
    // Try standard btoa first for Latin1 characters
    return btoa(str);
  } catch (e) {
    // If it fails, encode as UTF-8 bytes then base64
    const utf8Bytes = new TextEncoder().encode(str);
    const binaryString = Array.from(utf8Bytes, (byte) =>
      String.fromCharCode(byte),
    ).join("");
    return btoa(binaryString);
  }
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// İngilizce değerleri dil ayarına göre çevir
// New flexible translation that supports both legacy values and new onboarding values
export const translateGrade = (
  gradeValue: string,
  locale: string = "en",
): string => {
  if (!gradeValue) return "";

  // Normalize incoming value to a key
  const key = normalizeGradeKey(gradeValue);
  if (!key) return gradeValue;

  const mapEn: Record<string, string> = {
    "9th": "9th Grade",
    "10th": "10th Grade",
    "11th": "11th Grade",
    "12th": "12th Grade",
    freshman: "Freshman",
    sophomore: "Sophomore",
    junior: "Junior",
    senior: "Senior",
    highschoolGraduate: "High School Graduate",
    universityGraduate: "University Graduate",
    graduateStudent: "Graduate",
    teacher: "Teacher",
    other: "Other",
  };

  const mapTr: Record<string, string> = {
    "9th": "9. Sınıf",
    "10th": "10. Sınıf",
    "11th": "11. Sınıf",
    "12th": "12. Sınıf",
    freshman: "Hazırlık/1. Sınıf (Üniversite)",
    sophomore: "2. Sınıf (Üniversite)",
    junior: "3. Sınıf (Üniversite)",
    senior: "4. Sınıf (Üniversite)",
    highschoolGraduate: "Lise Mezunu",
    universityGraduate: "Üniversite Mezunu",
    graduateStudent: "Yüksek Lisans/Doktora",
    teacher: "Öğretmen",
    other: "Diğer",
  };

  const dict = locale.startsWith("tr") ? mapTr : mapEn;
  return dict[key] ?? gradeValue;
};

export const translateSubject = (
  subjectValue: string,
  locale: string = "en",
): string => {
  if (!subjectValue) return "";
  const key = normalizeSubjectKey(subjectValue);
  if (!key) return subjectValue;

  const mapEn: Record<string, string> = {
    math: "Mathematics",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    literature: "Literature",
    history: "History",
    geography: "Geography",
    english: "English",
    computer: "Computer Science",
    art: "Art",
  };
  const mapTr: Record<string, string> = {
    math: "Matematik",
    physics: "Fizik",
    chemistry: "Kimya",
    biology: "Biyoloji",
    literature: "Edebiyat",
    history: "Tarih",
    geography: "Coğrafya",
    english: "İngilizce",
    computer: "Bilgisayar Bilimi",
    art: "Sanat",
  };
  const dict = locale.startsWith("tr") ? mapTr : mapEn;
  return dict[key] ?? subjectValue;
};

function normalizeSubjectKey(value: string): string | null {
  const v = value.trim().toLowerCase();
  const map: Record<string, string> = {
    mathematics: "math",
    math: "math",
    physics: "physics",
    chemistry: "chemistry",
    biology: "biology",
    literature: "literature",
    history: "history",
    geography: "geography",
    english: "english",
    "computer science": "computer",
    computer: "computer",
    art: "art",
    matematik: "math",
    fizik: "physics",
    kimya: "chemistry",
    biyoloji: "biology",
    edebiyat: "literature",
    tarih: "history",
    coğrafya: "geography",
    "bilgisayar bilimi": "computer",
    ingilizce: "english",
    sanat: "art",
  };
  return map[v] ?? null;
}

function normalizeGradeKey(value: string): string | null {
  const v = value.trim().toLowerCase();
  const map: Record<string, string> = {
    "9th grade": "9th",
    "10th grade": "10th",
    "11th grade": "11th",
    "12th grade": "12th",
    freshman: "freshman",
    sophomore: "sophomore",
    junior: "junior",
    senior: "senior",
    "high school graduate": "highschoolGraduate",
    "university graduate": "universityGraduate",
    graduate: "graduateStudent",
    teacher: "teacher",
    other: "other",
    // Turkish variants
    "9. sınıf": "9th",
    "10. sınıf": "10th",
    "11. sınıf": "11th",
    "12. sınıf": "12th",
    "hazırlık/1. sınıf (üniversite)": "freshman",
    "2. sınıf (üniversite)": "sophomore",
    "3. sınıf (üniversite)": "junior",
    "4. sınıf (üniversite)": "senior",
    "lise mezunu": "highschoolGraduate",
    "üniversite mezunu": "universityGraduate",
    "yüksek lisans/doktora": "graduateStudent",
    öğretmen: "teacher",
    diğer: "other",
  };
  // Handle legacy constants from GRADES_EN
  const legacyMap: Record<string, string> = {
    "9th grade (freshman)": "9th",
    "10th grade (sophomore)": "10th",
    "11th grade (junior)": "11th",
    "12th grade (senior)": "12th",
    undergraduate: "freshman",
  };
  return map[v] ?? legacyMap[v] ?? null;
}

export const formatDate = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const month = t(
    `userProfile.months.${date.toLocaleDateString("en-US", { month: "long" }).toLowerCase()}`,
  );
  const day = date.getDate();
  const year = date.getFullYear();
  return t("userProfile.dateFormat", { month, day, year });
};

// Merkezi grade seviyesi çeviri fonksiyonu
export const getGradeDisplay = (
  grade: string,
  locale: string = "en",
): string => {
  if (!grade) return "";

  // Önce normalize et
  const normalizedGrade = normalizeGradeKey(grade);
  if (!normalizedGrade) return grade;

  // İngilizce çeviriler
  const gradeTranslationsEn: Record<string, string> = {
    "9th": "9th Grade",
    "10th": "10th Grade",
    "11th": "11th Grade",
    "12th": "12th Grade",
    freshman: "Freshman",
    sophomore: "Sophomore",
    junior: "Junior",
    senior: "Senior",
    highschoolGraduate: "High School Graduate",
    universityGraduate: "University Graduate",
    graduateStudent: "Graduate",
    teacher: "Teacher",
    other: "Other",
  };

  // Türkçe çeviriler
  const gradeTranslationsTr: Record<string, string> = {
    "9th": "9. Sınıf",
    "10th": "10. Sınıf",
    "11th": "11. Sınıf",
    "12th": "12. Sınıf",
    freshman: "Hazırlık/1. Sınıf",
    sophomore: "2. Sınıf",
    junior: "3. Sınıf",
    senior: "4. Sınıf",
    highschoolGraduate: "Lise Mezunu",
    universityGraduate: "Üniversite Mezunu",
    graduateStudent: "Yüksek Lisans/Doktora",
    teacher: "Öğretmen",
    other: "Diğer",
  };

  const translations = locale.startsWith("tr")
    ? gradeTranslationsTr
    : gradeTranslationsEn;
  return translations[normalizedGrade] || grade;
};
