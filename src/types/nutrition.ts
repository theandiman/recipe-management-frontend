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

export interface Ingredient {
  quantity: string;
  unit: string;
  item: string;
}

export interface Recipe {
  recipeName: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings: string | number;
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
  tips?: RecipeTips;
  source?: 'ai-generated' | 'manual';
}

