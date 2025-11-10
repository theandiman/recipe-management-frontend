/**
 * Nutritional information interfaces for recipe generation
 */

export interface NutritionalValues {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export interface NutritionalInfo {
  perServing: NutritionalValues;
  total: NutritionalValues;
}

export interface RecipeTips {
  substitutions?: string[];
  makeAhead?: string;
  storage?: string;
  reheating?: string;
  variations?: string[];
}

export interface Recipe {
  recipeName: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  estimatedTime?: string;
  estimatedTimeMinutes?: number;
  servings: string | number;
  imageUrl?: string;
  imageGeneration?: {
    status: string;
    source: string;
    errorMessage?: string;
  };
  nutritionalInfo?: NutritionalInfo;
  tips?: RecipeTips;
}
