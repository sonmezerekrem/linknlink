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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import type { Link, Tag } from './types';
import { cn } from '@/lib/utils';

type EditLinkDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  editingLink: Link | null;
  onEditingLinkChange: (link: Link) => void;
  onSubmit: () => void;
};

export function EditLinkDialog({
  isOpen,
  onOpenChange,
  tags,
  editingLink,
  onEditingLinkChange,
  onSubmit,
}: EditLinkDialogProps) {
  const toggleTag = (tagId: string) => {
    if (!editingLink) return;
    const currentTags = editingLink.tags || [];
    if (currentTags.includes(tagId)) {
      onEditingLinkChange({
        ...editingLink,
        tags: currentTags.filter((t) => t !== tagId),
      });
    } else {
      onEditingLinkChange({
        ...editingLink,
        tags: [...currentTags, tagId],
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update link details and tags
          </DialogDescription>
        </DialogHeader>
        {editingLink && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editingLink.title || ''}
                onChange={(e) =>
                  onEditingLinkChange({ ...editingLink, title: e.target.value })
                }
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editingLink.description || ''}
                onChange={(e) =>
                  onEditingLinkChange({ ...editingLink, description: e.target.value })
                }
                className="h-11"
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
                    const isSelected = (editingLink.tags || []).includes(tag.id);
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
