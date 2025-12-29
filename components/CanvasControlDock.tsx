'use client';

import React, { useState, useEffect } from 'react';
import { CanvasItem } from '@/lib/canvas-item-types';

interface CanvasControlDockProps {
  selectedItems: CanvasItem[];
  onSizeChange: (width: number, height: number) => void;
  onDelete: () => void;
  isVisible: boolean;
}

const SIZE_PRESETS = {
  S: { width: 200, height: 200 },
  M: { width: 300, height: 300 },
  L: { width: 400, height: 400 },
};

export default function CanvasControlDock({
  selectedItems,
  onSizeChange,
  onDelete,
  isVisible,
}: CanvasControlDockProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle visibility with delay for smooth animation
  useEffect(() => {
    if (isVisible && selectedItems.length > 0) {
      // Small delay before showing to allow smooth slide-up
      setShouldShow(true);
      // Use requestAnimationFrame to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      // Hide immediately but animate out
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 300); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [isVisible, selectedItems.length]);

  if (!shouldShow || selectedItems.length === 0) {
    return null;
  }

  const selectedItem = selectedItems[0];
  if (!selectedItem) {
    return null;
  }
  
  const isMultiSelect = selectedItems.length > 1;

  // Determine which preset is active (closest match) - only for single select
  const getActivePreset = () => {
    if (isMultiSelect) return null;
    
    // Songs cannot be resized, so no active preset
    if (selectedItem.type === 'song') return null;
    
    // For photos, we scale based on width, so compare width
    // For non-photos (squares), use max of width/height
    const currentSize = 
      selectedItem.type === 'photo' 
        ? selectedItem.width 
        : Math.max(selectedItem.width, selectedItem.height);
    
    if (currentSize <= 250) return 'S';
    if (currentSize <= 350) return 'M';
    return 'L';
  };

  const activePreset = getActivePreset();

  // Get selection label
  const getSelectionLabel = () => {
    if (isMultiSelect) {
      return `${selectedItems.length} items`;
    }
    // Single item - show type
    switch (selectedItem.type) {
      case 'photo':
        return 'Photo';
      case 'note':
        return 'Note';
      case 'memento':
        return 'Memento';
      case 'color':
        return 'Rectangle';
      case 'song':
        return 'Song';
      default:
        return 'Item';
    }
  };

  const handleSizeClick = (preset: 'S' | 'M' | 'L') => {
    if (isMultiSelect) return; // Disable resize for multi-select
    
    // Songs cannot be resized
    if (selectedItem.type === 'song') return;
    
    // For photos, preserve aspect ratio by scaling width only
    if (selectedItem.type === 'photo' && selectedItem.aspectRatio) {
      const targetWidth = SIZE_PRESETS[preset].width;
      const targetHeight = targetWidth / selectedItem.aspectRatio;
      onSizeChange(targetWidth, targetHeight);
    } else {
      // For non-photos (rectangles, etc.), use fixed dimensions
      const { width, height } = SIZE_PRESETS[preset];
      onSizeChange(width, height);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: isAnimating ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100px)',
        zIndex: 1000, // Above canvas, below modals
        pointerEvents: isAnimating ? 'auto' : 'none',
        opacity: isAnimating ? 1 : 0,
        transition: isAnimating
          ? 'opacity 0.3s ease-out 0.15s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s'
          : 'opacity 0.2s ease-in, transform 0.3s ease-in',
        willChange: 'transform, opacity',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Selection Label */}
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            marginRight: '4px',
            userSelect: 'none',
          }}
        >
          {getSelectionLabel()}
        </div>

        {/* Size Preset Buttons (only for single select, and not for songs) */}
        {!isMultiSelect && selectedItem.type !== 'song' &&
          (['S', 'M', 'L'] as const).map((preset) => {
            const isActive = activePreset === preset;
            return (
              <button
                key={preset}
                onClick={() => handleSizeClick(preset)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? 'rgb(59, 130, 246)' : '#374151',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title={`${preset} (${SIZE_PRESETS[preset].width}×${SIZE_PRESETS[preset].height}px)`}
              >
                {preset}
              </button>
            );
          })}

        {/* Delete Button */}
        <button
          onClick={onDelete}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#ef4444',
            fontSize: '18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: isMultiSelect ? '0' : '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

