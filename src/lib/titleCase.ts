/**
 * Converts a product title to Title Case (first letter of each word capitalized).
 * Removes the "| Korasutra" suffix if present.
 */
export function toTitleCase(str: string): string {
  // Remove "| Korasutra" or "| KoraSutra" suffix
  const cleaned = str.replace(/\s*\|\s*[Kk]ora\s*[Ss]utra\s*$/i, '').trim();
  
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      // Keep small words lowercase unless first word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
