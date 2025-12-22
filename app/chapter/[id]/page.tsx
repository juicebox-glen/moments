'use client';

import { useParams } from 'next/navigation';
import { useChapterStore } from '@/stores/chapter-store';
import { useEffect, useState, useCallback, useRef } from 'react';
import CanvasTopBar from '@/components/CanvasTopBar';
import CanvasWithItems from '@/components/CanvasWithItems';
import Link from 'next/link';
import { CanvasItem } from '@/lib/canvas-item-types';

export default function ChapterPage() {
  const params = useParams();
  const id = params.id as string;
  const { chapters, getChapter, loadChapters } = useChapterStore();
  const [isLoading, setIsLoading] = useState(true);
  const chaptersLoadedRef = useRef(false);
  
  // Prevent body scroll when canvas is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load chapters from localStorage on mount
  useEffect(() => {
    if (!chaptersLoadedRef.current && typeof window !== 'undefined') {
      if (chapters.length === 0) {
        loadChapters();
      }
      chaptersLoadedRef.current = true;
    }
    setIsLoading(false);
  }, [chapters.length, loadChapters]);

  const chapter = getChapter(id);
  const addItemRef = useRef<((item: Omit<CanvasItem, 'id' | 'zIndex' | 'createdAt' | 'updatedAt'>) => string) | null>(null);
  const getViewportCenterRef = useRef<(() => { x: number; y: number }) | null>(null);
  const [items, setItems] = useState<CanvasItem[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasLoadedRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Storage key for this chapter's items
  const storageKey = `chapter-${id}-items`;

  // Helper to serialize items (convert Date objects to ISO strings)
  const serializeItems = useCallback((itemsToSerialize: CanvasItem[]): string => {
    return JSON.stringify(
      itemsToSerialize.map((item) => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
      }))
    );
  }, []);

  // Helper to deserialize items (convert ISO strings back to Date objects)
  const deserializeItems = useCallback((serialized: string): CanvasItem[] => {
    try {
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item: Omit<CanvasItem, 'createdAt' | 'updatedAt'> & { createdAt: string | Date; updatedAt: string | Date }) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      })) as CanvasItem[];
    } catch (error) {
      console.warn('Failed to deserialize items:', error);
      return [];
    }
  }, []);

  // Save items to localStorage (debounced)
  const saveItems = useCallback(
    (itemsToSave: CanvasItem[]) => {
      // Don't save during initial load
      if (isInitialLoadRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        try {
          if (typeof window !== 'undefined') {
            const serialized = serializeItems(itemsToSave);
            localStorage.setItem(storageKey, serialized);
          }
        } catch (error) {
          console.warn('Failed to save items to localStorage:', error);
        }
      }, 500);
    },
    [storageKey, serializeItems]
  );

  // Load items from localStorage on mount
  useEffect(() => {
    if (hasLoadedRef.current || !id) return;
    hasLoadedRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const loadedItems = deserializeItems(saved);
          if (Array.isArray(loadedItems)) {
            setItems(loadedItems);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load items from localStorage:', error);
      // Start with empty array on error
      setItems([]);
    } finally {
      // Mark initial load as complete after a short delay to avoid saving during load
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [id, storageKey, deserializeItems]);

  // Save items whenever they change (but not during initial load)
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      saveItems(items);
    }
  }, [items, saveItems]);

  // Color palette for rectangles - cycles through different colors
  const rectangleColors = [
    '#ff69b4', // Pink
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
  ];

  // Handle adding rectangle
  const handleAddRectangle = () => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    // Calculate viewport center in canvas coordinates
    const center = getViewportCenterRef.current();
    
    // Pick color based on current number of items (cycles through palette)
    const colorIndex = items.length % rectangleColors.length;
    const color = rectangleColors[colorIndex];
    
    // Add rectangle centered at viewport center
    // Subtract half width/height to center the rectangle
    addItemRef.current({
      type: 'color',
      x: center.x - 100, // Half of width (200px)
      y: center.y - 75,  // Half of height (150px)
      width: 200,
      height: 150,
      rotation: 0,
      color,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/40 text-sm">Loading...</div>
      </div>
    );
  }

  // Not found state
  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-medium text-foreground mb-4">
            Chapter not found
          </h1>
          <p className="text-foreground/60 mb-6">
            The chapter you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground underline"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to calendar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <CanvasTopBar chapter={chapter} onAddRectangle={handleAddRectangle} />
      <div className="flex-1 relative overflow-hidden">
        <CanvasWithItems
          initialItems={items}
          onItemsChange={setItems}
          onAddItem={(addItem, getViewportCenter) => {
            addItemRef.current = addItem;
            getViewportCenterRef.current = getViewportCenter;
          }}
        />
      </div>
    </div>
  );
}

