/**
 * Capitalizes the first letter of a string
 * @param text The string to capitalize
 * @param defaultValue The default value to return if the input is null, undefined or empty
 */
export function capitalizeFirst(text: string | null | undefined, defaultValue = 'Personalized'): string {
  if (!text) return defaultValue;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
