"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { EditForm } from "@/types/userProfile";
import { SUBJECTS_EN, SUBJECTS_TR } from "@/constants/userProfile";
import { translateGrade, translateSubject } from "@/utils/userProfile";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/constants/countries";

interface UserProfileEditProps {
  isOpen: boolean;
  editForm: EditForm;
  isSaving: boolean;
  currentLocale: string;
  t: any;
  trRoles: any;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (updates: Partial<EditForm>) => void;
}

export const UserProfileEdit: React.FC<UserProfileEditProps> = ({
  isOpen,
  editForm,
  isSaving,
  currentLocale,
  t,
  trRoles,
  onClose,
  onSave,
  onFormChange,
}) => {
  const tOnb = useTranslations("onboarding");
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[min(92vw,560px)] sm:w-[min(92vw,640px)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
          <DialogDescription>{t("profile.basicInfo")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {t("profile.displayName")}
            </label>
            <Input
              value={editForm.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              placeholder={t("profile.displayName")}
            />
          </div>

          {/* Danger Zone */}
          <div className="mt-6 border-t pt-4">
            <div className="mb-2 text-sm font-medium text-red-600">
              {t("profile.deleteAccount")}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {t("profile.deleteAccountWarning")}
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("profile.deleteAccount")}
            </Button>
          </div>

          {/* Site-level confirmation modal (no browser alert) */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="w-[min(92vw,520px)] max-h-[75vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("profile.deleteAccount")}</DialogTitle>
                <DialogDescription>
                  {t("profile.deleteAccountWarning")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm">{t("profile.confirmDelete")}</p>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Type DELETE to confirm
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirmText !== "DELETE"}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/users", {
                          method: "DELETE",
                        });
                        if (!res.ok) {
                          throw new Error("Failed to delete account");
                        }
                        await signOut({ redirect: true, callbackUrl: "/" });
                      } catch (err) {
                        router.refresh();
                      }
                    }}
                  >
                    {t("profile.deleteAccount")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div>
            <label className="text-sm font-medium">
              {t("profile.username")}
            </label>
            <Input
              value={editForm.username}
              onChange={(e) => onFormChange({ username: e.target.value })}
              placeholder={t("profile.usernamePlaceholder")}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {t("profile.usernameHelp")}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              {t("profile.country")}
            </label>
            <Select
              value={editForm.country || ""}
              onValueChange={(value) => onFormChange({ country: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("profile.country")} />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center gap-2">
                      {c.flag && <span className="text-lg">{c.flag}</span>}
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1">
              {t("profile.countryChangeNote", {
                default:
                  "You can change your country a limited number of times.",
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              {t("settings.roleLabel")}
            </label>
            <Select
              value={editForm.role}
              onValueChange={(value) => onFormChange({ role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.rolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">{trRoles("STUDENT")}</SelectItem>
                <SelectItem value="TEACHER">{trRoles("TEACHER")}</SelectItem>
                <SelectItem value="ACADEMICIAN">
                  {trRoles("ACADEMICIAN")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">{t("profile.school")}</label>
            <Input
              value={editForm.school}
              onChange={(e) => onFormChange({ school: e.target.value })}
              placeholder={t("profile.school")}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("profile.grade")}</label>
            <Select
              value={editForm.grade}
              onValueChange={(value) => onFormChange({ grade: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("profile.grade")}>
                  {editForm.grade
                    ? translateGrade(editForm.grade, currentLocale)
                    : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {tOnb(`grade.levels.${g.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              {t("profile.favoriteSubjects")}
            </label>
            <Select
              value={editForm.favoriteSubject}
              onValueChange={(value) =>
                onFormChange({ favoriteSubject: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("profile.favoriteSubjects")}>
                  {editForm.favoriteSubject
                    ? translateSubject(editForm.favoriteSubject, currentLocale)
                    : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(currentLocale === "tr" ? SUBJECTS_TR : SUBJECTS_EN).map(
                  (subject, index) => (
                    <SelectItem key={subject} value={SUBJECTS_EN[index]}>
                      {subject}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">{t("profile.bio")}</label>
            <Textarea
              value={editForm.bio}
              onChange={(e) => onFormChange({ bio: e.target.value })}
              placeholder={t("userProfile.bioPlaceholder")}
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {editForm.bio.length}/200 {t("common.characters")}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              {t("common.cancel")}
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
