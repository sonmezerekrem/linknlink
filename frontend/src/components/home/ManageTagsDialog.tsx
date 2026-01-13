'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tag as TagIcon, Edit2, Trash2, Check } from 'lucide-react';
import type { Tag } from './types';
import { cn } from '@/lib/utils';

const TAG_COLORS = [
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

type ManageTagsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  editingTag: Tag | null;
  newTag: { name: string; color: string };
  onEditingTagChange: (tag: Tag | null) => void;
  onNewTagChange: (tag: { name: string; color: string }) => void;
  onCreateTag: () => void;
  onUpdateTag: () => void;
  onDeleteTag: (tagId: string) => void;
};

export function ManageTagsDialog({
  isOpen,
  onOpenChange,
  tags,
  editingTag,
  newTag,
  onEditingTagChange,
  onNewTagChange,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: ManageTagsDialogProps) {
  const currentColor = editingTag ? editingTag.color || '#3b82f6' : newTag.color;
  const currentName = editingTag ? editingTag.name : newTag.name;

  const handleColorSelect = (color: string) => {
    if (editingTag) {
      onEditingTagChange({ ...editingTag, color });
    } else {
      onNewTagChange({ ...newTag, color });
    }
  };

  const handleNameChange = (name: string) => {
    if (editingTag) {
      onEditingTagChange({ ...editingTag, name });
    } else {
      onNewTagChange({ ...newTag, name });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TagIcon className="mr-2 h-4 w-4" />
          Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Create and organize tags for your links
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Input
              placeholder="Tag name"
              value={currentName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorSelect(color.value)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all flex items-center justify-center',
                    currentColor === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-background'
                      : 'hover:scale-110'
                  )}
                  style={{
                    backgroundColor: color.value,
                  }}
                  title={color.name}
                >
                  {currentColor === color.value && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>
              ))}
            </div>
            {currentName && (
              <div className="pt-1">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <Badge
                  style={{ backgroundColor: currentColor, color: 'white' }}
                >
                  {currentName}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {editingTag ? (
              <>
                <Button onClick={onUpdateTag} size="sm" className="flex-1">
                  Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEditingTagChange(null);
                    onNewTagChange({ name: '', color: '#3b82f6' });
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={onCreateTag} size="sm" className="flex-1">
                Create Tag
              </Button>
            )}
          </div>
          {tags.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-xs text-muted-foreground mb-3 block">Your Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="group relative">
                    <Badge
                      style={{ backgroundColor: tag.color || '#3b82f6', color: 'white' }}
                      className="pr-14 cursor-default"
                    >
                      {tag.name}
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            onEditingTagChange(tag);
                            onNewTagChange({ name: tag.name, color: tag.color || '#3b82f6' });
                          }}
                          className="p-0.5 hover:bg-white/20 rounded"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteTag(tag.id)}
                          className="p-0.5 hover:bg-white/20 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
