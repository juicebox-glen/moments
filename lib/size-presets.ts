/**
 * Size presets for canvas items
 * Used for consistent sizing of photos, emojis, stickers, and decorations
 */

import { CanvasItem } from './canvas-item-types';

export const SIZE_PRESETS = {
  S: { width: 200, height: 200 },
  M: { width: 300, height: 300 },
  L: { width: 400, height: 400 },
};

/**
 * Get the active size preset for an item based on its current size
 * @param item The canvas item to check
 * @returns The active preset ('S', 'M', 'L') or null if item cannot be resized
 */
export function getActivePreset(item: CanvasItem): 'S' | 'M' | 'L' | null {
  // Songs and GIFs cannot be resized
  if (item.type === 'song' || item.type === 'gif') return null;
  
  const currentSize = 
    item.type === 'photo' 
      ? item.width 
      : Math.max(item.width, item.height);
  
  if (currentSize <= 250) return 'S';
  if (currentSize <= 350) return 'M';
  return 'L';
}

