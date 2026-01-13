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
import { Label } from '@/components/ui/label';
import { Tag as TagIcon, Edit2, Trash2 } from 'lucide-react';
import type { Tag } from './types';

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <TagIcon className="mr-2 h-4 w-4" />
          Manage Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Create, edit, or delete tags for organizing your links
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Tag Name *</Label>
            <div className="flex gap-2">
              <Input
                id="tag-name"
                placeholder="Enter tag name"
                value={editingTag ? editingTag.name : newTag.name}
                onChange={(e) =>
                  editingTag
                    ? onEditingTagChange({ ...editingTag, name: e.target.value })
                    : onNewTagChange({ ...newTag, name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                type="color"
                value={editingTag ? editingTag.color || '#3b82f6' : newTag.color}
                onChange={(e) =>
                  editingTag
                    ? onEditingTagChange({ ...editingTag, color: e.target.value })
                    : onNewTagChange({ ...newTag, color: e.target.value })
                }
                className="w-20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {editingTag ? (
              <>
                <Button onClick={onUpdateTag} className="flex-1">
                  Update Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onEditingTagChange(null);
                    onNewTagChange({ name: '', color: '#3b82f6' });
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={onCreateTag} className="flex-1">
                Create Tag
              </Button>
            )}
          </div>
          <div className="border-t pt-4">
            <Label className="mb-3 block">Existing Tags</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet. Create one above!</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-md border hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      />
                      <span>{tag.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onEditingTagChange(tag);
                          onNewTagChange({ name: tag.name, color: tag.color || '#3b82f6' });
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTag(tag.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
