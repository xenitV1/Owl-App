"use client";

/**
 * Onboarding Check Component
 *
 * Checks if user needs onboarding and shows modal if needed.
 * Only shown once per user on first login.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingCheck() {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        setIsChecking(false);
        return;
      }

      if (status === "authenticated" && session?.user?.email) {
        try {
          // Fetch user profile to check onboarding status
          const response = await fetch("/api/users/profile");

          if (response.ok) {
            const userData = await response.json();

            // Check if onboarding is needed
            const needsOnboarding =
              !userData.onboardingComplete ||
              !userData.country ||
              !userData.grade ||
              !userData.favoriteSubject;

            setUserId(userData.id);
            setShowOnboarding(needsOnboarding);
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        } finally {
          setIsChecking(false);
        }
      }
    }

    checkOnboardingStatus();
  }, [session, status]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);

    // Reload page to refresh user data
    window.location.reload();
  };

  if (isChecking || !userId) {
    return null;
  }

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      onComplete={handleOnboardingComplete}
      userId={userId}
    />
  );
}
