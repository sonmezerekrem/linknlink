import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerPocketBase } from '@/lib/pocketbase-server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pb_auth');

    if (!authCookie) {
      return NextResponse.json({ user: null });
    }

    let authData;
    try {
      authData = JSON.parse(authCookie.value);
      // Validate auth data structure
      if (!authData || typeof authData !== 'object' || !authData.token || !authData.model) {
        throw new Error('Invalid auth data structure');
      }
    } catch (error) {
      // Invalid cookie format, clear it
      cookieStore.delete('pb_auth');
      return NextResponse.json({ user: null });
    }

    const pb = getServerPocketBase();
    
    // Set the auth token
    pb.authStore.save(authData.token, authData.model);

    // Verify the token is still valid by fetching the user
    try {
      const user = await pb.collection('users').getOne(authData.model.id);
      return NextResponse.json({ user });
    } catch (error) {
      // Token is invalid, clear the cookie
      cookieStore.delete('pb_auth');
      return NextResponse.json({ user: null });
    }
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
