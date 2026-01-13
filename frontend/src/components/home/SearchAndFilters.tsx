'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <Select value={selectedTag} onValueChange={onTagFilterChange}>
        <SelectTrigger className="w-[180px] h-11">
          <SelectValue placeholder="Filter by tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tags</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
