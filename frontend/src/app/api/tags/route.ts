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

// GET - List all tags for the user
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pb = getServerPocketBase();
    const authCookie = await cookies();
    const authData = JSON.parse(authCookie.get('pb_auth')!.value);
    pb.authStore.save(authData.token, authData.model);

    const tags = await pb.collection('tags').getFullList({
      filter: `user = "${user.id}"`,
      sort: 'name',
    });

    return NextResponse.json(tags);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST - Create new tag
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
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    const sanitizedName = String(name).trim().slice(0, 100);
    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Tag name cannot be empty' },
        { status: 400 }
      );
    }

    // Validate hex color format
    const tagColor = color || '#3b82f6';
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(tagColor)) {
      return NextResponse.json(
        { error: 'Invalid color format' },
        { status: 400 }
      );
    }

    const tag = await pb.collection('tags').create({
      name: sanitizedName,
      color: tagColor,
      user: user.id,
    });

    return NextResponse.json(tag);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
      { status: 400 }
    );
  }
}
