import type { Recipe, NutritionalInfo, RecipeTips, NutritionValues } from '@theandiman/recipe-management-shared/dist/types/recipe';

export type { Recipe, NutritionalInfo, RecipeTips, NutritionValues };

// Alias for backward compatibility if needed, though better to update usage
export type NutritionalValues = NutritionValues;

export interface Ingredient {
  quantity: string;
  unit: string;
  item: string;
}
