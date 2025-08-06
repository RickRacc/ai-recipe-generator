'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Eye, Calendar, Clock, ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo, truncate, capitalizeWords } from '@/lib/utils';
import { ANIMATIONS } from '@/lib/constants';

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
      console.error('Failed to fetch recipes:', error);
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
      console.error('Failed to delete recipe:', error);
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

  // Initial load and when sort changes
  useEffect(() => {
    fetchRecipes();
  }, [sortBy, sortOrder, fetchRecipes]);

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
                onSelect={() => onRecipeSelect?.(recipe)}
                onDelete={() => deleteRecipe(recipe.id)}
                isDeleting={deletingIds.has(recipe.id)}
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
    </div>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function RecipeCard({ recipe, onSelect, onDelete, isDeleting }: RecipeCardProps) {
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
          {truncate(recipe.recipe_content.replace(/[#*\n]/g, ' '), 100)}
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