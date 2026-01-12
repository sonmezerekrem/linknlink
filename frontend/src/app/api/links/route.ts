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

// GET - List links with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pb = getServerPocketBase();
    const authCookie = await cookies();
    const authData = JSON.parse(authCookie.get('pb_auth')!.value);
    pb.authStore.save(authData.token, authData.model);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '12');
    const search = searchParams.get('search') || '';
    const tagId = searchParams.get('tagId') || '';

    // Build filter
    let filter = `user = "${user.id}"`;
    
    if (search) {
      filter += ` && (title ~ "${search}" || description ~ "${search}" || url ~ "${search}")`;
    }

    if (tagId) {
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
    return NextResponse.json(
      { error: error.message || 'Failed to fetch links' },
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
    const authCookie = await cookies();
    const authData = JSON.parse(authCookie.get('pb_auth')!.value);
    pb.authStore.save(authData.token, authData.model);

    const body = await request.json();
    const { url, title, description, tags, notes } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const link = await pb.collection('links').create({
      url,
      title: title || '',
      description: description || '',
      tags: tags || [],
      notes: notes || '',
      user: user.id,
      is_favorite: false,
      archived: false,
    }, {
      expand: 'tags',
    });

    return NextResponse.json(link);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create link' },
      { status: 400 }
    );
  }
}
