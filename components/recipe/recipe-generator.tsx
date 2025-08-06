'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IngredientInput } from './ingredient-input';
import { RecipeDisplay } from './recipe-display';
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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleIngredientsChange = (newIngredients: string[]) => {
    setIngredients(newIngredients);
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          AI Recipe Generator
        </h1>
        <p className="text-muted-foreground">
          Enter your ingredients and let AI create delicious recipes for you
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Ingredient Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-card border rounded-lg p-6">
            <IngredientInput
              ingredients={ingredients}
              onIngredientsChange={handleIngredientsChange}
              disabled={isGenerating}
              maxIngredients={VALIDATION.MAX_INGREDIENTS}
            />
          </div>

          {/* Generation Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-muted/50 rounded-lg p-4"
          >
            <h3 className="font-medium mb-2">Tips for better recipes:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Include a protein (chicken, beef, tofu, beans)</li>
              <li>• Add aromatics (onion, garlic, ginger)</li>
              <li>• Mix different vegetables for variety</li>
              <li>• Don&apos;t forget seasonings (salt, pepper, herbs)</li>
              <li>• Consider cooking fats (oil, butter)</li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Right Column - Recipe Display */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RecipeDisplay
            ingredients={ingredients}
            onStartGeneration={handleStartGeneration}
            isGenerating={isGenerating}
            onSaveRecipe={handleSaveRecipe}
          />
        </motion.div>
      </div>
    </div>
  );
}