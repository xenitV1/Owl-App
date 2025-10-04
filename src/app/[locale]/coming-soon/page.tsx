"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Clock,
  Mail,
  Zap,
  BookOpen,
  Users,
  FolderOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Brain,
  Share2,
  UserPlus,
  FileText,
  Network,
  Lock,
  Twitter,
  Linkedin,
  ExternalLink,
} from "lucide-react";

export default function ComingSoonPage() {
  const t = useTranslations("comingSoon");
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Theme-aware styles
  const getThemeStyles = () => {
    switch (resolvedTheme) {
      case "dark":
        return {
          background: "bg-gradient-to-br from-gray-900 to-gray-800",
          text: "text-white",
          textMuted: "text-gray-300",
          card: "bg-gray-800 border-gray-700",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          input: "bg-gray-700 border-gray-600 text-white placeholder-gray-400",
        };
      case "retro-light":
        return {
          background: "bg-gradient-to-br from-amber-50 to-orange-100",
          text: "text-amber-900",
          textMuted: "text-amber-700",
          card: "bg-amber-50 border-amber-200",
          button: "bg-amber-600 hover:bg-amber-700 text-amber-50",
          input:
            "bg-amber-50 border-amber-300 text-amber-900 placeholder-amber-600",
        };
      case "retro-dark":
        return {
          background: "bg-gradient-to-br from-amber-900 to-orange-900",
          text: "text-amber-50",
          textMuted: "text-amber-200",
          card: "bg-amber-800 border-amber-700",
          button: "bg-amber-600 hover:bg-amber-700 text-amber-50",
          input:
            "bg-amber-800 border-amber-600 text-amber-50 placeholder-amber-300",
        };
      default: // light
        return {
          background: "bg-gradient-to-br from-blue-50 to-indigo-100",
          text: "text-gray-900",
          textMuted: "text-gray-600",
          card: "bg-white border-gray-200",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          input: "bg-white border-gray-300 text-gray-900 placeholder-gray-500",
        };
    }
  };

  const styles = getThemeStyles();

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setEmail("");
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Bir hata oluştu, lütfen tekrar deneyin",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${styles.background} transition-all duration-500 overflow-hidden`}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            {/* Main Logo */}
            <div className="flex justify-center mb-8">
              <Logo size="xl" showText={false} />
            </div>

            <Badge
              variant="secondary"
              className="mb-4 text-sm bg-white/20 text-white border-white/30"
            >
              🎓 {t("badge")}
            </Badge>

            <h1
              className={`text-5xl md:text-7xl font-bold mb-6 ${styles.text} transition-all duration-500`}
            >
              {t("title")}
              <span className="text-blue-600"> {t("titleHighlight")}</span>
            </h1>

            <p
              className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${styles.textMuted} transition-all duration-500`}
            >
              {t("subtitle")}
            </p>

            {/* Waitlist Form */}
            <div className="max-w-md mx-auto mb-12">
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("cta.emailPlaceholder")}
                    className={`flex-1 ${styles.input}`}
                    required
                  />
                  <Button
                    type="submit"
                    className={`px-8 ${styles.button} transition-all duration-500`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        {t("cta.saving")}
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        {t("notifyButton")}
                      </>
                    )}
                  </Button>
                </div>

                {message && (
                  <div
                    className={`flex items-center justify-center space-x-2 p-3 rounded-md ${
                      message.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm">{message.text}</span>
                  </div>
                )}
              </form>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="outline"
                size="lg"
                className={`text-lg px-8 py-4 border-2 ${styles.text} hover:bg-opacity-10 transition-all duration-500`}
              >
                <Clock className="mr-2 h-5 w-5" />
                {t("demoButton")}
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        {resolvedTheme === "dark" ? (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-gray-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gray-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </>
        ) : resolvedTheme?.startsWith("retro") ? (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </>
        )}
      </section>

      {/* About Section */}
      <section
        className={`py-20 ${resolvedTheme === "dark" ? "bg-gray-900" : resolvedTheme?.startsWith("retro") ? "bg-amber-50" : "bg-white"}`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              {t("about.title")}
            </Badge>
            <h2
              className={`text-4xl md:text-5xl font-bold mb-6 ${styles.text} transition-all duration-500`}
            >
              {t("about.subtitle")}
            </h2>
            <p
              className={`text-xl mb-6 ${styles.textMuted} transition-all duration-500`}
            >
              {t("about.description")}
            </p>
            <p
              className={`text-lg ${styles.textMuted} transition-all duration-500 italic`}
            >
              {t("about.mission")}
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className={`text-4xl font-bold mb-4 ${styles.text} transition-all duration-500`}
            >
              {t("keyFeatures.title")}
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${styles.textMuted} transition-all duration-500`}
            >
              {t("keyFeatures.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                titleKey: "keyFeatures.aiPowered.title",
                descriptionKey: "keyFeatures.aiPowered.description",
                color: "text-purple-600",
              },
              {
                icon: Share2,
                titleKey: "keyFeatures.noteSharing.title",
                descriptionKey: "keyFeatures.noteSharing.description",
                color: "text-blue-600",
              },
              {
                icon: UserPlus,
                titleKey: "keyFeatures.studyGroups.title",
                descriptionKey: "keyFeatures.studyGroups.description",
                color: "text-green-600",
              },
              {
                icon: FileText,
                titleKey: "keyFeatures.richEditor.title",
                descriptionKey: "keyFeatures.richEditor.description",
                color: "text-orange-600",
              },
              {
                icon: Network,
                titleKey: "keyFeatures.communities.title",
                descriptionKey: "keyFeatures.communities.description",
                color: "text-pink-600",
              },
              {
                icon: Lock,
                titleKey: "keyFeatures.privacy.title",
                descriptionKey: "keyFeatures.privacy.description",
                color: "text-red-600",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`hover:shadow-xl transition-all duration-500 ${styles.card} border-2 group hover:scale-105`}
              >
                <CardContent className="p-6">
                  <feature.icon
                    className={`h-14 w-14 ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                  />
                  <h3
                    className={`text-xl font-bold mb-3 ${styles.text} transition-all duration-500`}
                  >
                    {t(feature.titleKey)}
                  </h3>
                  <p
                    className={`text-sm ${styles.textMuted} transition-all duration-500`}
                  >
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Work Environment Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className={`text-4xl font-bold mb-4 ${styles.text} transition-all duration-500`}
            >
              {t("workEnvironment.title")}
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${styles.textMuted} transition-all duration-500`}
            >
              {t("workEnvironment.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                titleKey: "workEnvironment.features.focused.title",
                descriptionKey: "workEnvironment.features.focused.description",
              },
              {
                icon: Users,
                titleKey: "workEnvironment.features.collaborative.title",
                descriptionKey:
                  "workEnvironment.features.collaborative.description",
              },
              {
                icon: FolderOpen,
                titleKey: "workEnvironment.features.organized.title",
                descriptionKey:
                  "workEnvironment.features.organized.description",
              },
              {
                icon: BookOpen,
                titleKey: "workEnvironment.features.productive.title",
                descriptionKey:
                  "workEnvironment.features.productive.description",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all duration-500 ${styles.card} border`}
              >
                <CardContent className="p-6 text-center">
                  <feature.icon
                    className={`h-12 w-12 text-blue-600 mb-4 mx-auto`}
                  />
                  <h3
                    className={`text-lg font-semibold mb-3 ${styles.text} transition-all duration-500`}
                  >
                    {t(feature.titleKey)}
                  </h3>
                  <p
                    className={`text-sm ${styles.textMuted} transition-all duration-500`}
                  >
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className={`text-4xl font-bold mb-4 ${styles.text} transition-all duration-500`}
            >
              {t("features.title")}
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${styles.textMuted} transition-all duration-500`}
            >
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Zap,
                titleKey: "features.fast.title",
                descriptionKey: "features.fast.description",
              },
              {
                icon: Clock,
                titleKey: "features.comingSoon.title",
                descriptionKey: "features.comingSoon.description",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all duration-500 ${styles.card} border`}
              >
                <CardContent className="p-6">
                  <feature.icon className={`h-12 w-12 text-blue-600 mb-4`} />
                  <h3
                    className={`text-xl font-semibold mb-2 ${styles.text} transition-all duration-500`}
                  >
                    {t(feature.titleKey)}
                  </h3>
                  <p
                    className={`${styles.textMuted} transition-all duration-500`}
                  >
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section
        className={`py-20 ${resolvedTheme === "dark" ? "bg-gray-800" : resolvedTheme?.startsWith("retro") ? "bg-amber-100" : "bg-blue-600"} text-white`}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">{t("cta.title")}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t("cta.subtitle")}
          </p>

          <div className="max-w-2xl mx-auto">
            <p className="text-lg opacity-90 mb-6">{t("cta.description")}</p>

            <div className="flex flex-wrap justify-center gap-4 text-sm opacity-75">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("cta.benefits.freeAccess")}
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("cta.benefits.specialAnnouncements")}
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("cta.benefits.noSpam")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="lg" className="text-white" />
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                {t("footer.description")}
              </p>
              <p className="text-gray-400 italic text-sm">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold mb-4 text-lg">
                {t("footer.legal.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer.links.privacy")}
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer.links.terms")}
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer.links.faq")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h3 className="text-white font-bold mb-4 text-lg">
                {t("footer.contact.title")}
              </h3>
              <a
                href="mailto:mehmet.apaydin0@outlook.com"
                className="text-gray-400 hover:text-white transition-colors flex items-center mb-6"
              >
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                {t("footer.contact.email")}
              </a>

              {/* Social Media */}
              <h4 className="text-white font-semibold mb-3 text-sm">
                {t("footer.social.title")}
              </h4>
              <div className="flex flex-col space-y-2">
                <a
                  href="https://x.com/owlapp_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group text-sm"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  <span>{t("footer.social.twitter")}</span>
                  <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://www.linkedin.com/in/apaydinm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center group text-sm"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  <span>
                    {t("footer.social.linkedin")} ({t("footer.social.founder")})
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
              <p className="text-gray-400 text-sm">{t("footer.copyright")}</p>
              <p className="text-gray-400 text-sm max-w-md">
                {t("footer.builtBy")}
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
