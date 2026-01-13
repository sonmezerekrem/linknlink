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

// PUT/PATCH - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, color } = body;

    const tag = await pb.collection('tags').update(params.id, {
      name: name || undefined,
      color: color || undefined,
    });

    return NextResponse.json(tag);
  } catch (error: any) {
    console.error('PUT /api/tags/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tag' },
      { status: error?.status || 400 }
    );
  }
}

// DELETE - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await pb.collection('tags').delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/tags/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tag' },
      { status: error?.status || 400 }
    );
  }
}
