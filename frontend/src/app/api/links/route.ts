import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie) {
    return null;
  }

  const authData = JSON.parse(authCookie.value);
  const pb = getServerPocketBase();
  pb.authStore.save(authData.token, authData.model);
  return authData.model;
}

// OpenGraph scraper with proper timeout
async function fetchOpenGraph(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const getMeta = (property: string) => {
      const regex = new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        'i'
      );
      const match = html.match(regex);
      return match?.[1]?.trim();
    };

    const getNameMeta = (name: string) => {
      const regex = new RegExp(
        `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
        'i'
      );
      const match = html.match(regex);
      return match?.[1]?.trim();
    };

    const title =
      getMeta('og:title') ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ||
      getNameMeta('title');
    const description =
      getMeta('og:description') ||
      getNameMeta('description');
    const image = getMeta('og:image');
    const siteName = getMeta('og:site_name');

    return { title, description, image, siteName };
  } catch (error) {
    console.error('OpenGraph fetch error:', error);
    return { title: undefined, description: undefined, image: undefined, siteName: undefined };
  }
}

// GET - List links with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pb = getServerPocketBase();
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pb_auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authData = JSON.parse(authCookie.value);
    pb.authStore.save(authData.token, authData.model);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.max(1, Math.min(50, parseInt(searchParams.get('perPage') || '12', 10)));
    const rawSearch = searchParams.get('search') || '';
    const tagId = searchParams.get('tagId') || '';

    // Build filter - escape special characters for PocketBase filter
    let filter = `user = "${user.id}"`;
    
    if (rawSearch.trim()) {
      // Escape quotes and backslashes for PocketBase filter
      const escapedSearch = rawSearch
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      filter += ` && (title ~ "${escapedSearch}" || description ~ "${escapedSearch}" || url ~ "${escapedSearch}")`;
    }

    if (tagId && tagId.trim()) {
      filter += ` && tags ~ "${tagId}"`;
    }

    const result = await pb.collection('links').getList(page, perPage, {
      filter,
      expand: 'tags',
      sort: '-created',
    });

    return NextResponse.json({
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('GET /api/links error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch links',
        ...(process.env.NODE_ENV === 'development' && { details: error.stack })
      },
      { status: 500 }
    );
  }
}

// POST - Create new link
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pb = getServerPocketBase();
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pb_auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authData = JSON.parse(authCookie.value);
    pb.authStore.save(authData.token, authData.model);

    const body = await request.json();
    const { url, tags, notes } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch OpenGraph data (best-effort, non-blocking)
    let og: { title?: string; description?: string; image?: string; siteName?: string } = {};
    try {
      og = await fetchOpenGraph(url);
    } catch (ogError) {
      console.warn('OpenGraph fetch failed, continuing without metadata:', ogError);
      // Continue without OpenGraph data
    }

    const link = await pb.collection('links').create({
      url: url.trim(),
      title: og.title || '',
      description: og.description || '',
      og_image: og.image || '',
      og_site_name: og.siteName || '',
      tags: Array.isArray(tags) ? tags : [],
      notes: notes || '',
      user: user.id,
      is_favorite: false,
      archived: false,
    }, {
      expand: 'tags',
    });

    return NextResponse.json(link);
  } catch (error: any) {
    console.error('POST /api/links error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create link' },
      { status: 400 }
    );
  }
}
