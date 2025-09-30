'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

export const UserProfile: React.FC = () => {
  const { user, dbUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      toast.success('Successfully signed out!');
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  const displayName = dbUser?.name || user.name || '';
  const avatarUrl = dbUser?.avatar || undefined;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName || 'User'} />
            <AvatarFallback>
              {displayName ? getInitials(displayName) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {displayName && (
              <p className="font-medium">{displayName}</p>
            )}
          </div>
        </div>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};