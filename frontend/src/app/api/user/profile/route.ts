import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

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

export async function PUT(request: NextRequest) {
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
    const { name } = body;

    // Validate and sanitize name
    const sanitizedName = name ? String(name).trim().slice(0, 200) : '';
    
    const updatedUser = await pb.collection('users').update(user.id, {
      name: sanitizedName,
    });

    // Update the cookie with the new user data
    const newAuthData = {
      token: authData.token,
      model: updatedUser,
    };

    const response = NextResponse.json(updatedUser);
    response.cookies.set('pb_auth', JSON.stringify(newAuthData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: error?.status || 400 }
    );
  }
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: error?.status || 400 }
    );
  }
}
