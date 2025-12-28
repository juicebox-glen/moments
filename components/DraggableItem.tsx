'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasItem } from '@/lib/canvas-item-types';

interface DraggableItemProps {
  item: CanvasItem;
  onDrag: (id: string, x: number, y: number) => void;
  onRotate: (id: string, rotation: number) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  selectedIds: string[]; // For opacity control (backward compatibility)
  scale: number; // Current canvas zoom scale
  disabled?: boolean;
}

// Custom comparison function for better memoization
const areEqual = (prevProps: DraggableItemProps, nextProps: DraggableItemProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.x === nextProps.item.x &&
    prevProps.item.y === nextProps.item.y &&
    prevProps.item.rotation === nextProps.item.rotation &&
    prevProps.item.zIndex === nextProps.item.zIndex &&
    prevProps.item.width === nextProps.item.width &&
    prevProps.item.height === nextProps.item.height &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedIds.length === nextProps.selectedIds.length &&
    prevProps.selectedIds.every((id, idx) => nextProps.selectedIds[idx] === id) &&
    prevProps.scale === nextProps.scale &&
    prevProps.disabled === nextProps.disabled
  );
};

function DraggableItem({
  item,
  onDrag,
  onRotate,
  onSelect,
  isSelected,
  selectedIds,
  scale,
  disabled = false,
}: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [dragState, setDragState] = useState<{
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartY: number;
  } | null>(null);
  const [rotateState, setRotateState] = useState<{
    startAngle: number;
    startRotation: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const [cursor, setCursor] = useState<string>('grab');
  const itemRef = useRef<HTMLDivElement>(null);
  const cursorThrottleRef = useRef<number>(0);

  // Check if mouse is near a corner for rotation
  const checkCornerType = useCallback(
    (e: React.MouseEvent): 'rotate' | 'drag' | null => {
      if (!itemRef.current || disabled) return null;

      const rect = itemRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Threshold scales with zoom (larger threshold for easier interaction)
      const threshold = 30 / scale;

      // Calculate corners accounting for rotation
      // The bounding rect gives us the axis-aligned box, but we need the actual corners
      // For simplicity, we'll check distance to each corner of the bounding rect
      const corners = [
        { x: rect.left, y: rect.top },
        { x: rect.right, y: rect.top },
        { x: rect.left, y: rect.bottom },
        { x: rect.right, y: rect.bottom },
      ];

      for (const corner of corners) {
        const distance = Math.sqrt(
          Math.pow(mouseX - corner.x, 2) + Math.pow(mouseY - corner.y, 2)
        );
        if (distance < threshold) {
          return 'rotate';
        }
      }

      return 'drag';
    },
    [scale, disabled]
  );

  // Handle mouse down - start drag or rotate
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.stopPropagation(); // Prevent canvas pan
      e.preventDefault();

      const cornerType = checkCornerType(e);
      const rect = itemRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (cornerType === 'rotate') {
        // Auto-select if not already selected
        if (!isSelected) {
          onSelect(item.id);
        }
        
        // Start rotation
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(
          e.clientY - centerY,
          e.clientX - centerX
        );
        setIsRotating(true);
        setRotateState({
          startAngle,
          startRotation: item.rotation,
          centerX,
          centerY,
        });
      } else {
        // Start drag (don't clear hover state on click - only clear when actually dragging)
        // If item is already selected and multiple items are selected, don't change selection
        if (!isSelected) {
          onSelect(item.id);
        }
        setDragState({
          startX: e.clientX,
          startY: e.clientY,
          itemStartX: item.x,
          itemStartY: item.y,
        });
        // Note: isDragging will be set in the mouse move handler when threshold is crossed
      }
    },
    [disabled, checkCornerType, isSelected, item.rotation, item.x, item.y, item.id, onSelect]
  );

  // Handle mouse move - update drag or rotate
  useEffect(() => {
    if (!dragState && !isRotating && !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Check if we should start dragging (if dragState exists but isDragging is false)
      if (dragState && !isDragging && !isRotating) {
        const deltaX = Math.abs(e.clientX - dragState.startX);
        const deltaY = Math.abs(e.clientY - dragState.startY);
        const DRAG_THRESHOLD = 5; // pixels
        
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
          // Start dragging - clear hover state now
          setIsDragging(true);
          setIsHovering(false);
        } else {
          // Still just a click, don't start dragging yet
          return;
        }
      }
      
      if (isDragging && dragState) {
        // Calculate delta in screen space, then convert to canvas space
        const deltaX = (e.clientX - dragState.startX) / scale;
        const deltaY = (e.clientY - dragState.startY) / scale;

        const newX = dragState.itemStartX + deltaX;
        const newY = dragState.itemStartY + deltaY;

        onDrag(item.id, newX, newY);

        // Throttle cursor updates for performance
        const now = Date.now();
        if (now - cursorThrottleRef.current > 16) {
          cursorThrottleRef.current = now;
          setCursor('grabbing');
        }
      } else if (isRotating && rotateState) {
        // Calculate rotation angle from center to mouse
        const deltaAngle =
          Math.atan2(
            e.clientY - rotateState.centerY,
            e.clientX - rotateState.centerX
          ) - rotateState.startAngle;

        // Convert to degrees and add to start rotation
        const newRotation =
          rotateState.startRotation + (deltaAngle * 180) / Math.PI;

        onRotate(item.id, newRotation);

        // Update cursor
        setCursor('crosshair');
      }
    };

      const handleMouseUp = () => {
      // If we had dragState but never started dragging, it was just a click
      if (dragState && !isDragging) {
        // Just a click - don't clear hover state
      } else {
        setIsDragging(false);
        setIsRotating(false);
      }
      setDragState(null);
      setRotateState(null);
      setCursor('grab');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRotating, dragState, rotateState, item.id, scale, onDrag, onRotate, setIsDragging, setIsHovering]);

  // Update cursor on hover (when not dragging/rotating)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || isRotating || disabled) return;

      const cornerType = checkCornerType(e);
      if (cornerType === 'rotate') {
        setCursor('crosshair');
      } else {
        setCursor('grab');
      }
    },
    [checkCornerType, isDragging, isRotating, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !isRotating) {
      setCursor('grab');
    }
  }, [isDragging, isRotating]);

  // Calculate transform style - ONLY item.rotation determines rotation
  const baseTransform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;

  // Visual states based on hover/selection
  // 1. Default (idle)
  // 2. Hover (unselected only)
  // 3. Selected (not hovering)
  // 4. Selected + Hovering
  // 5. Dragging or Rotating

  const isHoveringUnselected = isHovering && !isSelected && !isDragging && !isRotating;
  const isSelectedNotHovering = isSelected && !isHovering && !isDragging && !isRotating;
  const isSelectedAndHovering = isSelected && isHovering && !isDragging && !isRotating;
  const isActive = isDragging || isRotating;

  // Transform calculations (NO rotation in effects - only item.rotation)
  let translateY = 0;
  let hoverScale = 1;

  if (isHoveringUnselected) {
    // Hover (unselected only)
    translateY = -2;
    hoverScale = 1.02;
  } else if (isSelectedNotHovering || isActive) {
    // Selected (not hovering) or Dragging/Rotating
    translateY = -4;
    hoverScale = 1;
  } else if (isSelectedAndHovering) {
    // Selected + Hovering
    translateY = -4;
    hoverScale = 1.02;
  }
  // Default: translateY = 0, hoverScale = 1

  const transform = `${baseTransform} translateY(${translateY}px) scale(${hoverScale})`;

  // Shadow calculations - use drop-shadow for photos (respects transparency), box-shadow for others
  const isPhoto = item.type === 'photo';
  let boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; // Default for non-photos
  let dropShadow = ''; // For photos with transparency

  if (isPhoto) {
    // Use drop-shadow for photos - respects transparency and creates organic shadow
    if (isHoveringUnselected) {
      dropShadow = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15)) drop-shadow(0 4px 12px rgba(0,0,0,0.1))';
    } else if (isSelectedNotHovering || isSelectedAndHovering || isActive) {
      dropShadow = 'drop-shadow(0 3px 10px rgba(0,0,0,0.2)) drop-shadow(0 6px 16px rgba(0,0,0,0.15))';
    } else {
      dropShadow = 'drop-shadow(0 2px 6px rgba(0,0,0,0.12)) drop-shadow(0 4px 10px rgba(0,0,0,0.08))';
    }
  } else {
    // Use box-shadow for non-photos (rectangles, etc.)
    if (isHoveringUnselected) {
      boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    } else if (isSelectedNotHovering || isSelectedAndHovering || isActive) {
      boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    }
  }

  // Outline for selected items (polished)
  const outline = isSelected || isActive
    ? '2px solid rgba(59, 130, 246, 0.6)'
    : 'none';
  const outlineOffset = isSelected || isActive ? '2px' : '0';

  // Opacity: dim unselected items when something is selected
  const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;
  const opacity = selectedId === null || selectedId === item.id ? 1.0 : 0.6;

  // Transitions (polished with smooth resize animation)
  const transition = isActive
    ? 'none'
    : `transform 0.15s ease-out, ${isPhoto ? 'filter' : 'box-shadow'} 0.15s ease, opacity 0.2s ease, outline 0.15s ease, width 0.15s ease-out, height 0.15s ease-out`;

  return (
    <div
        ref={itemRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${item.width}px`,
          height: `${item.height}px`,
          transform,
          transformOrigin: 'center center',
          cursor,
          zIndex: item.zIndex,
          transition,
          boxShadow: isPhoto ? 'none' : boxShadow, // No box-shadow for photos
          filter: isPhoto ? dropShadow : 'none', // Use drop-shadow for photos
          outline,
          outlineOffset,
          opacity,
        }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        if (!disabled && !isDragging && !isRotating) {
          setIsHovering(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        handleMouseLeave();
      }}
    >
      {/* Item content based on type */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: item.type === 'photo' ? '8px' : '4px',
          overflow: 'hidden',
          pointerEvents: 'none', // Prevent content from interfering with drag
          backgroundColor: item.type === 'photo' ? 'transparent' : 'transparent', // Transparent for PNG support
        }}
      >
        {item.type === 'color' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: item.color || '#ff69b4',
            }}
          />
        )}
        {item.type === 'photo' && item.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        {item.type === 'note' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#fff',
              padding: '12px',
              fontSize: '14px',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.content || 'Note'}
          </div>
        )}
      </div>


      {/* Rotation handles at all 4 corners (when selected) */}
      {isSelected && (() => {
        const handleRotationStart = (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          
          const rect = itemRef.current?.getBoundingClientRect();
          if (!rect) return;

          // Auto-select if not already selected
          if (!isSelected) {
            onSelect(item.id);
          }

          // Calculate actual center of item (accounting for rotation)
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const startAngle = Math.atan2(
            e.clientY - centerY,
            e.clientX - centerX
          );
          setIsRotating(true);
          setRotateState({
            startAngle,
            startRotation: item.rotation,
            centerX,
            centerY,
          });
        };

        const handleStyle: React.CSSProperties = {
          position: 'absolute',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          cursor: 'crosshair',
          opacity: 0.7,
          transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          zIndex: item.zIndex + 10,
        };

        return (
          <>
            {/* Top-left */}
            <div
              onMouseDown={handleRotationStart}
              style={{
                ...handleStyle,
                top: '-12px',
                left: '-12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
            {/* Top-right */}
            <div
              onMouseDown={handleRotationStart}
              style={{
                ...handleStyle,
                top: '-12px',
                right: '-12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
            {/* Bottom-left */}
            <div
              onMouseDown={handleRotationStart}
              style={{
                ...handleStyle,
                bottom: '-12px',
                left: '-12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
            {/* Bottom-right */}
            <div
              onMouseDown={handleRotationStart}
              style={{
                ...handleStyle,
                bottom: '-12px',
                right: '-12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          </>
        );
      })()}
    </div>
  );
}

export default React.memo(DraggableItem, areEqual);

