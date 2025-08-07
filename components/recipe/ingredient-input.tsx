'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VALIDATION, ANIMATIONS, COMMON_INGREDIENTS, BLACKLISTED_ITEMS } from '@/lib/constants';
import { debounce } from '@/lib/utils';

interface IngredientSuggestion {
  value: string;
  label: string;
  category: string;
}

interface IngredientValidation {
  isValid: boolean;
  suggestion?: string;
  confidence: number;
  alternatives: string[];
  errors: string[];
}

interface IngredientInputProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  disabled?: boolean;
  maxIngredients?: number;
}

export function IngredientInput({ 
  ingredients, 
  onIngredientsChange, 
  disabled = false,
  maxIngredients = VALIDATION.MAX_INGREDIENTS 
}: IngredientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [validationResult, setValidationResult] = useState<IngredientValidation | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fallback validation functions
  const validateIngredientOffline = (ingredient: string): IngredientValidation => {
    const cleaned = ingredient.toLowerCase().trim();
    
    // Check blacklist
    const isBlacklisted = BLACKLISTED_ITEMS.some(item => cleaned.includes(item));
    if (isBlacklisted) {
      return {
        isValid: false,
        confidence: 0,
        alternatives: [],
        errors: ['This item is not a valid ingredient']
      };
    }
    
    // Check if it's a common ingredient
    const isCommon = COMMON_INGREDIENTS.includes(cleaned as typeof COMMON_INGREDIENTS[number]);
    if (isCommon) {
      return {
        isValid: true,
        confidence: 1,
        alternatives: [],
        errors: []
      };
    }
    
    // Find close matches
    const suggestions = COMMON_INGREDIENTS.filter(ing => 
      ing.includes(cleaned) || cleaned.includes(ing)
    ).slice(0, 3);
    
    return {
      isValid: cleaned.length > 0 && cleaned.length <= 50,
      confidence: suggestions.length > 0 ? 0.5 : 0.3,
      alternatives: suggestions,
      suggestion: suggestions[0],
      errors: cleaned.length === 0 ? ['Ingredient cannot be empty'] : 
              cleaned.length > 50 ? ['Ingredient name too long'] : []
    };
  };

  const getSuggestionsOffline = (query: string): IngredientSuggestion[] => {
    return COMMON_INGREDIENTS
      .filter(ingredient => 
        ingredient.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(ingredient.toLowerCase())
      )
      .slice(0, 10)
      .map(ingredient => ({
        value: ingredient,
        label: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
        category: 'ingredient'
      }));
  };

  // Debounced functions for API calls
  const debouncedFetchSuggestions = useCallback(
    (query: string) => {
      const fetchSuggestions = debounce(async (q: string) => {
        if (q.length < 2) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(`/api/ingredients/validate?q=${encodeURIComponent(q)}`);
          console.log('Suggestions API response status:', response.status);
          
          if (!response.ok) {
            console.error('Suggestions API error:', response.status, await response.text());
            return;
          }
          
          const data = await response.json();
          console.log('Suggestions API data:', data);
          
          if (data.success) {
            setSuggestions(data.data);
            setShowSuggestions(true);
            setSelectedSuggestionIndex(-1);
          } else {
            console.error('Suggestions API returned error:', data);
            // Fallback to offline suggestions
            const fallbackSuggestions = getSuggestionsOffline(q);
            setSuggestions(fallbackSuggestions);
            setShowSuggestions(fallbackSuggestions.length > 0);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          // Fallback to offline suggestions
          const fallbackSuggestions = getSuggestionsOffline(q);
          setSuggestions(fallbackSuggestions);
          setShowSuggestions(fallbackSuggestions.length > 0);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, VALIDATION.DEBOUNCE_DELAY);
      
      fetchSuggestions(query);
    },
    []
  );

  const debouncedValidateIngredient = useCallback(
    (ingredient: string) => {
      const validateIngredient = debounce(async (ing: string) => {
        if (!ing.trim()) {
          setValidationResult(null);
          return;
        }

        setIsValidating(true);
        try {
          const response = await fetch('/api/ingredients/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredient: ing }),
          });
          console.log('Validation API response status:', response.status);
          
          if (!response.ok) {
            console.error('Validation API error:', response.status, await response.text());
            return;
          }
          
          const data = await response.json();
          console.log('Validation API data:', data);
          
          if (data.success) {
            setValidationResult(data.data);
          } else {
            console.error('Validation API returned error:', data);
            // Fallback to offline validation
            setValidationResult(validateIngredientOffline(ing));
          }
        } catch (error) {
          console.error('Failed to validate ingredient:', error);
          // Fallback to offline validation
          setValidationResult(validateIngredientOffline(ing));
        } finally {
          setIsValidating(false);
        }
      }, VALIDATION.DEBOUNCE_DELAY);
      
      validateIngredient(ingredient);
    },
    []
  );

  // Handle input changes
  const handleInputChange = (value: string) => {
    setInputValue(value);
    debouncedFetchSuggestions(value);
    debouncedValidateIngredient(value);
  };

  // Add ingredient
  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    
    if (!trimmed) return;
    if (ingredients.includes(trimmed)) return;
    if (ingredients.length >= maxIngredients) return;

    // Check validation before adding
    const validation = validationResult || validateIngredientOffline(trimmed);
    if (!validation.isValid) {
      console.log('Cannot add invalid ingredient:', trimmed, validation.errors);
      return;
    }

    onIngredientsChange([...ingredients, trimmed]);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setValidationResult(null);
    inputRef.current?.focus();
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(newIngredients);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addIngredient(inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          addIngredient(suggestions[selectedSuggestionIndex].value);
        } else {
          addIngredient(inputValue);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canAddMore = ingredients.length < maxIngredients;
  const hasMinimum = ingredients.length >= VALIDATION.MIN_INGREDIENTS;

  return (
    <div className="space-y-4">
      {/* Ingredient Counter */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Ingredients ({ingredients.length}/{maxIngredients})
        </label>
        <div className="flex items-center gap-2">
          {hasMinimum && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-green-600"
            >
              <Check className="h-4 w-4" />
              <span className="text-xs">Ready to cook!</span>
            </motion.div>
          )}
          {!hasMinimum && (
            <span className="text-xs text-muted-foreground">
              Need {VALIDATION.MIN_INGREDIENTS - ingredients.length} more
            </span>
          )}
        </div>
      </div>

      {/* Input Field */}
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
            placeholder={canAddMore ? "Type an ingredient..." : "Maximum ingredients reached"}
            disabled={disabled || !canAddMore}
            className={`pr-20 ${
              validationResult?.isValid === false ? 'border-red-500' : 
              validationResult?.isValid === true ? 'border-green-500' : ''
            }`}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(isLoadingSuggestions || isValidating) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {validationResult?.isValid === true && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            
            {validationResult?.isValid === false && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addIngredient(inputValue)}
              disabled={disabled || !inputValue.trim() || !canAddMore}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.value}
                  onClick={() => addIngredient(suggestion.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.category}
                    </Badge>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Message */}
        {validationResult && !validationResult.isValid && validationResult.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-600"
          >
            {validationResult.errors[0]}
          </motion.div>
        )}

        {/* Suggestion Message */}
        {validationResult && validationResult.suggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-blue-600"
          >
            Did you mean &quot;{validationResult.suggestion}&quot;?{' '}
            <button
              onClick={() => addIngredient(validationResult.suggestion!)}
              className="underline hover:no-underline"
            >
              Use this
            </button>
          </motion.div>
        )}
      </div>

      {/* Ingredients List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {ingredients.map((ingredient, index) => (
            <motion.div
              key={ingredient}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                ...ANIMATIONS.SPRING_CONFIG,
                delay: index * ANIMATIONS.STAGGER_DELAY,
              }}
              className="flex items-center gap-2 p-2 bg-muted rounded-md"
            >
              <span className="flex-1 capitalize">{ingredient}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeIngredient(index)}
                disabled={disabled}
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Help Text */}
      {ingredients.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add at least {VALIDATION.MIN_INGREDIENTS} ingredients to generate a recipe
        </p>
      )}
    </div>
  );
}