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
    <Card className="hover:shadow-lg transition-shadow overflow-hidden pt-0">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {imageUrl ? (
          <div className="h-48 w-full overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={getLinkTitle(link)}
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        )}
      </a>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <CardTitle className="line-clamp-2">
              {getLinkTitle(link)}
            </CardTitle>
          </a>
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
          <CardDescription>{link.og_site_name}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {link.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
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
                className="ml-auto"
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
