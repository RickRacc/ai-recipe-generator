import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const response = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth error:', error);
      return { user: null, response };
    }
    
    return { user, response };
  } catch (error) {
    console.error('Failed to get user from request:', error);
    return { user: null, response };
  }
}

export function createAuthResponse(
  success: boolean,
  message: string,
  data?: unknown,
  status: number = 200
) {
  return NextResponse.json(
    {
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createSuccessResponse(data: unknown, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message: message || 'Operation completed successfully',
    timestamp: new Date().toISOString(),
  });
}

// Helper to validate required environment variables
export function validateEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Middleware helper for protected routes
export function requireAuth() {
  return async (request: NextRequest) => {
    const { user, response } = await getUserFromRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }
    
    return { user, response };
  };
}