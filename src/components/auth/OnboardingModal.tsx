"use client";

/**
 * Onboarding Modal Component
 *
 * Collects essential user information on first login:
 * 1. Country selection (mandatory, permanent)
 * 2. Grade level (changeable after 24 hours)
 * 3. Favorite subject
 * 4. Interests (optional)
 *
 * Fully i18n compatible and responsive
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Globe,
  GraduationCap,
  Book,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Comprehensive list of world countries
const COUNTRIES = [
  { code: "AF", name: "Afghanistan", nameLocal: "افغانستان", flag: "🇦🇫" },
  { code: "AL", name: "Albania", nameLocal: "Shqipëri", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", nameLocal: "الجزائر", flag: "🇩🇿" },
  { code: "AR", name: "Argentina", nameLocal: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", nameLocal: "Հայաստան", flag: "🇦🇲" },
  { code: "AU", name: "Australia", nameLocal: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", nameLocal: "Österreich", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", nameLocal: "Azərbaycan", flag: "🇦🇿" },
  { code: "BH", name: "Bahrain", nameLocal: "البحرين", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", nameLocal: "বাংলাদেশ", flag: "🇧🇩" },
  { code: "BY", name: "Belarus", nameLocal: "Беларусь", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", nameLocal: "België", flag: "🇧🇪" },
  { code: "BA", name: "Bosnia", nameLocal: "Bosna", flag: "🇧🇦" },
  { code: "BR", name: "Brazil", nameLocal: "Brasil", flag: "🇧🇷" },
  { code: "BG", name: "Bulgaria", nameLocal: "България", flag: "🇧🇬" },
  { code: "CA", name: "Canada", nameLocal: "Canada", flag: "🇨🇦" },
  { code: "CL", name: "Chile", nameLocal: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", nameLocal: "中国", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", nameLocal: "Colombia", flag: "🇨🇴" },
  { code: "HR", name: "Croatia", nameLocal: "Hrvatska", flag: "🇭🇷" },
  { code: "CY", name: "Cyprus", nameLocal: "Κύπρος", flag: "🇨🇾" },
  { code: "CZ", name: "Czechia", nameLocal: "Česko", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", nameLocal: "Danmark", flag: "🇩🇰" },
  { code: "EG", name: "Egypt", nameLocal: "مصر", flag: "🇪🇬" },
  { code: "EE", name: "Estonia", nameLocal: "Eesti", flag: "🇪🇪" },
  { code: "FI", name: "Finland", nameLocal: "Suomi", flag: "🇫🇮" },
  { code: "FR", name: "France", nameLocal: "France", flag: "🇫🇷" },
  { code: "GE", name: "Georgia", nameLocal: "საქართველო", flag: "🇬🇪" },
  { code: "DE", name: "Germany", nameLocal: "Deutschland", flag: "🇩🇪" },
  { code: "GR", name: "Greece", nameLocal: "Ελλάδα", flag: "🇬🇷" },
  { code: "HK", name: "Hong Kong", nameLocal: "香港", flag: "🇭🇰" },
  { code: "HU", name: "Hungary", nameLocal: "Magyarország", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", nameLocal: "Ísland", flag: "🇮🇸" },
  { code: "IN", name: "India", nameLocal: "भारत", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", nameLocal: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", nameLocal: "ایران", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", nameLocal: "العراق", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", nameLocal: "Éire", flag: "🇮🇪" },
  { code: "IL", name: "Israel", nameLocal: "ישראל", flag: "🇮🇱" },
  { code: "IT", name: "Italy", nameLocal: "Italia", flag: "🇮🇹" },
  { code: "JP", name: "Japan", nameLocal: "日本", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", nameLocal: "الأردن", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", nameLocal: "Қазақстан", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", nameLocal: "Kenya", flag: "🇰🇪" },
  { code: "KW", name: "Kuwait", nameLocal: "الكويت", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", nameLocal: "Кыргызстан", flag: "🇰🇬" },
  { code: "LV", name: "Latvia", nameLocal: "Latvija", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", nameLocal: "لبنان", flag: "🇱🇧" },
  { code: "LY", name: "Libya", nameLocal: "ليبيا", flag: "🇱🇾" },
  { code: "LT", name: "Lithuania", nameLocal: "Lietuva", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", nameLocal: "Luxembourg", flag: "🇱🇺" },
  { code: "MY", name: "Malaysia", nameLocal: "Malaysia", flag: "🇲🇾" },
  { code: "MT", name: "Malta", nameLocal: "Malta", flag: "🇲🇹" },
  { code: "MX", name: "Mexico", nameLocal: "México", flag: "🇲🇽" },
  { code: "MD", name: "Moldova", nameLocal: "Moldova", flag: "🇲🇩" },
  { code: "MA", name: "Morocco", nameLocal: "المغرب", flag: "🇲🇦" },
  { code: "NL", name: "Netherlands", nameLocal: "Nederland", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", nameLocal: "New Zealand", flag: "🇳🇿" },
  { code: "NG", name: "Nigeria", nameLocal: "Nigeria", flag: "🇳🇬" },
  { code: "MK", name: "North Macedonia", nameLocal: "Македонија", flag: "🇲🇰" },
  { code: "NO", name: "Norway", nameLocal: "Norge", flag: "🇳🇴" },
  { code: "OM", name: "Oman", nameLocal: "عمان", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", nameLocal: "پاکستان", flag: "🇵🇰" },
  { code: "PS", name: "Palestine", nameLocal: "فلسطين", flag: "🇵🇸" },
  { code: "PE", name: "Peru", nameLocal: "Perú", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", nameLocal: "Pilipinas", flag: "🇵🇭" },
  { code: "PL", name: "Poland", nameLocal: "Polska", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", nameLocal: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", nameLocal: "قطر", flag: "🇶🇦" },
  { code: "RO", name: "Romania", nameLocal: "România", flag: "🇷🇴" },
  { code: "RU", name: "Russia", nameLocal: "Россия", flag: "🇷🇺" },
  { code: "SA", name: "Saudi Arabia", nameLocal: "السعودية", flag: "🇸🇦" },
  { code: "RS", name: "Serbia", nameLocal: "Србија", flag: "🇷🇸" },
  { code: "SG", name: "Singapore", nameLocal: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", nameLocal: "Slovensko", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", nameLocal: "Slovenija", flag: "🇸🇮" },
  { code: "ZA", name: "South Africa", nameLocal: "South Africa", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", nameLocal: "대한민국", flag: "🇰🇷" },
  { code: "ES", name: "Spain", nameLocal: "España", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", nameLocal: "Sverige", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", nameLocal: "Schweiz", flag: "🇨🇭" },
  { code: "SY", name: "Syria", nameLocal: "سوريا", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", nameLocal: "台灣", flag: "🇹🇼" },
  { code: "TH", name: "Thailand", nameLocal: "ไทย", flag: "🇹🇭" },
  { code: "TN", name: "Tunisia", nameLocal: "تونس", flag: "🇹🇳" },
  { code: "TR", name: "Türkiye", nameLocal: "Türkiye", flag: "🇹🇷" },
  { code: "UA", name: "Ukraine", nameLocal: "Україна", flag: "🇺🇦" },
  { code: "AE", name: "UAE", nameLocal: "الإمارات", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", nameLocal: "UK", flag: "🇬🇧" },
  { code: "US", name: "United States", nameLocal: "USA", flag: "🇺🇸" },
  { code: "UZ", name: "Uzbekistan", nameLocal: "Oʻzbekiston", flag: "🇺🇿" },
  { code: "VN", name: "Vietnam", nameLocal: "Việt Nam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", nameLocal: "اليمن", flag: "🇾🇪" },
  { code: "OTHER", name: "Other", nameLocal: "Other", flag: "🌍" },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userId: string;
}

export function OnboardingModal({
  isOpen,
  onComplete,
  userId,
}: OnboardingModalProps) {
  const t = useTranslations("onboarding");

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [country, setCountry] = useState("");
  const [grade, setGrade] = useState("");
  const [favoriteSubject, setFavoriteSubject] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const totalSteps = 4;

  // Grade levels matching the profile settings
  const GRADES = [
    { value: "9th Grade", key: "9th" },
    { value: "10th Grade", key: "10th" },
    { value: "11th Grade", key: "11th" },
    { value: "12th Grade", key: "12th" },
    { value: "Freshman", key: "freshman" },
    { value: "Sophomore", key: "sophomore" },
    { value: "Junior", key: "junior" },
    { value: "Senior", key: "senior" },
    { value: "High School Graduate", key: "highschoolGraduate" },
    { value: "University Graduate", key: "universityGraduate" },
    { value: "Graduate", key: "graduateStudent" },
    { value: "Teacher", key: "teacher" },
    { value: "Other", key: "other" },
  ];

  // Subjects matching the profile settings
  const SUBJECTS = [
    { value: "math", key: "math", icon: "📐" },
    { value: "physics", key: "physics", icon: "⚛️" },
    { value: "chemistry", key: "chemistry", icon: "🧪" },
    { value: "biology", key: "biology", icon: "🧬" },
    { value: "literature", key: "literature", icon: "📚" },
    { value: "history", key: "history", icon: "🏛️" },
    { value: "geography", key: "geography", icon: "🌍" },
    { value: "english", key: "english", icon: "🇬🇧" },
    { value: "computer", key: "computer", icon: "💻" },
    { value: "art", key: "art", icon: "🎨" },
  ];

  const handleCountryConfirm = () => {
    if (!country) {
      setError(t("country.error"));
      return;
    }
    setError("");
    setStep(2);
  };

  const handleGradeSelect = () => {
    if (!grade) {
      setError(t("grade.error"));
      return;
    }
    setError("");
    setStep(3);
  };

  const handleSubjectSelect = () => {
    if (!favoriteSubject) {
      setError(t("subject.error"));
      return;
    }
    setError("");
    setStep(4);
  };

  const toggleInterest = (subject: string) => {
    if (interests.includes(subject)) {
      setInterests(interests.filter((s) => s !== subject));
    } else {
      setInterests([...interests, subject]);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Update user profile with onboarding data
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          grade,
          favoriteSubject,
          bio:
            interests.length > 0 ? `Interests: ${interests.join(", ")}` : null,
          onboardingComplete: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Track onboarding completion (creates first interaction)
      await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: "onboarding_completed",
          type: "VIEW",
          contentData: {
            subject: favoriteSubject,
            grade: grade,
          },
        }),
      }).catch((err) => {
        // Non-critical, just log
        console.warn("Failed to track onboarding:", err);
      });

      onComplete();
    } catch (err) {
      setError(t("errors.saveError"));
      console.error("Onboarding error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 flex-shrink-0" />
            {t("welcome")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("welcomeDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Progress bar */}
          <div className="flex gap-1 sm:gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 sm:h-2 flex-1 rounded-full transition-all ${
                  i < step ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Country Selection */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                {t("country.title")}
              </div>

              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>{t("country.important")}</strong>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li>{t("country.permanentWarning")}</li>
                    <li>{t("country.selectCorrectly")}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-10 sm:h-12">
                  <SelectValue placeholder={t("country.placeholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl">{c.flag}</span>
                        <span className="text-sm">{c.name}</span>
                        {c.nameLocal !== c.name && (
                          <span className="text-xs text-muted-foreground">
                            ({c.nameLocal})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {error && (
                <p className="text-xs sm:text-sm text-red-500">{error}</p>
              )}

              <Button
                onClick={handleCountryConfirm}
                className="w-full h-10 sm:h-12"
                disabled={!country}
              >
                {t("buttons.continue")}
              </Button>
            </div>
          )}

          {/* Step 2: Grade Selection */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                {t("grade.title")}
              </div>

              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>{t("grade.important")}</strong>{" "}
                  {t("grade.changeWarning")}
                </AlertDescription>
              </Alert>

              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-10 sm:h-12">
                  <SelectValue placeholder={t("grade.placeholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {GRADES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {t(`grade.levels.${g.key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {error && (
                <p className="text-xs sm:text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 h-10 sm:h-12"
                >
                  {t("buttons.back")}
                </Button>
                <Button
                  onClick={handleGradeSelect}
                  className="flex-1 h-10 sm:h-12"
                  disabled={!grade}
                >
                  {t("buttons.continue")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Favorite Subject */}
          {step === 3 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Book className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                {t("subject.title")}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("subject.description")}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject.value}
                    onClick={() => setFavoriteSubject(subject.value)}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left ${
                      favoriteSubject === subject.value
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl flex-shrink-0">
                        {subject.icon}
                      </span>
                      <span className="text-xs sm:text-sm font-medium">
                        {t(`subject.subjects.${subject.key}`)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs sm:text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 h-10 sm:h-12"
                >
                  {t("buttons.back")}
                </Button>
                <Button
                  onClick={handleSubjectSelect}
                  className="flex-1 h-10 sm:h-12"
                  disabled={!favoriteSubject}
                >
                  {t("buttons.continue")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Additional Interests (Optional) */}
          {step === 4 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold flex-wrap">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500 flex-shrink-0" />
                <span>{t("interests.title")}</span>
                <Badge variant="secondary" className="text-xs">
                  {t("interests.optional")}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("interests.description")}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.filter((s) => s.value !== favoriteSubject).map(
                  (subject) => (
                    <button
                      key={subject.value}
                      onClick={() => toggleInterest(subject.value)}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left ${
                        interests.includes(subject.value)
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950"
                          : "border-gray-200 dark:border-gray-700 hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {subject.icon}
                        </span>
                        <span className="text-xs sm:text-sm font-medium">
                          {t(`subject.subjects.${subject.key}`)}
                        </span>
                        {interests.includes(subject.value) && (
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ),
                )}
              </div>

              {error && (
                <p className="text-xs sm:text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="flex-1 h-10 sm:h-12"
                  disabled={isLoading}
                >
                  {t("buttons.back")}
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1 h-10 sm:h-12"
                  disabled={isLoading}
                >
                  {isLoading ? t("buttons.saving") : t("buttons.complete")} ✨
                </Button>
              </div>
            </div>
          )}

          {/* Step indicator */}
          <div className="text-center text-xs text-muted-foreground">
            {t("step")} {step} {t("stepOf")} {totalSteps}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
