"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PoolManagement from "@/components/pools/PoolManagement";
import SavedPosts from "@/components/pools/SavedPosts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface PoolCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
}

export default function SavedPage() {
  const { loading, isGuest, user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [categories, setCategories] = useState<PoolCategory[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const t = useTranslations("saved");

  const fetchCategories = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/pool-categories", { headers });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (!loading && !isGuest) {
      fetchCategories();
    }
  }, [loading, isGuest]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Droplets className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {t("signInToView")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("signInDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Droplets className="h-8 w-8 text-primary" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Pool Management */}
        <div className="lg:col-span-1">
          <PoolManagement
            onCategorySelect={setSelectedCategoryId}
            selectedCategoryId={selectedCategoryId}
            totalItemsCount={totalItemsCount}
          />
        </div>

        {/* Main Content - Saved Posts */}
        <div className="lg:col-span-2">
          <SavedPosts
            selectedCategoryId={selectedCategoryId}
            categories={categories}
            onItemsCountChange={setTotalItemsCount}
            onCategoriesRefresh={fetchCategories}
          />
        </div>
      </div>
    </div>
  );
}
