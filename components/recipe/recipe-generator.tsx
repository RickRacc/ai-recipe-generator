'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IngredientInput } from './ingredient-input';
import { RecipeDisplay } from './recipe-display';
import { TiltCard } from '../ui/tilt-card';
import { Button } from '../ui/button';
import { RotateCcw } from 'lucide-react';
import { VALIDATION } from '@/lib/constants';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  content: string;
  created_at: string;
}

interface RecipeGeneratorProps {
  onRecipeSaved?: (recipe: Recipe) => void;
}

export function RecipeGenerator({ onRecipeSaved }: RecipeGeneratorProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const handleIngredientsChange = (newIngredients: string[]) => {
    setIngredients(newIngredients);
  };

  const handleReset = () => {
    setIngredients([]);
    setResetKey(prev => prev + 1); // Force re-render of child components
  };

  const handleSaveRecipe = (recipe: { title: string; ingredients: string[]; content: string }) => {
    // Transform the saved recipe data to match our Recipe interface
    const fullRecipe: Recipe = {
      id: 'temp-id', // Will be updated with actual ID from server
      title: recipe.title,
      ingredients: recipe.ingredients,
      content: recipe.content,
      created_at: new Date().toISOString(),
    };
    onRecipeSaved?.(fullRecipe);
  };


  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <p className="text-xl text-muted-foreground font-recipe-content leading-relaxed">
            Enter your ingredients and watch AI transform them into delicious recipes
          </p>
          <div className="flex gap-2 text-lg">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🥕</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🧅</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🍅</span>
            <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>🌿</span>
            <span className="animate-bounce" style={{ animationDelay: '0.8s' }}>🧄</span>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column - Ingredient Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <div className="kitchen-card kitchen-card-bg p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                
                <h2 className="text-2xl font-bold font-recipe-title text-foreground">Your Kitchen</h2>
              </div>
              {ingredients.length > 0 && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
              )}
            </div>
            <IngredientInput
              ingredients={ingredients}
              onIngredientsChange={handleIngredientsChange}
              maxIngredients={VALIDATION.MAX_INGREDIENTS}
            />
          </div>

          {/* Chef's Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TiltCard className="recipe-card-3d tips-card-bg p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold font-recipe-title text-foreground">Chef&apos;s Tips</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-3 font-recipe-content">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">🥩</span>
                <span>Include a protein (chicken, beef, tofu, beans)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">🧄</span>
                <span>Add aromatics (onion, garlic, ginger)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">🥬</span>
                <span>Mix different vegetables for variety</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">🌿</span>
                <span>Don&apos;t forget seasonings (salt, pepper, herbs)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">🧈</span>
                <span>Consider cooking fats (oil, butter)</span>
              </li>
            </ul>
            </TiltCard>
          </motion.div>
        </motion.div>

        {/* Right Column - Recipe Display */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📋</span>
            <h2 className="text-2xl font-bold font-recipe-title text-foreground">Your Recipe</h2>
          </div>
          <TiltCard className="recipe-card-3d recipe-display-card p-8">
            <RecipeDisplay
              key={resetKey}
              ingredients={ingredients}
              isGenerating={false}
              onSaveRecipe={handleSaveRecipe}
            />
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}