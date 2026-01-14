import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

// Helper to get authenticated user (supports both cookie and token auth)
async function getAuthenticatedUser(request: NextRequest) {
  const pb = getServerPocketBase();
  
  // Try token-based auth first (for extensions/API clients)
  // Extension sends full auth data in X-Auth-Data header as JSON
  const authDataHeader = request.headers.get('x-auth-data');
  if (authDataHeader) {
    try {
      const authData = JSON.parse(authDataHeader);
      if (authData.token && authData.model) {
        pb.authStore.save(authData.token, authData.model);
        // Verify token is still valid by checking if we can access the user
        try {
          // Try to get the user to verify token is valid
          const user = await pb.collection('users').getOne(authData.model.id);
          if (user && pb.authStore.isValid) {
            return authData.model;
          }
        } catch (error) {
          // Token invalid, fall through to cookie auth
          console.error('Token validation failed:', error);
        }
      }
    } catch (error) {
      // Invalid auth data, fall through to cookie auth
      console.error('Invalid auth data header:', error);
    }
  }
  
  // Fall back to cookie-based auth (for web app)
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie) {
    return null;
  }

  try {
    const authData = JSON.parse(authCookie.value);
    pb.authStore.save(authData.token, authData.model);
    return authData.model;
  } catch (error) {
    console.error('Invalid auth cookie:', error);
    return null;
  }
}

// Validate URL to prevent SSRF attacks
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Block localhost and private IP ranges
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// OpenGraph scraper with proper timeout and SSRF protection
async function fetchOpenGraph(url: string) {
  try {
    // Validate URL to prevent SSRF
    if (!isValidUrl(url)) {
      throw new Error('Invalid or unsafe URL');
    }

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

// Helper to add CORS headers with security restrictions
function addCorsHeaders(response: NextResponse, request?: NextRequest) {
  // Check if request is from extension (chrome-extension://) or same origin
  const origin = request?.headers.get('origin');
  const isExtension = origin?.startsWith('chrome-extension://');
  const isSameOrigin = origin && new URL(origin).hostname === request?.nextUrl.hostname;
  
  // Allow extension origins and same-origin requests
  // For production, you might want to whitelist specific extension IDs
  if (isExtension || isSameOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // For web requests, use same-origin or specific allowed origins
    // In production, replace '*' with your actual frontend domain
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Data');
  return response;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, request);
}

// GET - List links with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const pb = getServerPocketBase();
    
    // Get authenticated user (supports both cookie and token auth)
    const user = await getAuthenticatedUser(request);
    if (!user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, request);
    }

    // If we authenticated via header, pb.authStore is already set
    // Otherwise, get auth from cookie
    const authDataHeader = request.headers.get('x-auth-data');
    if (!authDataHeader) {
      // Only check cookie if we didn't use header auth
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('pb_auth');
      
      if (!authCookie) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return addCorsHeaders(response, request);
      }

      let authData;
      try {
        authData = JSON.parse(authCookie.value);
        pb.authStore.save(authData.token, authData.model);
      } catch (error) {
        console.error('Invalid auth cookie:', error);
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return addCorsHeaders(response, request);
      }
    }

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
        .replace(/"/g, '\\"')
        .slice(0, 200); // Limit search length
      filter += ` && (title ~ "${escapedSearch}" || description ~ "${escapedSearch}" || url ~ "${escapedSearch}")`;
    }

    if (tagId && tagId.trim()) {
      // Validate tagId format (should be a valid ID)
      const sanitizedTagId = tagId.trim().slice(0, 50);
      if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedTagId)) {
        return NextResponse.json({ error: 'Invalid tag ID format' }, { status: 400 });
      }
      filter += ` && tags ~ "${sanitizedTagId}"`;
    }

    const result = await pb.collection('links').getList(page, perPage, {
      filter,
      expand: 'tags',
      sort: '-created',
    });

    const response = NextResponse.json({
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
    return addCorsHeaders(response, request);
  } catch (error: any) {
    console.error('GET /api/links error:', error?.data || error);
    const response = NextResponse.json(
      { 
        error: error?.data?.message || error?.message || 'Failed to fetch links'
      },
      { status: error?.status || 500 }
    );
    return addCorsHeaders(response, request);
  }
}

// POST - Create new link
export async function POST(request: NextRequest) {
  try {
    const pb = getServerPocketBase();
    
    // Get authenticated user (supports both cookie and token auth)
    const user = await getAuthenticatedUser(request);
    if (!user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, request);
    }

    // If we authenticated via header, pb.authStore is already set
    // Otherwise, get auth from cookie
    const authDataHeader = request.headers.get('x-auth-data');
    if (!authDataHeader) {
      // Only check cookie if we didn't use header auth
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('pb_auth');
      
      if (!authCookie) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return addCorsHeaders(response, request);
      }

      let authData;
      try {
        authData = JSON.parse(authCookie.value);
        pb.authStore.save(authData.token, authData.model);
      } catch (error) {
        console.error('Invalid auth cookie:', error);
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return addCorsHeaders(response, request);
      }
    }

    const body = await request.json();
    const { url, tags, notes, title, description } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      const response = NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      const response = NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
    }

    // Use provided title/description from extension, or fetch OpenGraph data
    let og: { title?: string; description?: string; image?: string; siteName?: string } = {};
    
    // If title/description are provided (from extension), use them
    if (title || description) {
      og.title = title;
      og.description = description;
    } else {
      // Otherwise, fetch OpenGraph data (best-effort, non-blocking)
      try {
        og = await fetchOpenGraph(url);
      } catch (ogError) {
        console.warn('OpenGraph fetch failed, continuing without metadata:', ogError);
        // Continue without OpenGraph data
      }
    }

    // Sanitize and validate input
    const sanitizedTitle = (og.title || '').trim().slice(0, 500);
    const sanitizedDescription = (og.description || '').trim().slice(0, 2000);
    const sanitizedNotes = (notes || '').trim().slice(0, 5000);
    
    // Process tags - extension sends tag names, but PocketBase expects tag IDs
    // Convert tag names to tag IDs (find existing or create new tags)
    let tagIds: string[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      const tagNames = tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 100);
      
      for (const tagName of tagNames) {
        try {
          const trimmedName = tagName.trim();
          
          // Try to find existing tag by name for this user
          const existingTags = await pb.collection('tags').getFullList({
            filter: `user = "${user.id}" && name = "${trimmedName.replace(/"/g, '\\"').replace(/\\/g, '\\\\')}"`,
            limit: 1,
          });
          
          if (existingTags.length > 0) {
            tagIds.push(existingTags[0].id);
          } else {
            // Create new tag if it doesn't exist
            // Generate a random color for the tag
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            const newTag = await pb.collection('tags').create({
              name: trimmedName,
              color: randomColor,
              user: user.id,
            });
            tagIds.push(newTag.id);
          }
        } catch (tagError: any) {
          console.error('Error processing tag:', tagName, tagError);
          // Continue with other tags even if one fails
        }
      }
    }

    console.log('Creating link with data:', {
      url: url.trim(),
      title: sanitizedTitle,
      description: sanitizedDescription,
      tagIds: tagIds,
      notes: sanitizedNotes,
      userId: user.id
    });

    const link = await pb.collection('links').create({
      url: url.trim(),
      title: sanitizedTitle,
      description: sanitizedDescription,
      og_image: (og.image || '').slice(0, 1000),
      og_site_name: (og.siteName || '').slice(0, 200),
      tags: tagIds, // Use tag IDs, not names
      notes: sanitizedNotes,
      user: user.id,
      is_favorite: false,
      archived: false,
    }, {
      expand: 'tags',
    });

    const response = NextResponse.json(link);
    return addCorsHeaders(response, request);
  } catch (error: any) {
    console.error('POST /api/links error:', error?.data || error);
    console.error('Error details:', {
      message: error?.message,
      data: error?.data,
      status: error?.status,
      response: error?.response
    });
    
    // Provide more detailed error message
    let errorMessage = 'Failed to create link';
    if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.data) {
      // PocketBase errors often have data object with details
      errorMessage = JSON.stringify(error.data);
    }
    
    const response = NextResponse.json(
      { error: errorMessage },
      { status: error?.status || 400 }
    );
    return addCorsHeaders(response, request);
  }
}
