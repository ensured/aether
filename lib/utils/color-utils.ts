/**
 * Utility functions for concept node colors using a predefined palette
 */

// Predefined palette of 20 distinct colors for concept generations
const COLOR_PALETTE = [
  "bg-emerald-500",      // 0
  "bg-violet-500",       // 1
  "bg-blue-500",         // 2
  "bg-amber-500",        // 3
  "bg-slate-800",        // 4
  "bg-slate-500",        // 5
  "bg-pink-500",         // 6
  "bg-cyan-500",         // 7
  "bg-rose-500",         // 8
  "bg-green-600",        // 9
  "bg-gray-600",         // 10
  "bg-pink-600",         // 11
  "bg-blue-600",         // 12
  "bg-red-500",          // 13
  "bg-purple-600",       // 14
  "bg-yellow-400",       // 15
  "bg-indigo-500",       // 16
  "bg-teal-500",         // 17
  "bg-lime-500",         // 18
  "bg-green-700",        // 19
];

/**
 * Parse a Tailwind background color class into its components
 * e.g., "bg-emerald-500" -> { prefix: "bg", color: "emerald", shade: 500 }
 */
export const parseTailwindColor = (
  colorClass: string,
): { prefix: string; color: string; shade: number } | null => {
  // Match patterns like "bg-emerald-500", "bg-slate-800", "bg-red-500"
  const match = colorClass.match(/^(bg)-([a-z]+)-(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    color: match[2],
    shade: parseInt(match[3], 10),
  };
};

/**
 * Get color for a child node based on its depth in the concept tree
 * Uses a predefined palette of distinct colors for each generation
 *
 * @param _parentColor - Parent's color class (not used in palette approach)
 * @param childPath - The child's full path array
 * @returns Color class for the child from the palette
 */
export const getChildColor = (
  _parentColor: string,
  childPath: string[],
): string => {
  // Calculate depth (root nodes have path length 1, children have length 2, etc.)
  const depth = Math.max(0, childPath.length - 1);

  // Use depth to select color from palette, cycling if needed
  const colorIndex = depth % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
};

/**
 * Get the next color in the palette for a given depth
 * Useful for testing or manual color selection
 *
 * @param depth - Current depth level
 * @returns Color class from palette
 */
export const getPaletteColor = (depth: number): string => {
  const colorIndex = depth % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
};

/**
 * Get all available colors in the palette
 * Useful for debugging or UI display
 */
export const getAvailableColors = (): string[] => {
  return [...COLOR_PALETTE];
};

/**
 * Preview all colors in the palette
 * Useful for debugging/testing
 */
export const previewPaletteColors = (): string[] => {
  return [...COLOR_PALETTE];
};
