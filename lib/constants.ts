// API Configuration
export const ANTHROPIC_CONFIG = {
  MODEL: "claude-3-haiku-20240307",
  MAX_TOKENS: 1500,
  TEMPERATURE: 0.7,
  SYSTEM_PROMPT: `You are a helpful chef assistant. Create detailed, practical recipes using only the provided ingredients. Include cooking instructions, prep time, and serving suggestions. Format the response in a clear, easy-to-follow structure with sections for:

1. Recipe Title
2. Prep Time & Cook Time
3. Servings
4. Ingredients List (with measurements)
5. Instructions (numbered steps)
6. Chef's Tips (optional)

Keep recipes realistic and achievable for home cooks. Use proper cooking techniques and food safety practices.`
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  GUEST_REQUESTS_PER_HOUR: parseInt(process.env.MAX_REQUESTS_PER_HOUR_GUEST || '5'),
  USER_REQUESTS_PER_HOUR: parseInt(process.env.MAX_REQUESTS_PER_HOUR_USER || '20'),
  VALIDATION_REQUESTS_PER_MINUTE: 10,
} as const;

// Animation Settings
export const ANIMATIONS = {
  TYPING_SPEED: 50, // milliseconds per character
  CURSOR_BLINK_RATE: 530, // milliseconds
  FADE_DURATION: 0.3,
  SPRING_CONFIG: { type: "spring", stiffness: 100, damping: 15 },
  STAGGER_DELAY: 0.1,
} as const;

// Common Ingredients Database
export const COMMON_INGREDIENTS = [
  // Proteins
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'beans', 'lentils',
  
  // Vegetables
  'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell pepper', 'broccoli', 'spinach', 'kale',
  'mushrooms', 'zucchini', 'eggplant', 'cucumber', 'lettuce', 'cabbage', 'corn', 'peas', 'green beans',
  'asparagus', 'brussels sprouts', 'cauliflower', 'sweet potato', 'avocado', 'radish', 'beets',
  
  // Herbs & Spices
  'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'dill', 'sage', 'mint', 'chives',
  'salt', 'black pepper', 'paprika', 'cumin', 'coriander', 'turmeric', 'ginger', 'cinnamon', 'nutmeg',
  'cardamom', 'cloves', 'bay leaves', 'red pepper flakes', 'garlic powder', 'onion powder',
  
  // Pantry Staples
  'olive oil', 'vegetable oil', 'butter', 'flour', 'sugar', 'brown sugar', 'honey', 'maple syrup',
  'vinegar', 'balsamic vinegar', 'soy sauce', 'worcestershire sauce', 'hot sauce', 'mustard',
  'ketchup', 'mayonnaise', 'rice', 'pasta', 'bread', 'oats', 'quinoa', 'couscous', 'barley',
  
  // Dairy
  'milk', 'cream', 'yogurt', 'cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'goat cheese',
  'cream cheese', 'sour cream', 'cottage cheese',
  
  // Fruits
  'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'raspberry', 'blackberry',
  'grapes', 'pineapple', 'mango', 'peach', 'pear', 'plum', 'cherry', 'watermelon', 'cantaloupe',
  'kiwi', 'pomegranate', 'cranberry', 'coconut',
  
  // Nuts & Seeds
  'almonds', 'walnuts', 'pecans', 'peanuts', 'cashews', 'pistachios', 'sunflower seeds', 'pumpkin seeds',
  'sesame seeds', 'chia seeds', 'flax seeds', 'pine nuts',
  
  // Canned/Processed
  'tomato sauce', 'tomato paste', 'coconut milk', 'broth', 'chicken broth', 'vegetable broth',
  'canned beans', 'canned tomatoes', 'olives', 'capers', 'pickles', 'dried cranberries', 'raisins',
] as const;

// Ingredient Categories
export const INGREDIENT_CATEGORIES = {
  PROTEINS: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'beans', 'lentils'],
  VEGETABLES: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell pepper', 'broccoli', 'spinach', 'kale'],
  HERBS_SPICES: ['basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'salt', 'pepper', 'paprika', 'cumin'],
  PANTRY: ['olive oil', 'flour', 'sugar', 'rice', 'pasta', 'vinegar', 'soy sauce'],
  DAIRY: ['milk', 'cheese', 'butter', 'yogurt', 'cream'],
  FRUITS: ['apple', 'banana', 'lemon', 'lime', 'strawberry', 'blueberry'],
} as const;

// Blacklisted items (non-food items)
export const BLACKLISTED_ITEMS = [
  'metal', 'plastic', 'glass', 'wood', 'paper', 'concrete', 'stone', 'rubber', 'fabric',
  'soap', 'detergent', 'bleach', 'ammonia', 'alcohol', 'gasoline', 'oil', 'paint',
  'medicine', 'pills', 'drugs', 'poison', 'chemicals', 'cleaning products',
] as const;

// Validation Settings
export const VALIDATION = {
  MIN_INGREDIENTS: 3,
  MAX_INGREDIENTS: 15,
  MAX_INGREDIENT_LENGTH: 50,
  DEBOUNCE_DELAY: 300, // milliseconds
} as const;

// UI Constants
export const UI = {
  MAX_RECIPE_TITLE_LENGTH: 100,
  ITEMS_PER_PAGE: 12,
  SEARCH_MIN_CHARS: 2,
} as const;