import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users2 } from "lucide-react";
import { getInitials } from "@/utils/userProfile";

interface BlockedUser {
  id: string;
  blockedId: string;
  createdAt: string;
  blocked: {
    name?: string;
    avatar?: string;
  };
}

interface BlockedUsersModalProps {
  isOpen: boolean;
  blockedUsers: BlockedUser[];
  unblockingUsers: Set<string>;
  t: any;
  onClose: () => void;
  onUnblock: (blockedUserId: string) => void;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  isOpen,
  blockedUsers,
  unblockingUsers,
  t,
  onClose,
  onUnblock,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            {t("profile.blockedUsers")}
          </DialogTitle>
          <DialogDescription>
            {t("profile.blockedUsersDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {t("profile.noBlockedUsers")}
              </h3>
              <p className="text-muted-foreground">
                {t("profile.noBlockedUsersDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((blockedUser) => {
                const isUnblocking = unblockingUsers.has(blockedUser.blockedId);

                return (
                  <div
                    key={blockedUser.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      isUnblocking
                        ? "opacity-75 scale-98"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={blockedUser.blocked.avatar}
                          alt={blockedUser.blocked.name}
                        />
                        <AvatarFallback>
                          {blockedUser.blocked.name
                            ? getInitials(blockedUser.blocked.name)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {blockedUser.blocked.name ||
                            t("common.anonymousUser")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("profile.blockedOn")}{" "}
                          {new Date(blockedUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnblock(blockedUser.blockedId)}
                      disabled={unblockingUsers.has(blockedUser.blockedId)}
                      className={`transition-all duration-300 ${
                        unblockingUsers.has(blockedUser.blockedId)
                          ? "bg-green-50 border-green-200 text-green-700 animate-pulse"
                          : "hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                      }`}
                    >
                      {unblockingUsers.has(blockedUser.blockedId) ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>{t("profile.unblocking")}</span>
                        </div>
                      ) : (
                        t("profile.unblock")
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
