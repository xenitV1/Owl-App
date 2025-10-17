"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgeGroup } from "@/types/ai";

interface AgeGroupSelectorProps {
  selected?: AgeGroup;
  onSelect: (ageGroup: AgeGroup) => void;
}

export function AgeGroupSelector({
  selected,
  onSelect,
}: AgeGroupSelectorProps) {
  const t = useTranslations("ai.ageGroups");

  const ageGroups: Array<{ value: AgeGroup; label: string }> = [
    { value: "elementary", label: t("elementary") },
    { value: "middle", label: t("middle") },
    { value: "high", label: t("high") },
    { value: "university", label: t("university") },
  ];

  return (
    <div className="space-y-2">
      <Label>{t("selectAgeGroup")}</Label>
      <Select value={selected || ""} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder={t("selectPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {ageGroups.map((group) => (
            <SelectItem key={group.value} value={group.value}>
              {group.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
