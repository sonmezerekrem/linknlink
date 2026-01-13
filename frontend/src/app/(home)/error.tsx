'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Home page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred while loading your links.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="h-11">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="h-11"
          >
            Go to home
          </Button>
        </div>
      </div>
    </div>
  );
}
