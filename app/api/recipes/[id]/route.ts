import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

// GET single recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Authenticate user
    const { user } = await getUserFromRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return createErrorResponse('Invalid recipe ID format', 400);
    }

    // Fetch recipe from database
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own recipes
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Recipe not found', 404);
      }
      // console.error('Database error:', error);
      return createErrorResponse(
        'Failed to fetch recipe',
        500,
        { dbError: error.message }
      );
    }

    return createSuccessResponse(recipe);

  } catch (error) {
    // console.error('Get recipe error:', error);
    return createErrorResponse(
      'Internal server error. Please try again later.',
      500
    );
  }
}

// DELETE recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Authenticate user
    const { user } = await getUserFromRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return createErrorResponse('Invalid recipe ID format', 400);
    }

    // Delete recipe from database
    const { data, error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own recipes
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Recipe not found', 404);
      }
      // console.error('Database error:', error);
      return createErrorResponse(
        'Failed to delete recipe',
        500,
        { dbError: error.message }
      );
    }

    return createSuccessResponse(data, 'Recipe deleted successfully');

  } catch (error) {
    // console.error('Delete recipe error:', error);
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}