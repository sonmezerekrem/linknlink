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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Link, Tag } from './types';

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
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tags available. Create tags in &quot;Manage Tags&quot; first.
                  </p>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-tag-${tag.id}`}
                        checked={(editingLink.tags || []).includes(tag.id)}
                        onCheckedChange={(checked) => {
                          const currentTags = editingLink.tags || [];
                          if (checked) {
                            onEditingLinkChange({
                              ...editingLink,
                              tags: [...currentTags, tag.id],
                            });
                          } else {
                            onEditingLinkChange({
                              ...editingLink,
                              tags: currentTags.filter((t) => t !== tag.id),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`edit-tag-${tag.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: tag.color || '#3b82f6' }}
                        />
                        {tag.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
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
