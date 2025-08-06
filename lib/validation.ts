import { z } from 'zod';
import { VALIDATION, BLACKLISTED_ITEMS, COMMON_INGREDIENTS } from './constants';

// Input sanitization function
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Basic XSS protection
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase();
}

// Ingredient validation schema
export const ingredientSchema = z
  .string()
  .min(1, 'Ingredient cannot be empty')
  .max(VALIDATION.MAX_INGREDIENT_LENGTH, `Ingredient must be less than ${VALIDATION.MAX_INGREDIENT_LENGTH} characters`)
  .refine((val) => val.trim().length > 0, 'Ingredient cannot be just whitespace')
  .refine((val) => !BLACKLISTED_ITEMS.some(item => val.toLowerCase().includes(item)), 
    'This item is not a valid ingredient')
  .transform(sanitizeInput);

// Recipe generation request schema
export const recipeGenerationSchema = z.object({
  ingredients: z
    .array(ingredientSchema)
    .min(VALIDATION.MIN_INGREDIENTS, `At least ${VALIDATION.MIN_INGREDIENTS} ingredients required`)
    .max(VALIDATION.MAX_INGREDIENTS, `Maximum ${VALIDATION.MAX_INGREDIENTS} ingredients allowed`)
    .refine((ingredients) => {
      const uniqueIngredients = new Set(ingredients.map(i => i.toLowerCase()));
      return uniqueIngredients.size === ingredients.length;
    }, 'Duplicate ingredients are not allowed'),
  userId: z.string().uuid().optional(),
});

// Recipe save schema
export const recipeSaveSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .transform(input => input.trim()),
  ingredients: z
    .array(ingredientSchema)
    .min(VALIDATION.MIN_INGREDIENTS)
    .max(VALIDATION.MAX_INGREDIENTS),
  recipe_content: z
    .string()
    .min(10, 'Recipe content is too short')
    .max(5000, 'Recipe content is too long'),
  user_id: z.string().uuid(),
});

// Recipe history query schema
export const recipeHistorySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Ingredient validation result type
export type IngredientValidation = {
  isValid: boolean;
  suggestion?: string;
  category?: keyof typeof COMMON_INGREDIENTS;
  confidence: number; // 0-1 score
};

// Fuzzy matching for ingredient suggestions
export function findClosestIngredient(input: string): IngredientValidation {
  const cleanInput = sanitizeInput(input);
  
  // Check for exact match
  if (COMMON_INGREDIENTS.includes(cleanInput as any)) {
    return { isValid: true, confidence: 1.0 };
  }
  
  // Check for partial matches and calculate similarity
  let bestMatch = '';
  let bestScore = 0;
  
  for (const ingredient of COMMON_INGREDIENTS) {
    const score = calculateSimilarity(cleanInput, ingredient);
    if (score > bestScore && score > 0.6) {
      bestScore = score;
      bestMatch = ingredient;
    }
  }
  
  if (bestMatch) {
    return {
      isValid: false,
      suggestion: bestMatch,
      confidence: bestScore
    };
  }
  
  // Check against blacklist
  const isBlacklisted = BLACKLISTED_ITEMS.some(item => 
    cleanInput.includes(item) || item.includes(cleanInput)
  );
  
  if (isBlacklisted) {
    return { isValid: false, confidence: 0 };
  }
  
  // Unknown ingredient - might be valid but uncommon
  return { isValid: true, confidence: 0.3 };
}

// Simple similarity calculation (Levenshtein-inspired)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Rate limiting key generation
export function generateRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`;
}

// Validation error formatting
export function formatValidationError(error: z.ZodError): string {
  return error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
}