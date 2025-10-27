/**
 * Utility functions for badge variants
 */

export type BadgeVariant = 'important' | 'marketing' | 'spam' | 'work' | 'social' | 'default';

/**
 * Determine badge variant based on category string
 * @param category - Email category string
 * @returns Badge variant name
 */
export function getBadgeVariant(category: string): BadgeVariant {
  const normalized = category?.toLowerCase() || '';
  
  if (normalized.includes('important') || normalized.includes('urgent')) {
    return 'important';
  }
  
  if (normalized.includes('marketing') || normalized.includes('promo')) {
    return 'marketing';
  }
  
  if (normalized.includes('spam') || normalized.includes('junk')) {
    return 'spam';
  }
  
  if (normalized.includes('work')) {
    return 'work';
  }
  
  if (normalized.includes('social')) {
    return 'social';
  }
  
  return 'default';
}

