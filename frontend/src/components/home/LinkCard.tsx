'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

type LinkCardProps = {
  link: Link;
  onToggleTag: (linkId: string | undefined, tagId: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
};

export function LinkCard({ link, onToggleTag, onEdit, onDelete }: LinkCardProps) {
  const imageUrl = getLinkImage(link);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pt-0">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {imageUrl ? (
          <div className="h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={imageUrl}
              alt={getLinkTitle(link)}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
        )}
      </a>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group-hover:text-primary transition-colors"
          >
            <CardTitle className="line-clamp-2 text-base font-semibold tracking-tight">
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
          <CardDescription className="text-xs">{link.og_site_name}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {link.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {getLinkDescription(link)}
          </p>
        )}
        <div className="flex items-center justify-between">
          {link.expand?.tags && link.expand.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
                className="ml-auto h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
