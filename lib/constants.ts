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
  VALIDATION_REQUESTS_PER_MINUTE: 500,
} as const;

// Animation Settings
export const ANIMATIONS = {
  TYPING_SPEED: 4, // milliseconds per character
  CURSOR_BLINK_RATE: 530, // milliseconds
  FADE_DURATION: 0.3,
  SPRING_CONFIG: { type: "spring", stiffness: 100, damping: 15 },
  STAGGER_DELAY: 0.1,
} as const;

// Ingredient Categories for Styling
export const INGREDIENT_CATEGORIES = {
  PROTEIN: [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'beans', 'lentils',
    'turkey', 'duck', 'lamb', 'bacon', 'ham', 'sausage', 'crab', 'lobster', 'scallops', 'cod', 'tilapia',
    'chickpeas', 'black beans', 'kidney beans', 'white beans', 'tempeh', 'seitan'
  ],
  
  VEGETABLE: [
    'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell pepper', 'broccoli', 'spinach', 'kale',
    'mushrooms', 'zucchini', 'eggplant', 'cucumber', 'lettuce', 'cabbage', 'corn', 'peas', 'green beans',
    'asparagus', 'brussels sprouts', 'cauliflower', 'sweet potato', 'avocado', 'radish', 'beets',
    'leek', 'shallot', 'fennel', 'artichoke', 'okra', 'turnip', 'parsnip', 'squash', 'pumpkin'
  ],
  
  HERB: [
    'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'dill', 'sage', 'mint', 'chives',
    'tarragon', 'marjoram', 'bay leaves', 'lavender', 'lemongrass', 'arugula', 'watercress'
  ],
  
  SPICE: [
    'salt', 'black pepper', 'paprika', 'cumin', 'coriander', 'turmeric', 'ginger', 'cinnamon', 'nutmeg',
    'cardamom', 'cloves', 'red pepper flakes', 'garlic powder', 'onion powder', 'cayenne', 'chili powder',
    'curry powder', 'smoked paprika', 'white pepper', 'allspice', 'fennel seeds', 'mustard seeds',
    'star anise', 'saffron', 'vanilla', 'cocoa powder'
  ],
  
  GRAIN: [
    'rice', 'pasta', 'bread', 'flour', 'quinoa', 'oats', 'barley', 'wheat', 'couscous', 'bulgur',
    'polenta', 'cornmeal', 'semolina', 'buckwheat', 'millet', 'amaranth', 'freekeh', 'farro'
  ],
  
  DAIRY: [
    'milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream', 'cottage cheese', 'ricotta',
    'mozzarella', 'cheddar', 'parmesan', 'feta', 'goat cheese', 'cream cheese', 'mascarpone',
    'heavy cream', 'half and half', 'buttermilk'
  ]
} as const;

// Fruits for autocomplete
export const FRUITS = [
  'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'raspberry', 'blackberry',
  'grapes', 'pineapple', 'mango', 'peach', 'pear', 'plum', 'cherry', 'watermelon', 'cantaloupe',
  'kiwi', 'pomegranate', 'cranberry', 'coconut',
] as const;

// Additional ingredient categories
export const NUTS_SEEDS = [
  'almonds', 'walnuts', 'pecans', 'peanuts', 'cashews', 'pistachios', 'sunflower seeds', 'pumpkin seeds',
  'sesame seeds', 'chia seeds', 'flax seeds', 'pine nuts'
] as const;

export const PANTRY_STAPLES = [
  'olive oil', 'vegetable oil', 'flour', 'sugar', 'brown sugar', 'honey', 'maple syrup',
  'vinegar', 'balsamic vinegar', 'soy sauce', 'worcestershire sauce', 'hot sauce', 'mustard',
  'ketchup', 'mayonnaise', 'broth', 'chicken broth', 'vegetable broth'
] as const;

export const CANNED_PROCESSED = [
  'tomato sauce', 'tomato paste', 'coconut milk', 'canned beans', 'canned tomatoes', 
  'olives', 'capers', 'pickles', 'dried cranberries', 'raisins'
] as const;

// Flattened list for autocomplete
export const COMMON_INGREDIENTS = [
  ...INGREDIENT_CATEGORIES.PROTEIN,
  ...INGREDIENT_CATEGORIES.VEGETABLE,
  ...INGREDIENT_CATEGORIES.HERB,
  ...INGREDIENT_CATEGORIES.SPICE,
  ...INGREDIENT_CATEGORIES.GRAIN,
  ...INGREDIENT_CATEGORIES.DAIRY,
  ...FRUITS,
  ...NUTS_SEEDS,
  ...PANTRY_STAPLES,
  ...CANNED_PROCESSED,
] as const;

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
  DEBOUNCE_DELAY: 250, // milliseconds
} as const;

// UI Constants
export const UI = {
  MAX_RECIPE_TITLE_LENGTH: 100,
  ITEMS_PER_PAGE: 12,
  SEARCH_MIN_CHARS: 2,
} as const;