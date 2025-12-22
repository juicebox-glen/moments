'use client';

import React from 'react';
import CanvasFoundation from './CanvasFoundation';
import DraggableItem from './DraggableItem';
import CanvasControlDock from './CanvasControlDock';
import { useCanvasItems } from '@/hooks/useCanvasItems';
import { CanvasItem } from '@/lib/canvas-item-types';

interface CanvasWithItemsProps {
  initialItems?: CanvasItem[];
  onItemsChange?: (items: CanvasItem[]) => void;
  onAddItem?: (addItem: (item: Omit<CanvasItem, 'id' | 'zIndex' | 'createdAt' | 'updatedAt'>) => string, getViewportCenter: () => { x: number; y: number }) => void;
}

export default function CanvasWithItems({
  initialItems = [],
  onItemsChange,
  onAddItem,
}: CanvasWithItemsProps) {
  const {
    items,
    selectedId,
    handleDrag,
    handleRotate,
    handleSelect,
    handleDelete,
    handleResize,
    handleCanvasClick,
    addItem,
  } = useCanvasItems(initialItems);

  // Notify parent of items change
  React.useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

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

  // Handle resize for selected item
  const handleDockResize = React.useCallback(
    (width: number, height: number) => {
      if (selectedId) {
        handleResize(selectedId, width, height);
      }
    },
    [selectedId, handleResize]
  );

  // Handle delete for selected item(s)
  const handleDockDelete = React.useCallback(() => {
    if (selectedId) {
      handleDelete(selectedId);
    }
  }, [selectedId, handleDelete]);

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
        onCanvasClick={handleCanvasClick}
        onTransformChange={(scale, positionX, positionY) => {
          setCanvasTransform({ scale, positionX, positionY });
        }}
      >
        {({ scale }: { scale: number; positionX: number; positionY: number }) => (
          <>
            {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onDrag={handleDrag}
              onRotate={handleRotate}
              onSelect={handleSelect}
              isSelected={selectedId === item.id}
              selectedIds={selectedId ? [selectedId] : []}
              scale={scale}
            />
            ))}
          </>
        )}
      </CanvasFoundation>
      
      {/* Fixed Control Dock */}
      <CanvasControlDock
        selectedItems={selectedItems}
        onSizeChange={handleDockResize}
        onDelete={handleDockDelete}
        isVisible={selectedItems.length > 0}
      />
    </>
  );
}
