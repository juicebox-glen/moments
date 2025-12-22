'use client';

import React from 'react';

interface SizePresetDockProps {
  currentWidth: number;
  currentHeight: number;
  onSizeChange: (width: number, height: number) => void;
  onDelete: () => void;
  itemWidth: number;
  itemHeight: number;
  itemRotation: number;
  itemZIndex: number;
}

const SIZE_PRESETS = {
  S: { width: 200, height: 200 },
  M: { width: 300, height: 300 },
  L: { width: 400, height: 400 },
};

export default function SizePresetDock({
  currentWidth,
  currentHeight,
  onSizeChange,
  onDelete,
  itemWidth,
  itemHeight,
  itemRotation,
  itemZIndex,
}: SizePresetDockProps) {
  // Determine which preset is active (closest match)
  const getActivePreset = () => {
    const currentSize = Math.max(currentWidth, currentHeight);
    if (currentSize <= 250) return 'S';
    if (currentSize <= 350) return 'M';
    return 'L';
  };

  const activePreset = getActivePreset();

  // Calculate dock position (bottom-center of item, offset by 20px)
  // Position is relative to item's top-left corner (since dock is inside item container)
  // The item container is already rotated, so we position relative to item center
  const centerX = itemWidth / 2; // Center of item horizontally
  const offsetY = itemHeight / 2 + 20; // Below item center, offset by 20px
  
  // Since the item container is already rotated, we need to position the dock
  // at the bottom center, then counter-rotate it to stay horizontal
  const dockX = centerX;
  const dockY = offsetY;

  const handleSizeClick = (preset: 'S' | 'M' | 'L') => {
    const { width, height } = SIZE_PRESETS[preset];
    onSizeChange(width, height);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${dockX}px`,
        top: `${dockY}px`,
        transform: `translate(-50%, 0) rotate(${-itemRotation}deg)`, // Counter-rotate to stay horizontal
        transformOrigin: 'center center',
        zIndex: itemZIndex + 1000, // High z-index to appear above item
        pointerEvents: 'auto',
        animation: 'fadeIn 0.1s ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 0) rotate(${-itemRotation}deg) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) rotate(${-itemRotation}deg) scale(1);
          }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Size Preset Buttons */}
        {(['S', 'M', 'L'] as const).map((preset) => {
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
            marginLeft: '4px',
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

