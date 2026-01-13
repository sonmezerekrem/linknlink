'use client';

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Edit2 } from 'lucide-react';
import type { Link } from './types';
import { getLinkTitle, getLinkDescription, getLinkImage } from './utils';

type LinkListItemProps = {
  link: Link;
  onToggleTag: (linkId: string | undefined, tagId: string) => void;
  onEdit: (link: Link) => void;
};

export function LinkListItem({ link, onToggleTag, onEdit }: LinkListItemProps) {
  const imageUrl = getLinkImage(link);

  return (
    <Card className="hover:shadow-lg transition-shadow py-0">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={getLinkTitle(link)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <CardTitle className="line-clamp-1">
                {getLinkTitle(link)}
              </CardTitle>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {link.og_site_name && (
              <CardDescription className="mb-2">
                {link.og_site_name}
              </CardDescription>
            )}
            {link.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {getLinkDescription(link)}
              </p>
            )}
            <div className="flex items-center justify-between">
              {link.expand?.tags && link.expand.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {link.expand.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color || '#3b82f6', color: 'white' }}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => onToggleTag(link.id, tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(link)}
                className="ml-auto"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
