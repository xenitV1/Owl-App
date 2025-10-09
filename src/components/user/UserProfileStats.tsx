import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, MessageCircle, Users2, Users } from "lucide-react";
import { UserProfile } from "@/types/userProfile";

interface UserProfileStatsProps {
  profile: UserProfile;
  t: any;
}

export const UserProfileStats: React.FC<UserProfileStatsProps> = ({
  profile,
  t,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-4 text-center">
          <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{profile._count.posts}</div>
          <div className="text-sm text-muted-foreground">
            {t("common.posts")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <MessageCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{profile._count.comments}</div>
          <div className="text-sm text-muted-foreground">
            {t("comments.comments")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Users2 className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{profile._count.followers}</div>
          <div className="text-sm text-muted-foreground">
            {t("common.followers")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{profile._count.following}</div>
          <div className="text-sm text-muted-foreground">
            {t("following.title")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
