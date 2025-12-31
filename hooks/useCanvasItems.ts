'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasItem } from '@/lib/canvas-item-types';

/**
 * Hook for managing canvas items
 * Provides handlers for drag, rotate, select, delete operations
 */
export function useCanvasItems(initialItems: CanvasItem[] = []) {
  const [items, setItems] = useState<CanvasItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isInternalUpdateRef = useRef(false);
  const itemsRef = useRef<CanvasItem[]>(initialItems);
  const previousInitialItemsRef = useRef<CanvasItem[]>(initialItems);

  // Keep itemsRef in sync with items state (for use in effects)
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Sync with initialItems prop changes (when parent state updates)
  // Only sync if the change came from outside (not from internal updates)
  useEffect(() => {
    // Only sync if initialItems reference actually changed
    const initialItemsChanged = previousInitialItemsRef.current !== initialItems;
    
    if (initialItemsChanged && !isInternalUpdateRef.current) {
      // Compare by IDs using ref to avoid stale closure
      const currentIds = itemsRef.current.map(item => item.id).sort().join(',');
      const newIds = initialItems.map(item => item.id).sort().join(',');
      
      if (currentIds !== newIds) {
        console.log('🔄 useCanvasItems: Syncing with initialItems', {
          currentCount: itemsRef.current.length,
          newCount: initialItems.length
        });
        // Set flag BEFORE updating to prevent onItemsChange from firing
        isInternalUpdateRef.current = true;
        setItems(initialItems);
        // Keep flag set for a bit longer to ensure onItemsChange doesn't fire
        // The flag will be reset when the next internal update happens
      }
      previousInitialItemsRef.current = initialItems;
    }
  }, [initialItems]); // Only depend on initialItems to prevent loop

  // Get next available ID
  const getNextId = useCallback(() => {
    if (items.length === 0) return '1';
    const maxId = Math.max(...items.map((item) => parseInt(item.id) || 0));
    return String(maxId + 1);
  }, [items]);

  // Get next z-index (brings to front)
  const getNextZIndex = useCallback(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map((item) => item.zIndex)) + 1;
  }, [items]);

  // Get z-index for decorations (always behind other content)
  const getDecorationZIndex = useCallback(() => {
    // Get the minimum zIndex of non-decoration items, or 0 if none exist
    const nonDecorationItems = items.filter(item => item.type !== 'decoration');
    if (nonDecorationItems.length === 0) return 0;
    const minZIndex = Math.min(...nonDecorationItems.map(item => item.zIndex));
    // Return a zIndex that's lower than the minimum (behind everything)
    return Math.max(0, minZIndex - 1);
  }, [items]);

  // Handle drag
  const handleDrag = useCallback(
    (id: string, x: number, y: number) => {
      isInternalUpdateRef.current = true;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, x, y, updatedAt: new Date() }
            : item
        )
      );
    },
    []
  );

  // Handle rotate
  const handleRotate = useCallback(
    (id: string, rotation: number) => {
      isInternalUpdateRef.current = true;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, rotation, updatedAt: new Date() }
            : item
        )
      );
    },
    []
  );

  // Handle select (no automatic z-index change - user controls layering manually)
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      // Don't change z-index - let user control layering with move up/down buttons
    },
    []
  );

  // Handle delete
  const handleDelete = useCallback(
    (id: string) => {
      isInternalUpdateRef.current = true;
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e?: React.MouseEvent) => {
    // Only handle clicks on canvas background, not on items or UI elements
    // If event is provided, check that we clicked the actual canvas background
    if (e && e.target !== e.currentTarget) {
      return; // Clicked on something other than canvas background (item, button, etc.)
    }
    
    setSelectedId(null);
  }, []);

  // Add new item (automatically selects it)
  const addItem = useCallback(
    (item: Omit<CanvasItem, 'id' | 'zIndex' | 'createdAt' | 'updatedAt'>) => {
      // Decorations always go behind other content
      const zIndex = item.type === 'decoration' 
        ? getDecorationZIndex() 
        : getNextZIndex();
      
      const newItem: CanvasItem = {
        ...item,
        id: getNextId(),
        zIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('🎯 useCanvasItems.addItem called', {
        newItemId: newItem.id,
        itemType: newItem.type,
        currentItemCount: items.length,
        timestamp: new Date().toISOString()
      });
      
      isInternalUpdateRef.current = true;
      setItems((prev) => {
        const newItems = [...prev, newItem];
        console.log('🎯 setItems in addItem', {
          prevCount: prev.length,
          newCount: newItems.length,
          newItemId: newItem.id,
          allIds: newItems.map(i => i.id),
          timestamp: new Date().toISOString()
        });
        return newItems;
      });
      // Automatically select the newly added item
      setSelectedId(newItem.id);
      return newItem.id;
    },
    [getNextId, getNextZIndex, getDecorationZIndex, items.length]
  );

  // Update item
  const updateItem = useCallback(
    (id: string, updates: Partial<CanvasItem>) => {
      isInternalUpdateRef.current = true;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date() }
            : item
        )
      );
    },
    []
  );

  // Handle resize (with center-based animation)
  const handleResize = useCallback(
    (id: string, width: number, height: number) => {
      isInternalUpdateRef.current = true;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            // Calculate current center point
            const centerX = item.x + item.width / 2;
            const centerY = item.y + item.height / 2;
            
            // Recalculate position to keep center fixed
            const newX = centerX - width / 2;
            const newY = centerY - height / 2;
            
            return {
              ...item,
              x: newX,
              y: newY,
              width,
              height,
              updatedAt: new Date(),
            };
          }
          return item;
        })
      );
    },
    []
  );

  // Check if two items overlap (bounding box intersection)
  const itemsOverlap = useCallback((item1: CanvasItem, item2: CanvasItem): boolean => {
    // Simple bounding box overlap check
    const item1Right = item1.x + item1.width;
    const item1Bottom = item1.y + item1.height;
    const item2Right = item2.x + item2.width;
    const item2Bottom = item2.y + item2.height;

    return !(
      item1Right < item2.x ||
      item1.x > item2Right ||
      item1Bottom < item2.y ||
      item1.y > item2Bottom
    );
  }, []);

  // Handle move up (bring forward relative to overlapping items)
  const handleMoveUp = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;

        if (item.type === 'decoration') {
          // For decorations: find overlapping decorations that are above
          const overlappingDecorations = prev
            .filter((i) => i.type === 'decoration' && i.id !== id && itemsOverlap(item, i))
            .filter((i) => i.zIndex > item.zIndex)
            .sort((a, b) => a.zIndex - b.zIndex); // Sort ascending to find the lowest one above

          if (overlappingDecorations.length === 0) {
            // No overlapping decorations above, bring to top of decoration stack
            const allDecorations = prev
              .filter((i) => i.type === 'decoration')
              .sort((a, b) => a.zIndex - b.zIndex);
            const maxZIndex = allDecorations.length > 0 
              ? Math.max(...allDecorations.map((i) => i.zIndex))
              : item.zIndex;
            // If already at top, do nothing
            if (item.zIndex >= maxZIndex) {
              return prev;
            }
            // Move to top of decoration stack
            return prev.map((i) =>
              i.id === id ? { ...i, zIndex: maxZIndex + 1, updatedAt: new Date() } : i
            );
          }

          // Move to just above the lowest overlapping decoration
          const lowestOverlapping = overlappingDecorations[0];
          return prev.map((i) =>
            i.id === id ? { ...i, zIndex: lowestOverlapping.zIndex + 1, updatedAt: new Date() } : i
          );
        } else {
          // For non-decorations: find overlapping items that are above
          const overlappingItems = prev
            .filter((i) => i.type !== 'decoration' && i.id !== id && itemsOverlap(item, i))
            .filter((i) => i.zIndex > item.zIndex)
            .sort((a, b) => a.zIndex - b.zIndex); // Sort ascending to find the lowest one above

          if (overlappingItems.length === 0) {
            // No overlapping items above, bring to top of non-decoration stack
            const allNonDecorations = prev
              .filter((i) => i.type !== 'decoration');
            const maxZIndex = allNonDecorations.length > 0
              ? Math.max(...allNonDecorations.map((i) => i.zIndex))
              : item.zIndex;
            // If already at top, do nothing
            if (item.zIndex >= maxZIndex) {
              return prev;
            }
            // Move to top of non-decoration stack
            return prev.map((i) =>
              i.id === id ? { ...i, zIndex: maxZIndex + 1, updatedAt: new Date() } : i
            );
          }

          // Move to just above the lowest overlapping item
          const lowestOverlapping = overlappingItems[0];
          return prev.map((i) =>
            i.id === id ? { ...i, zIndex: lowestOverlapping.zIndex + 1, updatedAt: new Date() } : i
          );
        }
      });
    },
    [itemsOverlap]
  );

  // Handle move down (send backward relative to overlapping items)
  const handleMoveDown = useCallback(
    (id: string) => {
      isInternalUpdateRef.current = true;
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;

        if (item.type === 'decoration') {
          // For decorations: find overlapping decorations that are below
          const overlappingDecorations = prev
            .filter((i) => i.type === 'decoration' && i.id !== id && itemsOverlap(item, i))
            .filter((i) => i.zIndex < item.zIndex)
            .sort((a, b) => b.zIndex - a.zIndex); // Sort descending to find the highest one below

          if (overlappingDecorations.length === 0) {
            // No overlapping decorations below, send to bottom of decoration stack
            const allDecorations = prev
              .filter((i) => i.type === 'decoration')
              .sort((a, b) => a.zIndex - b.zIndex);
            const minZIndex = allDecorations.length > 0
              ? Math.min(...allDecorations.map((i) => i.zIndex))
              : item.zIndex;
            // If already at bottom, do nothing
            if (item.zIndex <= minZIndex) {
              return prev;
            }
            // Move to bottom of decoration stack
            return prev.map((i) =>
              i.id === id ? { ...i, zIndex: Math.max(0, minZIndex - 1), updatedAt: new Date() } : i
            );
          }

          // Move to just below the highest overlapping decoration
          const highestOverlapping = overlappingDecorations[0];
          return prev.map((i) =>
            i.id === id ? { ...i, zIndex: Math.max(0, highestOverlapping.zIndex - 1), updatedAt: new Date() } : i
          );
        } else {
          // For non-decorations: find overlapping items that are below
          const overlappingItems = prev
            .filter((i) => i.type !== 'decoration' && i.id !== id && itemsOverlap(item, i))
            .filter((i) => i.zIndex < item.zIndex)
            .sort((a, b) => b.zIndex - a.zIndex); // Sort descending to find the highest one below

          if (overlappingItems.length === 0) {
            // No overlapping items below, send to bottom of non-decoration stack
            const allNonDecorations = prev
              .filter((i) => i.type !== 'decoration');
            const minZIndex = allNonDecorations.length > 0
              ? Math.min(...allNonDecorations.map((i) => i.zIndex))
              : item.zIndex;
            // If already at bottom, do nothing
            if (item.zIndex <= minZIndex) {
              return prev;
            }
            // Move to bottom of non-decoration stack (but stay above decorations)
            const decorationMaxZIndex = prev
              .filter((i) => i.type === 'decoration')
              .length > 0
              ? Math.max(...prev.filter((i) => i.type === 'decoration').map((i) => i.zIndex))
              : 0;
            const targetZIndex = Math.max(decorationMaxZIndex + 1, minZIndex - 1);
            return prev.map((i) =>
              i.id === id ? { ...i, zIndex: targetZIndex, updatedAt: new Date() } : i
            );
          }

          // Move to just below the highest overlapping item
          const highestOverlapping = overlappingItems[0];
          return prev.map((i) =>
            i.id === id ? { ...i, zIndex: highestOverlapping.zIndex - 1, updatedAt: new Date() } : i
          );
        }
      });
    },
    [itemsOverlap]
  );

  // Get selected item
  const selectedItem = items.find((item) => item.id === selectedId) || null;

  return {
    items,
    selectedId,
    selectedItem,
    setItems,
    handleDrag,
    handleRotate,
    handleSelect,
    handleDelete,
    handleCanvasClick,
    addItem,
    updateItem,
    handleResize,
    handleMoveUp,
    handleMoveDown,
  };
}

