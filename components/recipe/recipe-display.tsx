'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Save, Loader2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ANIMATIONS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

interface RecipeDisplayProps {
  ingredients: string[];
  onStartGeneration: () => void;
  isGenerating: boolean;
  onSaveRecipe?: (recipe: { title: string; ingredients: string[]; content: string }) => void;
}

export function RecipeDisplay({ 
  ingredients, 
  onStartGeneration, 
  isGenerating,
  onSaveRecipe 
}: RecipeDisplayProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [recipeTitle, setRecipeTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Get user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Typewriter effect with cursor
  const startTypewriter = useCallback((content: string) => {
    let index = 0;
    setDisplayedContent('');
    setShowCursor(true);
    
    const type = () => {
      if (index < content.length) {
        setDisplayedContent(content.substring(0, index + 1));
        index++;
        typewriterTimeoutRef.current = setTimeout(type, ANIMATIONS.TYPING_SPEED);
      } else {
        setShowCursor(false);
      }
    };
    
    type();
  }, []);

  // Start cursor blinking
  useEffect(() => {
    if (showCursor) {
      cursorIntervalRef.current = setInterval(() => {
        setShowCursor(prev => !prev);
      }, ANIMATIONS.CURSOR_BLINK_RATE);
    }
    
    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isGenerating]);

  // Generate recipe with streaming
  const generateRecipe = useCallback(async () => {
    if (ingredients.length < 3) return;

    setError(null);
    setDisplayedContent('');
    setFullContent('');
    setRecipeTitle('');
    setIsSaved(false);
    setShowCursor(true);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          setError(`Rate limit exceeded. Please try again in ${errorData.details?.retryAfter || 60} seconds.`);
        } else {
          setError('Failed to generate recipe. Please try again.');
        }
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                accumulatedContent += data.content;
                setDisplayedContent(accumulatedContent);
                
                // Extract title from first heading
                if (!recipeTitle && accumulatedContent.includes('#')) {
                  const titleMatch = accumulatedContent.match(/# (.+)/);
                  if (titleMatch) {
                    setRecipeTitle(titleMatch[1].trim());
                  }
                }
              } else if (data.type === 'complete') {
                setFullContent(data.content);
                setDisplayedContent(data.content);
                setShowCursor(false);
              } else if (data.type === 'error') {
                setError(data.message);
                setShowCursor(false);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Recipe generation was cancelled.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setShowCursor(false);
    }
  }, [ingredients, recipeTitle]);

  // Auto-generate when ingredients change and minimum reached
  useEffect(() => {
    if (ingredients.length >= 3 && !isGenerating && !displayedContent) {
      generateRecipe();
    }
  }, [ingredients, isGenerating, displayedContent, generateRecipe]);

  // Save recipe to database
  const saveRecipe = async () => {
    if (!user) {
      setError('Please sign in to save recipes');
      return;
    }

    if (!fullContent || !recipeTitle) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: recipeTitle,
          ingredients,
          recipe_content: fullContent,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSaved(true);
        onSaveRecipe?.(data.data);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save recipe');
      }
    } catch (error) {
      setError('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy recipe to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullContent || displayedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  // Cancel generation
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setShowCursor(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelGeneration();
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  const hasContent = displayedContent.length > 0;
  const canSave = fullContent && user && !isSaving && !isSaved;

  return (
    <Card className="relative overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {recipeTitle && (
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-semibold"
              >
                {recipeTitle}
              </motion.h2>
            )}
            
            {isGenerating && !error && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating...
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {hasContent && !isGenerating && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>

                {user && (
                  <Button
                    size="sm"
                    onClick={saveRecipe}
                    disabled={!canSave}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : isSaved ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    {isSaved ? 'Saved!' : 'Save'}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateRecipe}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </>
            )}

            {isGenerating && (
              <Button
                size="sm"
                variant="destructive"
                onClick={cancelGeneration}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Ingredients Display */}
        {ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <p className="text-sm text-muted-foreground mb-2">Using ingredients:</p>
            <div className="flex flex-wrap gap-1">
              {ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="secondary">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipe Content */}
        <div className="relative min-h-[200px]">
          {!hasContent && !isGenerating && ingredients.length < 3 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p>Add at least 3 ingredients to generate a recipe</p>
            </div>
          )}

          {!hasContent && !isGenerating && ingredients.length >= 3 && !error && (
            <div className="flex items-center justify-center h-32">
              <Button onClick={generateRecipe} size="lg">
                Generate Recipe
              </Button>
            </div>
          )}

          {hasContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-sm max-w-none"
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {displayedContent}
                <AnimatePresence>
                  {showCursor && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"
                    />
                  )}
                </AnimatePresence>
              </pre>
            </motion.div>
          )}

          {isGenerating && !hasContent && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Creating your perfect recipe...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}