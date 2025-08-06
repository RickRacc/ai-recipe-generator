import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recipeSaveSchema, formatValidationError } from '@/lib/validation';
import { getUserFromRequest, createErrorResponse, createSuccessResponse, validateEnvVars } from '@/lib/auth-helpers';
import type { Database } from '@/types/supabase';

// Validate environment variables
try {
  validateEnvVars();
} catch (error) {
  console.error('Environment validation failed:', error);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await getUserFromRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = recipeSaveSchema.safeParse({
      ...body,
      user_id: user.id,
    });

    if (!validation.success) {
      return createErrorResponse(
        'Invalid recipe data',
        400,
        { errors: formatValidationError(validation.error) }
      );
    }

    const { title, ingredients, recipe_content, user_id } = validation.data;

    // Check if user has reached their recipe limit (optional feature)
    const { count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (count && count >= 1000) { // Reasonable limit
      return createErrorResponse(
        'Recipe limit reached. Please delete some recipes to save new ones.',
        429
      );
    }

    // Save recipe to database
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        title,
        ingredients,
        recipe_content,
        user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse(
        'Failed to save recipe. Please try again.',
        500,
        { dbError: error.message }
      );
    }

    return createSuccessResponse(recipe, 'Recipe saved successfully');

  } catch (error) {
    console.error('Save recipe error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}