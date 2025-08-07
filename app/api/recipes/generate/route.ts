import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { recipeGenerationSchema, formatValidationError } from '@/lib/validation';
import { consumeRateLimit, getClientIP } from '@/lib/rate-limit';
import { getUserFromRequest, createErrorResponse, validateEnvVars } from '@/lib/auth-helpers';
import { ANTHROPIC_CONFIG } from '@/lib/constants';

// Configure for Edge Runtime for optimal streaming
export const runtime = 'edge';

// Validate environment variables on module load
try {
  validateEnvVars();
} catch (error) {
  // console.error('Environment validation failed:', error);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // console.log('POST /api/recipes/generate - Request received');
    
    // Get user info for rate limiting
    const { user } = await getUserFromRequest(request);
    const clientIP = getClientIP(request);
    const identifier = user?.id || clientIP;
    // console.log('Recipe generation request from:', identifier, user ? 'authenticated' : 'guest');

    // Check rate limits
    const rateLimitResult = await consumeRateLimit(identifier, !!user);
    // console.log('Rate limit result:', rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      // console.log('Rate limit exceeded for recipe generation');
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429,
        {
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    // console.log('Recipe generation request body:', body);
    
    const validation = recipeGenerationSchema.safeParse({
      ...body,
      userId: user?.id,
    });
    // console.log('Validation result:', validation.success, validation.error?.issues);

    if (!validation.success) {
      // console.log('Recipe generation validation failed:', formatValidationError(validation.error));
      return createErrorResponse(
        'Invalid request data',
        400,
        { 
          errors: formatValidationError(validation.error),
          rateLimitInfo: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          }
        }
      );
    }

    const { ingredients } = validation.data;
    // console.log('Valid ingredients:', ingredients);

    // Create the prompt for Claude
    const prompt = `Create a delicious recipe using these ingredients: ${ingredients.join(', ')}.

Please format the recipe clearly with sections for ingredients (with measurements), instructions, prep time, cook time, and servings. Make the recipe practical and achievable for home cooks.`;
    // console.log('Generated prompt:', prompt);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // console.log('Starting Anthropic stream with config:', ANTHROPIC_CONFIG);
          const stream = anthropic.messages.stream({
            model: ANTHROPIC_CONFIG.MODEL,
            max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
            temperature: ANTHROPIC_CONFIG.TEMPERATURE,
            system: ANTHROPIC_CONFIG.SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });
          // console.log('Anthropic stream created successfully');

          let fullResponse = '';

          stream.on('text', (text) => {
            fullResponse += text;
            
            // Send each chunk as Server-Sent Event
            const data = JSON.stringify({
              type: 'chunk',
              content: text,
              timestamp: new Date().toISOString(),
            });
            
            controller.enqueue(`data: ${data}\n\n`);
          });

          stream.on('end', () => {
            // Send final complete message
            const finalData = JSON.stringify({
              type: 'complete',
              content: fullResponse,
              ingredients,
              userId: user?.id,
              timestamp: new Date().toISOString(),
            });
            
            controller.enqueue(`data: ${finalData}\n\n`);
            controller.close();
          });

          stream.on('error', (error) => {
            // console.error('Streaming error:', error);
            
            const errorData = JSON.stringify({
              type: 'error',
              message: 'Failed to generate recipe. Please try again.',
              timestamp: new Date().toISOString(),
            });
            
            controller.enqueue(`data: ${errorData}\n\n`);
            controller.close();
          });

        } catch (error) {
          // console.error('Recipe generation error:', error);
          
          const errorData = JSON.stringify({
            type: 'error',
            message: 'Failed to connect to AI service. Please try again.',
            timestamp: new Date().toISOString(),
          });
          
          controller.enqueue(`data: ${errorData}\n\n`);
          controller.close();
        }
      },
    });

    // Return streaming response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Add rate limit headers
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
      },
    });

  } catch (error) {
    // console.error('API error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}