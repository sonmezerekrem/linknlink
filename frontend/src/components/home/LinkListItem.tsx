'use client';

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExternalLink, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Link } from './types';
import { getLinkTitle, getLinkDescription, getLinkImage } from './utils';

type LinkListItemProps = {
  link: Link;
  onToggleTag: (linkId: string | undefined, tagId: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
};

export function LinkListItem({ link, onToggleTag, onEdit, onDelete }: LinkListItemProps) {
  const imageUrl = getLinkImage(link);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 block"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={getLinkTitle(link)}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
            )}
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group-hover:text-primary transition-colors"
              >
                <CardTitle className="text-base line-clamp-1 font-semibold tracking-tight">
                  {getLinkTitle(link)}
                </CardTitle>
              </a>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {link.og_site_name && (
              <CardDescription className="text-xs mb-1">
                {link.og_site_name}
              </CardDescription>
            )}
            {link.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {getLinkDescription(link)}
              </p>
            )}
          </div>
          {link.expand?.tags && link.expand.tags.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5 max-w-[200px]">
              {link.expand.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color || '#3b82f6', color: 'white' }}
                  className="text-xs px-2 py-0.5"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(link)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(link)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
