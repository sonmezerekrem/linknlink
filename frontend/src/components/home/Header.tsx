'use client';

import { Button } from '@/components/ui/button';

type HeaderProps = {
  userEmail?: string;
  onLogout: () => void;
};

export function Header({ userEmail, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          LinknLink
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {userEmail}
          </span>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
