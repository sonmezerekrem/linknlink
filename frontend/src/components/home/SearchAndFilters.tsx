'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, Check } from 'lucide-react';
import type { Tag } from './types';

type SearchAndFiltersProps = {
  search: string;
  selectedTag: string;
  tags: Tag[];
  onSearchChange: (value: string) => void;
  onTagFilterChange: (tagId: string) => void;
};

export function SearchAndFilters({
  search,
  selectedTag,
  tags,
  onSearchChange,
  onTagFilterChange,
}: SearchAndFiltersProps) {
  const selectedTagName = selectedTag === 'all'
    ? 'All tags'
    : tags.find(t => t.id === selectedTag)?.name || 'All tags';

  return (
    <>
      <div className="relative flex-1 max-w-md">
        <Input
          placeholder="Search links..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-11 min-w-[180px] justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedTagName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem
            onClick={() => onTagFilterChange('all')}
            className="cursor-pointer"
          >
            <span className="flex-1">All tags</span>
            {selectedTag === 'all' && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          {tags.map((tag) => (
            <DropdownMenuItem
              key={tag.id}
              onClick={() => onTagFilterChange(tag.id)}
              className="cursor-pointer"
            >
              <span className="flex-1">{tag.name}</span>
              {selectedTag === tag.id && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
