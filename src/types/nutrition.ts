import type { Recipe as SharedRecipe, NutritionalInfo, RecipeTips, NutritionValues } from '@theandiman/recipe-management-shared/dist/types/recipe';

// Extend the shared Recipe type to include isPublic property
export interface Recipe extends SharedRecipe {
  isPublic?: boolean;
}

export type { NutritionalInfo, RecipeTips, NutritionValues };

// Alias for backward compatibility if needed, though better to update usage
export type NutritionalValues = NutritionValues;

export interface Ingredient {
  quantity: string;
  unit: string;
  item: string;
}
