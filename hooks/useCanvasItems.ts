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
      const newItem: CanvasItem = {
        ...item,
        id: getNextId(),
        zIndex: getNextZIndex(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setItems((prev) => [...prev, newItem]);
      // Automatically select the newly added item
      setSelectedId(newItem.id);
      return newItem.id;
    },
    [getNextId, getNextZIndex]
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
  };
}

