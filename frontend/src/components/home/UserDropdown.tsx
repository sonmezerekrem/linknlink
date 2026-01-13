'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { UserProfileDialog } from './UserProfileDialog';
import type { RecordModel } from 'pocketbase';

type UserDropdownProps = {
  user: RecordModel | null;
  onLogout: () => void;
};

export function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getInitials = (email?: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 w-10 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Avatar className="h-10 w-10 border-2 border-zinc-200 dark:border-zinc-800">
              <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                {getInitials(user?.email, user?.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-base font-semibold bg-primary text-primary-foreground">
                  {getInitials(user?.email, user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsProfileOpen(true)}
            className="cursor-pointer py-2.5"
          >
            <User className="mr-3 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserProfileDialog
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        user={user}
      />
    </>
  );
}
