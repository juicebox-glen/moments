'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasItem } from '@/lib/canvas-item-types';

interface DraggableItemProps {
  item: CanvasItem;
  onDrag: (id: string, x: number, y: number) => void;
  onRotate: (id: string, rotation: number) => void;
  onSelect: (id: string) => void;
  onInteractionStart?: () => void; // Called when drag/rotate starts (to close dropdowns)
  onDoubleClick?: (id: string) => void; // Called when item is double-clicked
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
    prevProps.item.content === nextProps.item.content &&
    prevProps.item.font === nextProps.item.font &&
    prevProps.item.fontSize === nextProps.item.fontSize &&
    prevProps.item.textColor === nextProps.item.textColor &&
    prevProps.item.textAlign === nextProps.item.textAlign &&
    prevProps.item.textBackgroundColor === nextProps.item.textBackgroundColor &&
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
  onInteractionStart,
  onDoubleClick,
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cursorThrottleRef = useRef<number>(0);

  // Use refs for stable callbacks to avoid re-running useEffect
  const onDragRef = useRef(onDrag);
  const onRotateRef = useRef(onRotate);
  const onInteractionStartRef = useRef(onInteractionStart);
  const onSelectRef = useRef(onSelect);

  // Update refs when callbacks change
  useEffect(() => {
    onDragRef.current = onDrag;
    onRotateRef.current = onRotate;
    onInteractionStartRef.current = onInteractionStart;
    onSelectRef.current = onSelect;
  }, [onDrag, onRotate, onInteractionStart, onSelect]);

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
          onSelectRef.current(item.id);
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
        // Notify that interaction started (close dropdowns)
        onInteractionStartRef.current?.();
      } else {
        // Select item if not already selected
        if (!isSelected) {
          onSelectRef.current(item.id);
        }
        
        // Set up drag state - drag will only start if mouse actually moves
        // (handled in mouse move handler when threshold is crossed)
        setDragState({
          startX: e.clientX,
          startY: e.clientY,
          itemStartX: item.x,
          itemStartY: item.y,
        });
        // Note: isDragging will be set in the mouse move handler when threshold is crossed
      }
    },
    [disabled, checkCornerType, isSelected, item.rotation, item.x, item.y, item.id]
  );

  // Handle mouse move - update drag or rotate
  useEffect(() => {
    // We need to attach mouse listeners if:
    // 1. We're already dragging/rotating (dragState/rotateState exists)
    // 2. OR we have dragState/rotateState set (drag/rotate in progress)
    // 3. OR item is selected (might start dragging)
    
    const shouldAttachListeners = 
      dragState !== null || 
      rotateState !== null || 
      isDragging || 
      isRotating ||
      isSelected;
    
    if (!shouldAttachListeners) {
      return;
    }

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
          // Notify that interaction started (close dropdowns)
          onInteractionStartRef.current?.();
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

        onDragRef.current(item.id, newX, newY);

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

        onRotateRef.current(item.id, newRotation);

        // Update cursor
        setCursor('grabbing');
      }
      };

      const handleMouseUp = () => {
        // If we had dragState but never started dragging, it was just a click
        if (dragState && !isDragging && !isRotating) {
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
  }, [isDragging, isRotating, dragState, rotateState, item.id, scale, isSelected]);

  // Update cursor on hover (when not dragging/rotating)
  const handleMouseMove = useCallback(() => {
    if (isDragging || isRotating || disabled) return;

    // Use grab cursor for all interactions (handles have custom rotate cursor)
    setCursor('grab');
  }, [isDragging, isRotating, disabled]);

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
  // Emojis, stickers, and GIFs have no shadow/background
  // Decorations get subtle shadow for depth
  const isPhoto = item.type === 'photo';
  const isNoShadow = item.type === 'emoji' || item.type === 'sticker' || item.type === 'gif';
  const isDecoration = item.type === 'decoration';
  let boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; // Default for non-photos
  let dropShadow = ''; // For photos with transparency

  if (isNoShadow) {
    // No shadow for emojis, stickers, and GIFs
    boxShadow = 'none';
    dropShadow = 'none';
  } else if (isDecoration) {
    // Subtle shadow for decorations (scrapbook layering effect)
    if (isHoveringUnselected) {
      boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    } else if (isSelectedNotHovering || isSelectedAndHovering || isActive) {
      boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    } else {
      boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
    }
  } else if (isPhoto) {
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

  // Transitions (polished with smooth resize animation - Apple-like with bouncy spring)
  // Use same timing for transform (position) and width/height to keep center perfectly fixed during resize
  const resizeTiming = '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  const transition = isActive
    ? 'none'
    : `transform ${resizeTiming}, ${isPhoto ? 'filter' : 'box-shadow'} 0.15s ease, opacity 0.2s ease, outline 0.15s ease, width ${resizeTiming}, height ${resizeTiming}`;

  // Render as draggable canvas item
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
          boxShadow: isNoShadow ? 'none' : (isPhoto ? 'none' : boxShadow), // No box-shadow for photos, emojis, stickers, GIFs
          filter: isNoShadow ? 'none' : (isPhoto ? dropShadow : 'none'), // Use drop-shadow for photos only
          outline,
          outlineOffset,
          opacity,
        }}
      onMouseDown={(e) => {
        handleMouseDown(e);
      }}
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
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!disabled && !isDragging && !isRotating && onDoubleClick) {
          onDoubleClick(item.id);
        }
      }}
    >
      {/* Item content based on type */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: item.type === 'photo' || item.type === 'gif' || item.type === 'sticker' || item.type === 'decoration' || item.type === 'note' ? '8px' : '4px',
          overflow: 'hidden',
          pointerEvents: 'none', // Prevent content from interfering with drag
          backgroundColor: item.type === 'photo' || item.type === 'gif' ? 'transparent' : 'transparent', // Transparent for PNG support
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
        {item.type === 'gif' && item.gifUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.gifUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        {item.type === 'emoji' && item.emoji && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.min(item.width, item.height) * 0.7}px`,
              lineHeight: 1,
            }}
          >
            {item.emoji}
          </div>
        )}
        {item.type === 'sticker' && item.stickerUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.stickerUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )}
        {item.type === 'decoration' && item.decorationFill && (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: item.decorationFill.startsWith('data:') || item.decorationFill.startsWith('url(') 
                ? undefined 
                : item.decorationFill,
              backgroundImage: item.decorationFill.startsWith('data:') || item.decorationFill.startsWith('url(')
                ? `url(${item.decorationFill})`
                : undefined,
              backgroundSize: 'cover',
              backgroundRepeat: 'repeat',
            }}
          />
        )}
        {item.type === 'note' && item.content && (
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#374151',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflow: 'hidden',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              backgroundColor: '#FAFAF8', // Background for text readability
            }}
          >
            {item.content}
          </div>
        )}
        {item.type === 'song' && item.spotifyTrackId && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <iframe
              ref={iframeRef}
              src={`https://open.spotify.com/embed/track/${item.spotifyTrackId}?utm_source=generator&theme=0`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{
                borderRadius: '8px',
                pointerEvents: 'auto', // Ensure iframe can receive pointer events
              }}
            />
            {/* Transparent overlay with clipPath cutout for interactive areas */}
            {/* The clipPath creates an overlay with two small cutouts: */}
            {/* 1. Top-right corner (40x40px) for the X close button */}
            {/* 2. Bottom-right corner (100x100px) for the play button */}
            {/* Everything else (including artist names and text) is blocked from interaction */}
            {/* Clicks on the overlay will bubble up to parent handleMouseDown for drag/rotate */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto', // Allow overlay to receive pointer events
                clipPath: `polygon(
                  0% 0%,
                  calc(100% - 40px) 0%,
                  calc(100% - 40px) 40px,
                  100% 40px,
                  100% calc(100% - 100px),
                  calc(100% - 100px) calc(100% - 100px),
                  calc(100% - 100px) 100%,
                  0% 100%
                )`,
                // This creates an L-shaped overlay that covers everything except:
                // - Top-right 40x40px square (X button area)
                // - Bottom-right 100x100px square (play button area)
                // The middle area (where artist names/text are) is fully blocked
              }}
              // No onMouseDown handler - let the event bubble up to parent container's handleMouseDown
            />
          </div>
        )}
      </div>

      {/* Corner rotation handles (when selected) */}
      {isSelected && (() => {
        const handleCornerRotationStart = (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          
          const rect = itemRef.current?.getBoundingClientRect();
          if (!rect) return;

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

        const handleSize = 14; // Size of corner handles (increased from 8px for better visibility)
        const handleOffset = handleSize / 2; // Offset to center handle at corner

        // Custom rotate cursor - SVG with circular arrows
        const rotateCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z' fill='%23333'/%3E%3C/svg%3E") 12 12, grab`;

        const handleStyle: React.CSSProperties = {
          position: 'absolute',
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.9)', // Blue matching selection outline
          border: '2px solid white',
          cursor: rotateCursor,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          zIndex: item.zIndex + 10,
          transition: 'transform 0.15s ease, opacity 0.15s ease',
          pointerEvents: 'auto',
        };

        return (
          <>
            {/* Top-left corner */}
            <div
              onMouseDown={handleCornerRotationStart}
              style={{
                ...handleStyle,
                top: `-${handleOffset}px`,
                left: `-${handleOffset}px`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
              }}
            />
            {/* Top-right corner */}
            <div
              onMouseDown={handleCornerRotationStart}
              style={{
                ...handleStyle,
                top: `-${handleOffset}px`,
                right: `-${handleOffset}px`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
              }}
            />
            {/* Bottom-left corner */}
            <div
              onMouseDown={handleCornerRotationStart}
              style={{
                ...handleStyle,
                bottom: `-${handleOffset}px`,
                left: `-${handleOffset}px`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
              }}
            />
            {/* Bottom-right corner */}
            <div
              onMouseDown={handleCornerRotationStart}
              style={{
                ...handleStyle,
                bottom: `-${handleOffset}px`,
                right: `-${handleOffset}px`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
              }}
            />
          </>
        );
      })()}
    </div>
  );
}

export default React.memo(DraggableItem, areEqual);

