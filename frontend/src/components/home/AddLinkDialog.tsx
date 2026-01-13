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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import type { Tag } from './types';

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
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags available. Create tags in &quot;Manage Tags&quot; first.
                </p>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={newLink.tags.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onNewLinkChange({
                            ...newLink,
                            tags: [...newLink.tags, tag.id],
                          });
                        } else {
                          onNewLinkChange({
                            ...newLink,
                            tags: newLink.tags.filter((t) => t !== tag.id),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
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
