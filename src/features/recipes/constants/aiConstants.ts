// AI-related constants for recipe features

export const FIELD_LABELS: Record<string, string> = {
  recipeName: 'Recipe Name',
  description: 'Description',
  prepTime: 'Prep Time (min)',
  cookTime: 'Cook Time (min)',
  servings: 'Servings',
  tags: 'Tags',
  dietaryRestrictions: 'Dietary Restrictions',
  storageInstructions: 'Storage Instructions',
  makeAheadTips: 'Make-Ahead Tips',
  reheatingInstructions: 'Reheating Instructions',
  substitutions: 'Ingredient Substitutions',
  variations: 'Recipe Variations',
};

/** Maps form step numbers to the field names shown on that step. */
export const STEP_FIELDS: Record<number, string[]> = {
  1: ['recipeName', 'description'],
  4: [
    'prepTime',
    'cookTime',
    'servings',
    'tags',
    'dietaryRestrictions',
    'storageInstructions',
    'makeAheadTips',
    'reheatingInstructions',
    'substitutions',
    'variations',
  ],
};
