/**
 * Community Discovery Component
 *
 * Shows 3 sections:
 * 1. My Communities (joined)
 * 2. Discover by Grade (same grade, other countries)
 * 3. Public Communities (user-created)
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Globe, Hash, AlertCircle } from "lucide-react";
import { formatCommunityName } from "@/lib/utils/communityNameGenerator";
import { COUNTRIES } from "@/constants/countries";
import { getGradeDisplay } from "@/utils/userProfile";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  nameKey?: string | null;
  description?: string | null;
  country?: string | null;
  grade?: string | null;
  isSystemGenerated: boolean;
  isJoined?: boolean;
  _count: {
    members: number;
    posts: number;
  };
}

export function CommunityDiscovery() {
  const t = useTranslations("communities");
  const locale = useLocale();
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [discoverableCommunities, setDiscoverableCommunities] = useState<
    Community[]
  >([]);
  const [publicCommunities, setPublicCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        setIsLoading(true);

        // Fetch my communities
        const myResponse = await fetch("/api/communities?joined=true");
        if (myResponse.ok) {
          const data = await myResponse.json();
          setMyCommunities(data.communities || []);
        }

        // Fetch discoverable system communities (same grade, other countries)
        const discoverResponse = await fetch(
          "/api/communities/system/discover",
        );
        if (discoverResponse.ok) {
          const data = await discoverResponse.json();
          setDiscoverableCommunities(data.discoverableCommunities || []);
        }

        // Fetch public user-created communities
        const publicResponse = await fetch(
          "/api/communities?isPublic=true&limit=20",
        );
        if (publicResponse.ok) {
          const data = await publicResponse.json();
          // Filter out system communities
          const userCommunities = (data.communities || []).filter(
            (c: Community) => !c.isSystemGenerated,
          );
          setPublicCommunities(userCommunities);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching communities:", err);
        setError("Failed to load communities");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to join community");
      }

      // Update local state
      setDiscoverableCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? { ...c, isJoined: true } : c)),
      );
      setPublicCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? { ...c, isJoined: true } : c)),
      );

      // Refresh my communities
      const myResponse = await fetch("/api/communities?joined=true");
      if (myResponse.ok) {
        const data = await myResponse.json();
        setMyCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error joining community:", error);
      alert(t("joinError"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t("discover")}</h2>
        <p className="text-muted-foreground">
          {t("yourCommunity")} & {t("sameGradeOtherCountries")}
        </p>
      </div>

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my">
            <Hash className="h-4 w-4 mr-2" />
            {t("myCommunities")}
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Globe className="h-4 w-4 mr-2" />
            {t("discoverByGrade")}
          </TabsTrigger>
          <TabsTrigger value="public">
            <Users className="h-4 w-4 mr-2" />
            {t("publicCommunities")}
          </TabsTrigger>
        </TabsList>

        {/* My Communities */}
        <TabsContent value="my" className="space-y-4">
          {myCommunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                You haven't joined any communities yet
              </CardContent>
            </Card>
          ) : (
            myCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                locale={locale}
                showJoinButton={false}
                onJoin={handleJoinCommunity}
              />
            ))
          )}
        </TabsContent>

        {/* Discover by Grade */}
        <TabsContent value="discover" className="space-y-4">
          {discoverableCommunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No communities found for your grade
              </CardContent>
            </Card>
          ) : (
            discoverableCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                locale={locale}
                showJoinButton={!community.isJoined}
                onJoin={handleJoinCommunity}
              />
            ))
          )}
        </TabsContent>

        {/* Public Communities */}
        <TabsContent value="public" className="space-y-4">
          {publicCommunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No public communities available
              </CardContent>
            </Card>
          ) : (
            publicCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                locale={locale}
                showJoinButton={!community.isJoined}
                onJoin={handleJoinCommunity}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Community Card Component
function CommunityCard({
  community,
  locale,
  showJoinButton,
  onJoin,
}: {
  community: Community;
  locale: string;
  showJoinButton: boolean;
  onJoin: (id: string) => void;
}) {
  const t = useTranslations("communities");
  const displayName = formatCommunityName(community, locale);

  // Get country information
  const getCountryInfo = () => {
    if (!community.country) return null;
    const code = community.country.toUpperCase();
    return COUNTRIES.find((c) => c.code === code);
  };

  const countryInfo = getCountryInfo();
  const gradeDisplay = community.grade
    ? getGradeDisplay(community.grade, locale)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {displayName}
              {community.isSystemGenerated && (
                <Badge variant="secondary" className="text-xs">
                  {t("systemCommunity")}
                </Badge>
              )}
            </CardTitle>
            {/* Country and Grade Display */}
            {(countryInfo || gradeDisplay) && (
              <div className="flex items-center gap-2 mt-2">
                {countryInfo && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{countryInfo.flag}</span>
                    <span>{countryInfo.name}</span>
                  </div>
                )}
                {countryInfo && gradeDisplay && (
                  <span className="text-sm text-muted-foreground">•</span>
                )}
                {gradeDisplay && (
                  <span className="text-sm text-muted-foreground">
                    {gradeDisplay}
                  </span>
                )}
              </div>
            )}
            {community.description && (
              <CardDescription className="mt-2">
                {community.description}
              </CardDescription>
            )}
          </div>
          {showJoinButton && (
            <Button size="sm" onClick={() => onJoin(community.id)}>
              {t("join")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {community._count.members} {t("members")}
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            {community._count.posts} {t("posts")}
          </div>
        </div>
        <div className="mt-3">
          <Link href={`/communities/${community.id}`}>
            <Button variant="outline" size="sm">
              View Community
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
