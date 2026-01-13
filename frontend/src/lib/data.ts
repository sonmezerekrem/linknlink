import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getServerPocketBase } from './pocketbase-server';
import type { Link, Tag, LinksResponse } from '@/components/home/types';

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie) {
    return null;
  }

  try {
    const authData = JSON.parse(authCookie.value);
    const pb = getServerPocketBase();
    pb.authStore.save(authData.token, authData.model);
    return authData.model;
  } catch (error) {
    console.error('Invalid auth cookie:', error);
    return null;
  }
}

// Cached data fetching functions using React cache()
// These automatically deduplicate requests within the same render

export const getLinks = cache(async (params: {
  page?: number;
  perPage?: number;
  search?: string;
  tagId?: string;
}): Promise<LinksResponse> => {
  const user = await getAuthenticatedUser();
  if (!user) {
    // Return empty response instead of throwing
    return {
      items: [],
      page: 1,
      perPage: 12,
      totalItems: 0,
      totalPages: 0,
    };
  }

  const pb = getServerPocketBase();
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie) {
    return {
      items: [],
      page: 1,
      perPage: 12,
      totalItems: 0,
      totalPages: 0,
    };
  }

  const authData = JSON.parse(authCookie.value);
  pb.authStore.save(authData.token, authData.model);

  const page = Math.max(1, params.page || 1);
  const perPage = Math.max(1, Math.min(50, params.perPage || 12));
  const rawSearch = params.search || '';
  const tagId = params.tagId || '';

  // Build filter
  let filter = `user = "${user.id}"`;

  if (rawSearch.trim()) {
    const escapedSearch = rawSearch
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .slice(0, 200);
    filter += ` && (title ~ "${escapedSearch}" || description ~ "${escapedSearch}" || url ~ "${escapedSearch}")`;
  }

  if (tagId && tagId.trim()) {
    const sanitizedTagId = tagId.trim().slice(0, 50);
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedTagId)) {
      throw new Error('Invalid tag ID format');
    }
    filter += ` && tags ~ "${sanitizedTagId}"`;
  }

  const result = await pb.collection('links').getList(page, perPage, {
    filter,
    expand: 'tags',
    sort: '-created',
  });

  return {
    items: result.items as unknown as Link[],
    page: result.page,
    perPage: result.perPage,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
});

export const getTags = cache(async (): Promise<Tag[]> => {
  const user = await getAuthenticatedUser();
  if (!user) {
    // Return empty array instead of throwing
    return [];
  }

  const pb = getServerPocketBase();
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie) {
    return [];
  }

  const authData = JSON.parse(authCookie.value);
  pb.authStore.save(authData.token, authData.model);

  const tags = await pb.collection('tags').getFullList({
    filter: `user = "${user.id}"`,
    sort: 'name',
  });

  return tags as unknown as Tag[];
});

export const getCurrentUser = cache(async () => {
  return await getAuthenticatedUser();
});
