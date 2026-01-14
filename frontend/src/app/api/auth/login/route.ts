import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

// Helper to add CORS headers with security restrictions
function addCorsHeaders(response: NextResponse, request?: NextRequest) {
  // Check if request is from extension (chrome-extension://) or same origin
  const origin = request?.headers.get('origin');
  const isExtension = origin?.startsWith('chrome-extension://');
  const isSameOrigin = origin && new URL(origin).hostname === request?.nextUrl.hostname;
  
  // Allow extension origins and same-origin requests
  if (isExtension || isSameOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // For web requests, use same-origin or specific allowed origins
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request);
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
    
    return addCorsHeaders(response, request);
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 400 }
    );
    return addCorsHeaders(response, request);
  }
}
