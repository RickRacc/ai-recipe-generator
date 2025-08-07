import { NextRequest } from 'next/server';
import { z } from 'zod';
import { findClosestIngredient, ingredientSchema } from '@/lib/validation';
import { consumeValidationRateLimit, getClientIP } from '@/lib/rate-limit';
import { getUserFromRequest, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { COMMON_INGREDIENTS } from '@/lib/constants';

const validateRequestSchema = z.object({
  ingredient: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/ingredients/validate - Request received');
    
    // Rate limiting
    const { user } = await getUserFromRequest(request);
    const clientIP = getClientIP(request);
    const identifier = user?.id || clientIP;
    console.log('Validation request from:', identifier);

    const rateLimitResult = await consumeValidationRateLimit(identifier);
    console.log('Rate limit result:', rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      console.log('Rate limit exceeded for validation');
      return createErrorResponse(
        'Too many validation requests. Please slow down.',
        429,
        {
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
        }
      );
    }

    // Parse and validate request
    const body = await request.json();
    console.log('Validation request body:', body);
    
    const validation = validateRequestSchema.safeParse(body);

    if (!validation.success) {
      console.log('Request validation failed:', validation.error);
      return createErrorResponse(
        'Invalid request data',
        400,
        { errors: validation.error.issues.map(issue => issue.message) }
      );
    }

    const { ingredient } = validation.data;
    console.log('Validating ingredient:', ingredient);

    // Validate ingredient using our validation logic
    const ingredientValidation = ingredientSchema.safeParse(ingredient);
    const smartValidation = findClosestIngredient(ingredient);
    
    console.log('Ingredient schema validation:', ingredientValidation.success, ingredientValidation.error?.issues);
    console.log('Smart validation result:', smartValidation);

    const result = {
      ingredient,
      isValid: ingredientValidation.success && smartValidation.isValid,
      errors: ingredientValidation.success ? [] : ingredientValidation.error.issues.map(issue => issue.message),
      suggestion: smartValidation.suggestion,
      confidence: smartValidation.confidence,
      category: smartValidation.category,
      alternatives: getAlternatives(ingredient),
    };
    
    console.log('Final validation result:', result);
    return createSuccessResponse(result);

  } catch (error) {
    console.error('Ingredient validation error:', error);
    return createErrorResponse(
      'Internal server error. Please try again later.',
      500
    );
  }
}

// GET autocomplete suggestions
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/ingredients/validate - Autocomplete request received');
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    console.log('Autocomplete query:', query);
    
    if (query.length < 2) {
      console.log('Query too short, returning empty results');
      return createSuccessResponse([]);
    }

    // Rate limiting for autocomplete
    const { user } = await getUserFromRequest(request);
    const clientIP = getClientIP(request);
    const identifier = user?.id || clientIP;
    console.log('Autocomplete request from:', identifier);

    const rateLimitResult = await consumeValidationRateLimit(identifier);
    console.log('Autocomplete rate limit result:', rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      console.log('Rate limit exceeded for autocomplete');
      return createErrorResponse(
        'Too many requests. Please slow down.',
        429,
        {
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
        }
      );
    }

    // Find matching ingredients
    const suggestions = COMMON_INGREDIENTS
      .filter(ingredient => 
        ingredient.toLowerCase().includes(query) ||
        query.includes(ingredient.toLowerCase())
      )
      .slice(0, 10) // Limit to 10 suggestions
      .map(ingredient => ({
        value: ingredient,
        label: capitalizeFirst(ingredient),
        category: getIngredientCategory(ingredient),
      }));

    console.log('Found suggestions:', suggestions.length, suggestions);
    return createSuccessResponse(suggestions);

  } catch (error) {
    console.error('Autocomplete error:', error);
    return createErrorResponse(
      'Internal server error. Please try again later.',
      500
    );
  }
}

// Helper functions
function getAlternatives(ingredient: string): string[] {
  const cleaned = ingredient.toLowerCase().trim();
  
  // Common ingredient substitutions
  const substitutions: Record<string, string[]> = {
    'butter': ['margarine', 'coconut oil', 'olive oil'],
    'milk': ['almond milk', 'oat milk', 'coconut milk'],
    'sugar': ['honey', 'maple syrup', 'brown sugar'],
    'flour': ['almond flour', 'coconut flour', 'whole wheat flour'],
    'eggs': ['flax eggs', 'chia eggs', 'applesauce'],
    'cream': ['coconut cream', 'cashew cream', 'heavy cream'],
    'cheese': ['nutritional yeast', 'cashew cheese', 'vegan cheese'],
  };

  return substitutions[cleaned] || [];
}

function getIngredientCategory(ingredient: string): string {
  const categories = {
    proteins: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'beans', 'lentils'],
    vegetables: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell pepper', 'broccoli', 'spinach', 'kale'],
    herbs: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'dill', 'sage', 'mint', 'chives'],
    spices: ['salt', 'pepper', 'paprika', 'cumin', 'coriander', 'turmeric', 'ginger', 'cinnamon', 'nutmeg'],
    dairy: ['milk', 'cream', 'yogurt', 'cheese', 'butter'],
    fruits: ['apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry'],
    pantry: ['olive oil', 'flour', 'sugar', 'rice', 'pasta', 'vinegar', 'soy sauce'],
  };

  for (const [category, items] of Object.entries(categories)) {
    if (items.includes(ingredient.toLowerCase())) {
      return category;
    }
  }

  return 'other';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}