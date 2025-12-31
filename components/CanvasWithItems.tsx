'use client';

import React from 'react';
import CanvasFoundation from './CanvasFoundation';
import DraggableItem from './DraggableItem';
import ContextualToolbar from './ContextualToolbar';
import { useCanvasItems } from '@/hooks/useCanvasItems';
import { CanvasItem } from '@/lib/canvas-item-types';

interface CanvasWithItemsProps {
  initialItems?: CanvasItem[];
  onItemsChange?: (items: CanvasItem[]) => void;
  onAddItem?: (addItem: (item: Omit<CanvasItem, 'id' | 'zIndex' | 'createdAt' | 'updatedAt'>) => string, getViewportCenter: () => { x: number; y: number }) => void;
  // Add mode handlers
  onAddPhoto?: (files: File[]) => void;
  onAddSong?: () => void;
  onAddEmoji?: () => void;
  onAddSticker?: () => void;
  onAddDecoration?: () => void;
  // Expose editing state setter for parent
  onEditingStateReady?: (setEditingItemId: (id: string | null) => void) => void;
}

export default function CanvasWithItems({
  initialItems = [],
  onItemsChange,
  onAddItem,
  onAddPhoto,
  onAddSong,
  onAddEmoji,
  onAddSticker,
  onAddDecoration,
}: CanvasWithItemsProps) {
  const {
    items,
    selectedId,
    handleDrag,
    handleRotate,
    handleSelect,
    handleDelete,
    handleResize,
    handleMoveUp,
    handleMoveDown,
    handleCanvasClick,
    addItem,
  } = useCanvasItems(initialItems);


  // Notify parent of items change
  // Only notify if items actually differ from initialItems (user made changes, not just sync)
  const previousItemsRef = React.useRef<CanvasItem[]>(initialItems);
  
  React.useEffect(() => {
    // Create map for efficient lookup by ID
    const initialItemsMap = new Map(initialItems.map(item => [item.id, item]));
    
    // Deep comparison: check if items actually changed (positions, properties, etc.)
    // Not just IDs - positions can change without IDs changing
    let itemsChanged = items.length !== initialItems.length;
    
    if (!itemsChanged) {
      // Check each item for changes in position/properties
      items.forEach((item) => {
        if (itemsChanged) return; // Early exit if already changed
        const initial = initialItemsMap.get(item.id);
        if (!initial) {
          itemsChanged = true;
          return;
        }
        // Check if position or other properties changed
        if (item.x !== initial.x || 
            item.y !== initial.y || 
            item.rotation !== initial.rotation ||
            item.width !== initial.width ||
            item.height !== initial.height ||
            item.zIndex !== initial.zIndex) {
          itemsChanged = true;
        }
      });
    }
    
    // Also check if this is the same as the previous notification (avoid duplicate calls)
    const previousItemsMap = new Map(previousItemsRef.current.map(item => [item.id, item]));
    let sameAsPrevious = previousItemsRef.current.length === items.length;
    
    if (sameAsPrevious) {
      items.forEach((item) => {
        if (!sameAsPrevious) return; // Early exit if already different
        const prevItem = previousItemsMap.get(item.id);
        if (!prevItem || 
            prevItem.x !== item.x || 
            prevItem.y !== item.y || 
            prevItem.rotation !== item.rotation ||
            prevItem.width !== item.width ||
            prevItem.height !== item.height ||
            prevItem.zIndex !== item.zIndex) {
          sameAsPrevious = false;
        }
      });
    }
    
    if (itemsChanged && !sameAsPrevious) {
      console.log('📤 CanvasWithItems: items changed (user action), notifying parent', {
        itemCount: items.length,
        itemIds: items.map(i => i.id),
        timestamp: new Date().toISOString()
      });
      previousItemsRef.current = items;
      onItemsChange?.(items);
    } else {
      console.log('📤 CanvasWithItems: items unchanged or same as previous (sync/duplicate), skipping notification', {
        itemCount: items.length,
        changed: itemsChanged,
        sameAsPrevious,
        timestamp: new Date().toISOString()
      });
    }
  }, [items, onItemsChange, initialItems]);

  // Track current canvas transform for viewport center calculation
  const [canvasTransform, setCanvasTransform] = React.useState({
    scale: 1,
    positionX: -4500,
    positionY: -4500,
  });

  // Calculate viewport center in canvas coordinates
  const getViewportCenter = React.useCallback(() => {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    const canvasX = (viewportCenterX - canvasTransform.positionX) / canvasTransform.scale;
    const canvasY = (viewportCenterY - canvasTransform.positionY) / canvasTransform.scale;
    
    return { x: canvasX, y: canvasY };
  }, [canvasTransform]);

  // Expose addItem function and viewport center calculator to parent
  React.useEffect(() => {
    onAddItem?.(addItem, getViewportCenter);
  }, [addItem, getViewportCenter, onAddItem]);

  // Get selected items for control dock
  const selectedItems = React.useMemo(() => {
    if (!selectedId) return [];
    return items.filter((item) => item.id === selectedId);
  }, [selectedId, items]);

  // Viewport culling: only render items visible in viewport
  const visibleItems = React.useMemo(() => {
    // Calculate which items are in viewport
    const viewportBounds = {
      left: -canvasTransform.positionX / canvasTransform.scale,
      right: (window.innerWidth - canvasTransform.positionX) / canvasTransform.scale,
      top: -canvasTransform.positionY / canvasTransform.scale,
      bottom: (window.innerHeight - canvasTransform.positionY) / canvasTransform.scale,
    };
    
    // Always include selected item (for interactions) even if slightly off-screen
    // Add padding to viewport bounds to ensure items near edge are rendered
    const padding = 200; // pixels in canvas space
    const paddedBounds = {
      left: viewportBounds.left - padding,
      right: viewportBounds.right + padding,
      top: viewportBounds.top - padding,
      bottom: viewportBounds.bottom + padding,
    };
    
    return items.filter(item => {
      // Always include selected item
      if (item.id === selectedId) return true;
      
      // Check if item overlaps with padded viewport bounds
      const itemRight = item.x + item.width;
      const itemBottom = item.y + item.height;
      return !(
        itemRight < paddedBounds.left ||
        item.x > paddedBounds.right ||
        itemBottom < paddedBounds.top ||
        item.y > paddedBounds.bottom
      );
    });
  }, [items, canvasTransform, selectedId]);

  // Handle resize for selected item
  const handleDockResize = React.useCallback(
    (width: number, height: number) => {
      if (selectedId) {
        handleResize(selectedId, width, height);
      }
    },
    [selectedId, handleResize]
  );

  // State to trigger dropdown close in toolbar

  // Close toolbar dropdowns when interacting with canvas (drag, rotate, etc.)
  const handleCanvasInteraction = React.useCallback(() => {
    // Close dropdowns when interacting with canvas
  }, []);

  // Memoize canvas click handler to avoid creating new function on every render
  const handleCanvasClickWrapper = React.useCallback((e: React.MouseEvent) => {
    handleCanvasClick(e);
    // Close toolbar dropdowns when clicking canvas
    handleCanvasInteraction();
  }, [handleCanvasClick, handleCanvasInteraction]);

  // Memoize transform change handler
  const handleTransformChange = React.useCallback((scale: number, positionX: number, positionY: number) => {
    setCanvasTransform({ scale, positionX, positionY });
  }, []);

  // Handle delete for selected item(s)
  const handleDockDelete = React.useCallback(() => {
    if (selectedId) {
      handleDelete(selectedId);
    }
  }, [selectedId, handleDelete]);

  // Handle move up/down for selected item
  const handleDockMoveUp = React.useCallback(() => {
    if (selectedId) {
      handleMoveUp(selectedId);
    }
  }, [selectedId, handleMoveUp]);

  const handleDockMoveDown = React.useCallback(() => {
    if (selectedId) {
      handleMoveDown(selectedId);
    }
  }, [selectedId, handleMoveDown]);

  // Handle keyboard delete
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDelete(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleDelete]);

  return (
    <>
      <CanvasFoundation 
        onCanvasClick={handleCanvasClickWrapper}
        onTransformChange={handleTransformChange}
      >
        {({ scale }: { scale: number; positionX: number; positionY: number }) => (
          <>
            {visibleItems.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onDrag={handleDrag}
              onRotate={handleRotate}
              onSelect={handleSelect}
              onInteractionStart={handleCanvasInteraction}
              isSelected={selectedId === item.id}
              selectedIds={selectedId ? [selectedId] : []}
              scale={scale}
            />
            ))}
          </>
        )}
      </CanvasFoundation>
      
      {/* Contextual Toolbar */}
      <ContextualToolbar
        selectedItems={selectedItems}
        onSizeChange={handleDockResize}
        onDelete={handleDockDelete}
        onMoveUp={handleDockMoveUp}
        onMoveDown={handleDockMoveDown}
        onAddPhoto={onAddPhoto}
        onAddSong={onAddSong}
        onAddEmoji={onAddEmoji}
        onAddSticker={onAddSticker}
        onAddDecoration={onAddDecoration}
      />
    </>
  );
}
