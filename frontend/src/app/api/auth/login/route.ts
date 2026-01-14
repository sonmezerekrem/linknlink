import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Data');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response);
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

    const response = NextResponse.json({
      user: authData.record,
      token: authData.token, // Include token for extension/API clients
    });
    
    return addCorsHeaders(response);
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 400 }
    );
    return addCorsHeaders(response);
  }
}
