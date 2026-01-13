'use client';

import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';

type ViewModeToggleProps = {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
};

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('grid')}
        className="h-9 w-9"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('list')}
        className="h-9 w-9"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
