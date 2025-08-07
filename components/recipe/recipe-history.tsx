'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Eye, Calendar, Clock, ChefHat, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo, truncate, capitalizeWords } from '@/lib/utils';
import { ANIMATIONS } from '@/lib/constants';
import React from 'react';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  recipe_content: string;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RecipeHistoryProps {
  onRecipeSelect?: (recipe: Recipe) => void;
  className?: string;
}

export function RecipeHistory({ onRecipeSelect, className = '' }: RecipeHistoryProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const router = useRouter();

  // Format recipe content for modal display
  const formatRecipeForModal = (content: string) => {
    if (!content) return [];

    // Remove the title from the beginning if it exists (since we show it in modal header)
    const allLines = content.split('\n');
    let startIndex = 0;
    
    // Check if first line is a title (either numbered or markdown)
    if (allLines[0]) {
      const firstLine = allLines[0].trim();
      const isNumberedTitle = /^1\.\s*/.test(firstLine);
      const isMarkdownTitle = /^#\s*/.test(firstLine);
      
      if (isNumberedTitle || isMarkdownTitle) {
        startIndex = 1; // Skip the first line
        // Also skip any empty lines after the title
        while (startIndex < allLines.length && !allLines[startIndex].trim()) {
          startIndex++;
        }
      }
    }
    
    // Use the content without the title
    const contentWithoutTitle = allLines.slice(startIndex).join('\n');
    const lines = contentWithoutTitle.split('\n');
    const elements: React.ReactElement[] = [];
    let currentIndex = 0;

    // Define valid section titles
    const validSectionTitles = [
      'prep time', 'cook time', 'total time', 'servings', 'serves', 'ingredients', 
      'instructions', 'directions', 'chef\'s tips', 'tips', 'notes', 'nutrition'
    ];

    // Helper function to check if a title matches a valid section
    const isValidSectionTitle = (title: string) => {
      const titleLower = title.toLowerCase().trim();
      return validSectionTitles.some(validTitle => 
        titleLower === validTitle || 
        titleLower.includes(validTitle) || 
        validTitle.includes(titleLower)
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line starts with a number (potential section title)
      const numberMatch = line.match(/^(\d+)\.\s*(.+)/);
      if (numberMatch) {
        const titleText = numberMatch[2].replace(/:$/, '');
        
        // Only treat as section title if it matches our known sections
        if (isValidSectionTitle(titleText)) {
          elements.push(
            <div key={currentIndex++} className="font-semibold text-base mt-4 mb-2">
              {titleText}
            </div>
          );
        } else {
          // This is likely an instruction step - treat as regular content
          elements.push(
            <div key={currentIndex++} className="mb-1 text-sm">
              {line}
            </div>
          );
        }
      } else if (line.trim()) {
        // Regular content line
        elements.push(
          <div key={currentIndex++} className="mb-1 text-sm">
            {line}
          </div>
        );
      } else {
        // Empty line - add some spacing
        elements.push(<div key={currentIndex++} className="mb-2" />);
      }
    }

    return elements;
  };

  // Format recipe content for preview card
  const formatRecipePreview = (content: string) => {
    if (!content) return '';

    // Remove the title from the beginning if it exists
    let formatted = content;
    const allLines = formatted.split('\n');
    let startIndex = 0;
    
    // Check if first line is a title (either numbered or markdown)
    if (allLines[0]) {
      const firstLine = allLines[0].trim();
      const isNumberedTitle = /^1\.\s*/.test(firstLine);
      const isMarkdownTitle = /^#\s*/.test(firstLine);
      
      if (isNumberedTitle || isMarkdownTitle) {
        startIndex = 1; // Skip the first line
        // Also skip any empty lines after the title
        while (startIndex < allLines.length && !allLines[startIndex].trim()) {
          startIndex++;
        }
      }
    }
    
    // Use content without the title
    formatted = allLines.slice(startIndex).join('\n');

    // Remove numbering from all lines (2. Prep Time, 3. Instructions, etc.)
    formatted = formatted.replace(/^\d+\.\s*/gm, '');
    
    // Remove markdown characters
    formatted = formatted.replace(/[#*]/g, '');
    
    // Clean up multiple spaces and newlines
    formatted = formatted.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    return formatted;
  };

  // Fetch recipes from API
  const fetchRecipes = useCallback(async (page = 1, search = searchQuery) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder,
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/recipes/history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recipes');
      }

      if (data.success) {
        setRecipes(data.data.recipes);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch recipes');
      }
    } catch (error: unknown) {
      // console.error('Failed to fetch recipes:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recipes');
      setRecipes([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder]);

  // Delete recipe
  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    setDeletingIds(prev => new Set([...prev, recipeId]));

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete recipe');
      }

      if (data.success) {
        setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
        
        // Update pagination count
        if (pagination) {
          setPagination(prev => prev ? {
            ...prev,
            totalCount: prev.totalCount - 1,
          } : null);
        }
      }
    } catch (error: unknown) {
      // console.error('Failed to delete recipe:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete recipe');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipeId);
        return newSet;
      });
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchRecipes(1, query);
  };

  // Handle sorting
  const handleSort = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchRecipes(page);
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  // Initial load and when sort changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecipes();
    }
  }, [sortBy, sortOrder, fetchRecipes, isAuthenticated]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recipe History</h2>
          <p className="text-muted-foreground">
            {pagination ? `${pagination.totalCount} recipes saved` : 'Your saved recipes'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('created_at', sortOrder)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Date
            </Button>
            
            <Button
              variant={sortBy === 'title' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('title', sortOrder)}
            >
              <ChefHat className="h-4 w-4 mr-1" />
              Title
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Filter className="h-4 w-4 mr-1" />
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
          >
            <p className="text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recipes.length === 0 && !error && (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No recipes found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Generate your first recipe to get started'}
          </p>
        </div>
      )}

      {/* Recipe Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                ...ANIMATIONS.SPRING_CONFIG,
                delay: index * 0.05,
              }}
            >
              <RecipeCard
                recipe={recipe}
                onSelect={() => {
                  setSelectedRecipe(recipe);
                  onRecipeSelect?.(recipe);
                }}
                onDelete={() => deleteRecipe(recipe.id)}
                isDeleting={deletingIds.has(recipe.id)}
                formatPreview={formatRecipePreview}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}

      {/* Recipe View Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {capitalizeWords(selectedRecipe.title)}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecipe(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Ingredients */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <Badge key={ingredient} variant="secondary">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Recipe Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Recipe</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    {formatRecipeForModal(selectedRecipe.recipe_content)}
                  </div>
                </div>

                {/* Recipe Info */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Created {formatTimeAgo(selectedRecipe.created_at)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  formatPreview: (content: string) => string;
}

function RecipeCard({ recipe, onSelect, onDelete, isDeleting, formatPreview }: RecipeCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 
            className="font-medium line-clamp-2 group-hover:text-primary transition-colors"
            onClick={onSelect}
          >
            {capitalizeWords(recipe.title)}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(recipe.created_at)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Ingredients:</p>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 4).map((ingredient) => (
              <Badge key={ingredient} variant="secondary" className="text-xs">
                {ingredient}
              </Badge>
            ))}
            {recipe.ingredients.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.ingredients.length - 4}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {truncate(formatPreview(recipe.recipe_content), 100)}
        </p>

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onSelect} className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            disabled={isDeleting}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}