'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserDropdown } from './UserDropdown';
import { Link2 } from 'lucide-react';
import type { RecordModel } from 'pocketbase';

type HeaderProps = {
  user: RecordModel | null;
};

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Link2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">LinknLink</span>
        </div>
        <UserDropdown user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}
