import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pb = getServerPocketBase();
    const authData = await pb.collection('users').authWithPassword(email, password);

    // Set httpOnly cookie with the token
    const cookieStore = await cookies();
    cookieStore.set('pb_auth', JSON.stringify({
      token: authData.token,
      model: authData.record,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      user: authData.record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 400 }
    );
  }
}
