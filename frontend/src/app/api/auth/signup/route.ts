import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, passwordConfirm } = await request.json();

    if (!email || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: 'Email, password, and password confirmation are required' },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const pb = getServerPocketBase();
    
    // Create user
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm,
    });

    // Auto-login after signup
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
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
