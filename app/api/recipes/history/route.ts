import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recipeHistorySchema } from '@/lib/validation';
import { getUserFromRequest, createErrorResponse, createSuccessResponse, validateEnvVars } from '@/lib/auth-helpers';
import type { Database } from '@/types/supabase';

// Validate environment variables
try {
  validateEnvVars();
} catch (error) {
  // console.error('Environment validation failed:', error);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await getUserFromRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    const validation = recipeHistorySchema.safeParse(queryParams);
    
    if (!validation.success) {
      return createErrorResponse(
        'Invalid query parameters',
        400,
        { errors: validation.error.issues.map(issue => issue.message) }
      );
    }

    const { page, limit, search, sortBy, sortOrder } = validation.data;
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Add search filter if provided
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      query = query.or(`title.ilike.%${searchTerm}%,ingredients.cs.{${searchTerm}}`);
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: recipes, error, count } = await query;

    if (error) {
      // console.error('Database error:', error);
      return createErrorResponse(
        'Failed to fetch recipes',
        500,
        { dbError: error.message }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return createSuccessResponse({
      recipes: recipes || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      search: search || null,
      sortBy,
      sortOrder,
    });

  } catch (error) {
    // console.error('Recipe history error:', error);
    return createErrorResponse(
      'Internal server error. Please try again later.',
      500
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}