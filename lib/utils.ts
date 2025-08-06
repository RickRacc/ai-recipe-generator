import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce function for performance optimization
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format time duration (e.g., "2 minutes ago")
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  const timeUnits = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ];

  for (const { unit, seconds } of timeUnits) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Check if user has required environment variables
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

// Ingredient categorization for styling
import { INGREDIENT_CATEGORIES, FRUITS } from './constants';

export function getIngredientCategory(ingredient: string): string {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  if (INGREDIENT_CATEGORIES.PROTEIN.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'protein';
  }
  if (INGREDIENT_CATEGORIES.HERB.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'herb';
  }
  if (INGREDIENT_CATEGORIES.SPICE.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'spice';
  }
  if (INGREDIENT_CATEGORIES.GRAIN.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'grain';
  }
  if (INGREDIENT_CATEGORIES.DAIRY.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'dairy';
  }
  if (FRUITS.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'fruit';
  }
  if (INGREDIENT_CATEGORIES.VEGETABLE.some(item => normalizedIngredient.includes(item.toLowerCase()))) {
    return 'vegetable';
  }
  
  // Default category
  return 'vegetable';
}

// Get ingredient emoji based on category
export function getIngredientEmoji(ingredient: string): string {
  const category = getIngredientCategory(ingredient);
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  // Specific ingredient emojis
  const specificEmojis: { [key: string]: string } = {
    'chicken': '🐔',
    'beef': '🥩',
    'pork': '🐷',
    'fish': '🐟',
    'salmon': '🐟',
    'shrimp': '🦐',
    'eggs': '🥚',
    'tofu': '🔲',
    'onion': '🧅',
    'garlic': '🧄',
    'tomato': '🍅',
    'potato': '🥔',
    'carrot': '🥕',
    'pepper': '🌶️',
    'bell pepper': '🫑',
    'broccoli': '🥦',
    'spinach': '🥬',
    'mushrooms': '🍄',
    'avocado': '🥑',
    'corn': '🌽',
    'cheese': '🧀',
    'milk': '🥛',
    'butter': '🧈',
    'bread': '🍞',
    'rice': '🍚',
    'pasta': '🍝',
    'lemon': '🍋',
    'lime': '🟢',
    'olive oil': '🫒',
    'honey': '🍯',
  };
  
  // Check for specific emoji first
  for (const [key, emoji] of Object.entries(specificEmojis)) {
    if (normalizedIngredient.includes(key)) {
      return emoji;
    }
  }
  
  // Category-based emojis
  switch (category) {
    case 'protein': return '🥩';
    case 'herb': return '🌿';
    case 'spice': return '✨';
    case 'grain': return '🌾';
    case 'dairy': return '🧀';
    case 'fruit': return '🍎';
    case 'vegetable': return '🥬';
    default: return '🥄';
  }
}
