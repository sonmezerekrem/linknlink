'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Link, Tag } from './types';

interface LinksContextValue {
  links: Link[];
  setLinks: (links: Link[]) => void;
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  refreshLinks: () => Promise<void>;
  refreshTags: () => Promise<void>;
}

const LinksContext = createContext<LinksContextValue | undefined>(undefined);

export function useLinksContext() {
  const context = useContext(LinksContext);
  if (!context) {
    throw new Error('useLinksContext must be used within LinksProvider');
  }
  return context;
}

interface LinksProviderProps {
  children: ReactNode;
  initialLinks: Link[];
  initialTags: Tag[];
  searchParams?: {
    page?: string;
    search?: string;
    tagId?: string;
  };
}

export function LinksProvider({
  children,
  initialLinks,
  initialTags,
  searchParams = {}
}: LinksProviderProps) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [tags, setTags] = useState<Tag[]>(initialTags);

  const refreshLinks = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: searchParams.page || '1',
        perPage: '12',
      });

      if (searchParams.search) params.append('search', searchParams.search);
      if (searchParams.tagId && searchParams.tagId !== 'all') {
        params.append('tagId', searchParams.tagId);
      }

      const response = await fetch(`/api/links?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      const data = await response.json();
      setLinks(data.items || []);
    } catch (error) {
      console.error('Failed to refresh links:', error);
    }
  }, [searchParams.page, searchParams.search, searchParams.tagId]);

  const refreshTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Failed to refresh tags:', error);
    }
  }, []);

  return (
    <LinksContext.Provider
      value={{
        links,
        setLinks,
        tags,
        setTags,
        refreshLinks,
        refreshTags
      }}
    >
      {children}
    </LinksContext.Provider>
  );
}
