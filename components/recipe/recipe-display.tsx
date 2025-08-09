'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Save, Loader2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ANIMATIONS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface RecipeDisplayProps {
  ingredients: string[];
  isGenerating: boolean;
  onSaveRecipe?: (recipe: { title: string; ingredients: string[]; content: string }) => void;
}

export function RecipeDisplay({ 
  ingredients, 
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
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);

  const hasStartedTypingRef = useRef(false);
  const hasGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Format recipe content by removing numbering and creating JSX elements
  const formatRecipeContent = useCallback((content: string) => {
    if (!content) return [];

    // DEBUG: Log the raw content to understand what we're receiving
    console.log('Raw content received:', content);
    console.log('Raw content split by lines:', content.split('\n'));

    // Remove the title from the beginning since we show it separately
    const allLines = content.split('\n');
    let startIndex = 0;
    
    // Skip the first line if it's a numbered title (1. Recipe Name)
    if (allLines[0] && /^1\.\s*/.test(allLines[0].trim())) {
      startIndex = 1;
      // Also skip any empty lines after the title
      while (startIndex < allLines.length && !allLines[startIndex].trim()) {
        startIndex++;
      }
    }
    
    const lines = allLines.slice(startIndex);
    const elements: React.ReactElement[] = [];
    let currentIndex = 0;
    let inInstructionsSection = false;
    let instructionStepCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for main section headers (2. Prep Time, 3. Cook Time, etc.)
      const sectionMatch = line.match(/^(\d+)\.\s*(.+)/);
      if (sectionMatch) {
        const sectionNumber = parseInt(sectionMatch[1]);
        const sectionText = sectionMatch[2].trim();
        
        // Main sections (2-7) should be bold with proper spacing
        if (sectionNumber >= 2 && sectionNumber <= 7 && !inInstructionsSection) {
          // Check if we're entering the Instructions section
          if (sectionText.toLowerCase().includes('instructions')) {
            inInstructionsSection = true;
            instructionStepCounter = 1; // Reset counter for new instructions section
          }
          
          const isBasicInfo = sectionText.toLowerCase().includes('prep time') || 
                             sectionText.toLowerCase().includes('cook time') ||
                             sectionText.toLowerCase().includes('servings');
          const isMainSection = sectionText.toLowerCase().includes('ingredients') ||
                               sectionText.toLowerCase().includes('instructions') ||
                               sectionText.toLowerCase().includes('tips');
          
          const spacing = isBasicInfo ? 'mt-2' : isMainSection ? 'mt-4' : 'mt-3';
          
          elements.push(
            <div key={currentIndex++} className={`${spacing} mb-2`}>
              <span className="font-bold text-base">{sectionText}</span>
            </div>
          );
        } else if (inInstructionsSection) {
          // This is an instruction step within the Instructions section
          // Check if this line indicates we're leaving the instructions section
          if (sectionNumber >= 7 || sectionText.toLowerCase().includes('chef') || sectionText.toLowerCase().includes('tips')) {
            inInstructionsSection = false;
            elements.push(
              <div key={currentIndex++} className="mt-4 mb-2">
                <span className="font-bold text-base">{sectionText}</span>
              </div>
            );
          } else {
            // This is a numbered instruction step
            elements.push(
              <div key={currentIndex++} className="mb-1 text-sm">
                {sectionNumber}. {sectionText}
              </div>
            );
          }
        } else {
          // Regular numbered content outside instructions
          elements.push(
            <div key={currentIndex++} className="mb-1 text-sm">
              {line}
            </div>
          );
        }
      } else if (line.trim()) {
        // Regular content line - check if it's an unnumbered instruction step
        if (inInstructionsSection) {
          // If we're in instructions and this looks like a step, add numbering
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('•')) {
            // Check if we're leaving the instructions section
            if (trimmedLine.toLowerCase().includes('chef') || trimmedLine.toLowerCase().includes('tip')) {
              inInstructionsSection = false;
              elements.push(
                <div key={currentIndex++} className="mt-4 mb-2">
                  <span className="font-bold text-base">{trimmedLine}</span>
                </div>
              );
            } else {
              // This is an instruction step
              elements.push(
                <div key={currentIndex++} className="mb-1 text-sm">
                  {instructionStepCounter}. {trimmedLine}
                </div>
              );
              instructionStepCounter++;
            }
          } else {
            elements.push(
              <div key={currentIndex++} className="mb-1 text-sm">
                {line}
              </div>
            );
          }
        } else {
          // Regular content line (ingredients, etc.)
          elements.push(
            <div key={currentIndex++} className="mb-1 text-sm">
              {line}
            </div>
          );
        }
      } else {
        // Empty line - add spacing and potentially reset instructions flag
        elements.push(<div key={currentIndex++} className="mb-1" />);
      }
    }

    return elements;
  }, []);

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
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    
    let index = 0;
    setDisplayedContent('');
    setIsTyping(true);
    setShowCursor(true);
    hasStartedTypingRef.current = false;
    
    const type = () => {
      if (index < content.length) {
        setDisplayedContent(content.substring(0, index + 1));
        index++;
        typewriterTimeoutRef.current = setTimeout(type, ANIMATIONS.TYPING_SPEED);
      } else {
        setIsTyping(false);
        setShowCursor(false);
      }
    };
    
    type();
  }, []);

  // Start cursor blinking during typing
  useEffect(() => {
    if (isTyping || showCursor) {
      cursorIntervalRef.current = setInterval(() => {
        setShowCursor(prev => !prev);
      }, ANIMATIONS.CURSOR_BLINK_RATE);
    } else {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
        cursorIntervalRef.current = null;
      }
    }
    
    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
        cursorIntervalRef.current = null;
      }
    };
  }, [isTyping, showCursor]);

  // Generate recipe with streaming
  const generateRecipe = useCallback(async () => {
    console.log('generateRecipe called with ingredients:', ingredients);
    
    if (ingredients.length < 3) {
      console.log('Not enough ingredients, need at least 3');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isGeneratingRef.current) {
      console.log('Generation already in progress, skipping...');
      return;
    }

    console.log('Starting recipe generation...');
    isGeneratingRef.current = true;
    setIsGeneratingRecipe(true);
    setError(null);
    setDisplayedContent('');
    setFullContent('');
    setRecipeTitle('');
    setIsSaved(false);
    setShowCursor(true);

    try {
      // Create fresh abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      //console.log('Making request to /api/recipes/generate with:', { ingredients });
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
        signal: abortControllerRef.current.signal,
      });
      //console.log('Response received:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          const retryAfter = errorData.details?.retryAfter || 60;
          setError(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
          console.warn('Rate limited, retrying after:', retryAfter);
        } else if (response.status === 500) {
          setError('Server error occurred. Please try again in a moment.');
          console.error('Server error:', errorData);
        } else {
          setError(`Request failed (${response.status}). Please try again.`);
          console.error("Error response received:", errorData, response);
        }
        return;
      }

      if (!response.body) {
        // console.error('No response body received');
        throw new Error('No response body');
      }

      // console.log('Starting to read streaming response...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // console.log('Stream finished');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        // console.log('Received chunk:', chunk);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          // console.log('Processing line:', line);
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6);
              console.log('Parsing SSE data:', dataStr);
              const data = JSON.parse(dataStr);
              console.log('Parsed SSE data:', { type: data.type, hasContent: !!data.content });
              
              if (data.type === 'complete' && !hasStartedTypingRef.current) {
                console.log('Received complete event:', { contentLength: data.content?.length, hasContent: !!data.content });
                
                // Start typewriter effect with the complete content
                hasStartedTypingRef.current = true;
                
                // Extract title from content (handle multiple formats)
                if (data.content) {
                  // Try markdown header first: # Title
                  let titleMatch = data.content.match(/# (.+)/);
                  if (titleMatch) {
                    console.log('Setting recipe title (markdown):', titleMatch[1].trim());
                    setRecipeTitle(titleMatch[1].trim());
                  } else {
                    // Try numbered format: 1. Title
                    titleMatch = data.content.match(/^1\.\s*(.+?)(?:\n|$)/m);
                    if (titleMatch) {
                      console.log('Setting recipe title (numbered):', titleMatch[1].trim());
                      setRecipeTitle(titleMatch[1].trim());
                    } else {
                      // Fallback: use first line
                      const firstLine = data.content.split('\n')[0].trim();
                      if (firstLine) {
                        console.log('Setting recipe title (first line):', firstLine);
                        setRecipeTitle(firstLine);
                      }
                    }
                  }
                }
                
                // Set full content for saving/copying purposes
                console.log('Setting fullContent with length:', data.content?.length);
                setFullContent(data.content);
                
                // Start typewriter effect
                startTypewriter(data.content);
                
                console.log('Recipe generation complete, content length:', data.content.length);
              } else if (data.type === 'error') {
                console.log('Received error from stream:', data.message);
                setError(data.message);
                setShowCursor(false);
                setIsTyping(false);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError, 'Line was:', line);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Recipe generation error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        // Don't show error for intentionally aborted requests
        console.log('Request was cancelled (likely due to ingredient change)');
      } else if (error instanceof Error) {
        setError(`Network error: ${error.message}`);
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingRecipe(false);
      setShowCursor(false);
      setIsTyping(false);
    }
  }, [ingredients, startTypewriter]);

  // Reset state when ingredients change (no auto-generation)
  useEffect(() => {
    // Cancel any existing request first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset all state when ingredients change
    hasGeneratedRef.current = false;
    isGeneratingRef.current = false;
    setIsGeneratingRecipe(false);
    setDisplayedContent('');
    setFullContent('');
    setRecipeTitle('');
    setError(null);
  }, [ingredients]);

  // Save recipe to database
  const saveRecipe = async () => {
    console.log('Save recipe called:', { user: !!user, fullContent: !!fullContent, recipeTitle });
    
    if (!user) {
      setError('Please sign in to save recipes');
      return;
    }

    if (!fullContent || !recipeTitle) {
      setError('Recipe content is missing. Please generate a recipe first.');
      console.error('Missing recipe data:', { fullContent: !!fullContent, recipeTitle });
      return;
    }

    setIsSaving(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log('Making save request with:', { title: recipeTitle, ingredientsCount: ingredients.length });
      
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
      console.log('Save response:', { status: response.status, data });
      
      if (data.success) {
        setIsSaved(true);
        onSaveRecipe?.(data.data);
        console.log('Recipe saved successfully:', data.data);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        console.error('Save failed:', data);
        setError(data.error || 'Failed to save recipe');
      }
    } catch (error) {
      console.error('Save recipe error:', error);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy recipe to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent || fullContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
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
    isGeneratingRef.current = false;
    hasGeneratedRef.current = false;
    setIsGeneratingRecipe(false);
    setShowCursor(false);
    setIsTyping(false);
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
        <div className="mb-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isGenerating && !error && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </Badge>
              )}
            </div>
            
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
                    {isSaved ? 'Saved to My Recipes!' : 'Save to My Recipes'}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateRecipe}
                  disabled={isGenerating || isGeneratingRecipe}
                >
                  {isGeneratingRecipe ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-1" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate
                    </>
                  )}
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
          
          {/* Recipe Title */}
          {recipeTitle && (
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold mb-2"
            >
              {recipeTitle}
            </motion.h2>
          )}
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
              <Button 
                onClick={generateRecipe} 
                size="lg"
                disabled={isGeneratingRecipe}
              >
                {isGeneratingRecipe ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating Recipe...
                  </>
                ) : (
                  'Generate Recipe'
                )}
              </Button>
            </div>
          )}

          {hasContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm leading-relaxed"
            >
              <div className="font-sans font-normal">
                {formatRecipeContent(displayedContent)}
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
              </div>
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