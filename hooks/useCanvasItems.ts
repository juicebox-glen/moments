'use client';

import { useState, useCallback, useRef } from 'react';
import { CanvasItem } from '@/lib/canvas-item-types';

/**
 * Hook for managing canvas items
 * Provides handlers for drag, rotate, select, delete operations
 */
export function useCanvasItems(initialItems: CanvasItem[] = []) {
  const [items, setItems] = useState<CanvasItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // Handle select (brings to front)
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      // Bring to front by updating z-index
      const newZIndex = getNextZIndex();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, zIndex: newZIndex } : item
        )
      );
    },
    [getNextZIndex]
  );

  // Handle delete
  const handleDelete = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
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
      setItems((prev) => [...prev, newItem]);
      // Automatically select the newly added item
      setSelectedId(newItem.id);
      return newItem.id;
    },
    [getNextId, getNextZIndex, getDecorationZIndex]
  );

  // Update item
  const updateItem = useCallback(
    (id: string, updates: Partial<CanvasItem>) => {
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

  // Handle move up (bring forward in z-index)
  const handleMoveUp = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;

        if (item.type === 'decoration') {
          // For decorations: only swap with other decorations
          const decorations = prev
            .filter((i) => i.type === 'decoration')
            .sort((a, b) => a.zIndex - b.zIndex);

          const currentIndex = decorations.findIndex((i) => i.id === id);
          if (currentIndex === -1 || currentIndex === decorations.length - 1) {
            // Already at top of decorations or not found
            return prev;
          }

          const itemAbove = decorations[currentIndex + 1];
          
          // Swap z-index values
          return prev.map((i) => {
            if (i.id === id) {
              return { ...i, zIndex: itemAbove.zIndex, updatedAt: new Date() };
            }
            if (i.id === itemAbove.id) {
              return { ...i, zIndex: item.zIndex, updatedAt: new Date() };
            }
            return i;
          });
        } else {
          // For non-decorations: swap with other non-decorations
          const nonDecorations = prev
            .filter((i) => i.type !== 'decoration')
            .sort((a, b) => a.zIndex - b.zIndex);

          const currentIndex = nonDecorations.findIndex((i) => i.id === id);
          if (currentIndex === -1 || currentIndex === nonDecorations.length - 1) {
            // Already at top or not found
            return prev;
          }

          const itemAbove = nonDecorations[currentIndex + 1];
          
          // Swap z-index values
          return prev.map((i) => {
            if (i.id === id) {
              return { ...i, zIndex: itemAbove.zIndex, updatedAt: new Date() };
            }
            if (i.id === itemAbove.id) {
              return { ...i, zIndex: item.zIndex, updatedAt: new Date() };
            }
            return i;
          });
        }
      });
    },
    []
  );

  // Handle move down (send backward in z-index)
  const handleMoveDown = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;

        if (item.type === 'decoration') {
          // For decorations: only swap with other decorations
          const decorations = prev
            .filter((i) => i.type === 'decoration')
            .sort((a, b) => a.zIndex - b.zIndex);

          const currentIndex = decorations.findIndex((i) => i.id === id);
          if (currentIndex === -1 || currentIndex === 0) {
            // Already at bottom of decorations or not found
            return prev;
          }

          const itemBelow = decorations[currentIndex - 1];
          
          // Swap z-index values
          return prev.map((i) => {
            if (i.id === id) {
              return { ...i, zIndex: itemBelow.zIndex, updatedAt: new Date() };
            }
            if (i.id === itemBelow.id) {
              return { ...i, zIndex: item.zIndex, updatedAt: new Date() };
            }
            return i;
          });
        } else {
          // For non-decorations: swap with other non-decorations
          const nonDecorations = prev
            .filter((i) => i.type !== 'decoration')
            .sort((a, b) => a.zIndex - b.zIndex);

          const currentIndex = nonDecorations.findIndex((i) => i.id === id);
          if (currentIndex === -1 || currentIndex === 0) {
            // Already at bottom or not found
            return prev;
          }

          const itemBelow = nonDecorations[currentIndex - 1];
          
          // Swap z-index values
          return prev.map((i) => {
            if (i.id === id) {
              return { ...i, zIndex: itemBelow.zIndex, updatedAt: new Date() };
            }
            if (i.id === itemBelow.id) {
              return { ...i, zIndex: item.zIndex, updatedAt: new Date() };
            }
            return i;
          });
        }
      });
    },
    []
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

