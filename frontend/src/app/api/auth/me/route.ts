import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerPocketBase } from '@/lib/pocketbase-server';

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

export async function GET(request: NextRequest) {
  try {
    const pb = getServerPocketBase();
    let authData = null;
    
    // Try token-based auth first (for extensions/API clients)
    const authDataHeader = request.headers.get('x-auth-data');
    if (authDataHeader) {
      try {
        authData = JSON.parse(authDataHeader);
        if (!authData || typeof authData !== 'object' || !authData.token || !authData.model) {
          authData = null;
        }
      } catch (error) {
        // Invalid auth data, fall through to cookie auth
      }
    }
    
    // Fall back to cookie-based auth (for web app)
    if (!authData) {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('pb_auth');

      if (!authCookie) {
        const response = NextResponse.json({ user: null });
        return addCorsHeaders(response, request);
      }

      try {
        authData = JSON.parse(authCookie.value);
        // Validate auth data structure
        if (!authData || typeof authData !== 'object' || !authData.token || !authData.model) {
          throw new Error('Invalid auth data structure');
        }
      } catch (error) {
        // Invalid cookie format, clear it
        const cookieStore = await cookies();
        cookieStore.delete('pb_auth');
        const response = NextResponse.json({ user: null });
        return addCorsHeaders(response, request);
      }
    }
    
    // Set the auth token
    pb.authStore.save(authData.token, authData.model);

    // Verify the token is still valid by fetching the user
    try {
      const user = await pb.collection('users').getOne(authData.model.id);
      const response = NextResponse.json({ user });
      return addCorsHeaders(response, request);
    } catch (error) {
      // Token is invalid, clear the cookie if it was from cookie
      if (!authDataHeader) {
        const cookieStore = await cookies();
        cookieStore.delete('pb_auth');
      }
      const response = NextResponse.json({ user: null });
      return addCorsHeaders(response, request);
    }
  } catch (error) {
    const response = NextResponse.json({ user: null });
    return addCorsHeaders(response, request);
  }
}
