'use client';

import { UserDropdown } from './UserDropdown';
import type { RecordModel } from 'pocketbase';

type HeaderProps = {
  user: RecordModel | null;
  onLogout: () => void;
};

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          LinknLink
        </h1>
        <UserDropdown user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
