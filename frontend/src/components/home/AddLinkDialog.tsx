'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Check } from 'lucide-react';
import type { Tag } from './types';
import { cn } from '@/lib/utils';

type AddLinkDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  newLink: { url: string; tags: string[] };
  onNewLinkChange: (link: { url: string; tags: string[] }) => void;
  onSubmit: () => void;
};

export function AddLinkDialog({
  isOpen,
  onOpenChange,
  tags,
  newLink,
  onNewLinkChange,
  onSubmit,
}: AddLinkDialogProps) {
  const toggleTag = (tagId: string) => {
    if (newLink.tags.includes(tagId)) {
      onNewLinkChange({
        ...newLink,
        tags: newLink.tags.filter((t) => t !== tagId),
      });
    } else {
      onNewLinkChange({
        ...newLink,
        tags: [...newLink.tags, tagId],
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Link</DialogTitle>
          <DialogDescription>
            Paste a URL. We&apos;ll pull title and description automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={newLink.url}
              onChange={(e) =>
                onNewLinkChange({ ...newLink, url: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags available. Create tags in &quot;Tags&quot; first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = newLink.tags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: isSelected ? tag.color || '#3b82f6' : 'transparent',
                        color: isSelected ? 'white' : tag.color || '#3b82f6',
                        borderColor: tag.color || '#3b82f6',
                      }}
                      variant="outline"
                      className={cn(
                        'cursor-pointer transition-all',
                        isSelected ? 'pr-1' : 'hover:opacity-80'
                      )}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Add Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
