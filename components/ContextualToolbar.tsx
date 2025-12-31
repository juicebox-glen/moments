'use client';

import React, { useState, useEffect } from 'react';
import { CanvasItem } from '@/lib/canvas-item-types';
import { SIZE_PRESETS, getActivePreset } from '@/lib/size-presets';

interface ContextualToolbarProps {
  // Selection state
  selectedItems: CanvasItem[];
  
  // Edit mode handlers
  onSizeChange: (width: number, height: number) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  interactionTrigger?: number; // Incremented when interaction starts (closes dropdowns)
  
  // Add mode handlers
  onAddPhoto?: (files: File[]) => void;
  onAddSong?: () => void;
  onAddEmoji?: () => void;
  onAddSticker?: () => void;
  onAddDecoration?: () => void;
}

export default function ContextualToolbar({
  selectedItems,
  onSizeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddPhoto,
  onAddSong,
  onAddEmoji,
  onAddSticker,
  onAddDecoration,
}: ContextualToolbarProps) {
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Determine mode based on selection
  const hasSelection = selectedItems.length > 0;
  const targetMode = hasSelection ? 'edit' : 'add';

  // Smooth slide transition between modes
  useEffect(() => {
    if (targetMode !== mode) {
      // Start transition
      setIsTransitioning(true);
      // After animation completes, switch mode
      const timer = setTimeout(() => {
        setMode(targetMode);
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [targetMode, mode]);

  // Get active size preset
  const activePreset = selectedItems.length === 1 
    ? getActivePreset(selectedItems[0])
    : null;

  const handleSizeClick = (preset: 'S' | 'M' | 'L') => {
    if (selectedItems.length !== 1) return;
    const selectedItem = selectedItems[0];
    
    // Songs and GIFs cannot be resized
    if (selectedItem.type === 'song' || selectedItem.type === 'gif') return;
    
    // For emojis, stickers, and decorations, use square presets
    if (selectedItem.type === 'emoji' || selectedItem.type === 'sticker' || selectedItem.type === 'decoration') {
      const { width, height } = SIZE_PRESETS[preset];
      onSizeChange(width, height);
      return;
    }
    
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

  const selectedItem = selectedItems[0];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#FAFAF8',
          border: '1px solid #EEEEEB',
          borderRadius: '9999px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
          minHeight: '48px',
          position: 'relative',
          overflow: 'visible', // Changed from 'hidden' to allow dropdowns to show
        }}
      >
        {/* Add Mode - Visible content that determines width */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            position: mode === 'add' && !isTransitioning ? 'relative' : 'absolute',
            left: mode === 'add' && !isTransitioning ? 'auto' : '12px',
            right: mode === 'add' && !isTransitioning ? 'auto' : '12px',
            whiteSpace: 'nowrap',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            transform: mode === 'add' && !isTransitioning
              ? 'translateY(0)' 
              : mode === 'add' && isTransitioning
                ? 'translateY(-100%)' // Slide up and out
                : mode === 'edit' && !isTransitioning
                  ? 'translateY(0)'
                  : 'translateY(100%)', // Start below, slide up into view
            opacity: (mode === 'add' && !isTransitioning) || (mode === 'edit' && isTransitioning) ? 1 : 0,
            pointerEvents: mode === 'add' && !isTransitioning ? 'auto' : 'none',
            visibility: mode === 'add' && !isTransitioning ? 'visible' : mode === 'add' && isTransitioning ? 'hidden' : 'hidden',
          }}
        >
            {onAddPhoto && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from reaching canvas
                  // Trigger file input click
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0 && onAddPhoto) {
                      onAddPhoto(Array.from(files));
                    }
                  };
                  input.click();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2H14V14H2V2ZM4 4V12H12V4H4Z" fill="currentColor" />
                </svg>
                Photo
              </button>
            )}
            {onAddSong && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from reaching canvas
                  onAddSong?.();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2L12 6H10V12H6V6H4L8 2Z" fill="currentColor" />
                </svg>
                Music
              </button>
            )}
            {(onAddEmoji || onAddSticker) && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from reaching canvas
                  // If both are available, prefer emoji (opens unified modal)
                  if (onAddEmoji) onAddEmoji();
                  else if (onAddSticker) onAddSticker();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="6" cy="6.5" r="1" fill="currentColor" />
                  <circle cx="10" cy="6.5" r="1" fill="currentColor" />
                  <path d="M6 10C6 10 7.5 11.5 10 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Emoji
              </button>
            )}
            {onAddDecoration && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from reaching canvas
                  onAddDecoration?.();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2H14V14H2V2ZM4 4V12H12V4H4Z" fill="currentColor" />
                </svg>
                Decoration
              </button>
            )}
        </div>

        {/* Edit Mode */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: mode === 'edit' && !isTransitioning ? 'relative' : 'absolute',
            left: mode === 'edit' && !isTransitioning ? 'auto' : '12px',
            right: mode === 'edit' && !isTransitioning ? 'auto' : '12px',
            whiteSpace: 'nowrap',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            transform: mode === 'edit' && !isTransitioning
              ? 'translateY(0)' 
              : mode === 'edit' && isTransitioning
                ? 'translateY(100%)' // Slide down and out
                : mode === 'add' && !isTransitioning
                  ? 'translateY(0)'
                  : 'translateY(100%)', // Start below, slide up into view
            opacity: (mode === 'edit' && !isTransitioning) || (mode === 'add' && isTransitioning) ? 1 : 0,
            pointerEvents: mode === 'edit' && !isTransitioning ? 'auto' : 'none',
            visibility: mode === 'edit' && !isTransitioning ? 'visible' : mode === 'edit' && isTransitioning ? 'hidden' : 'hidden',
          }}
        >
          {selectedItem && (
            <>

            {/* Size Preset Buttons (only for single select, and not for songs or GIFs) */}
            {selectedItems.length === 1 && selectedItem.type !== 'song' && selectedItem.type !== 'gif' && (
              <>
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
              </>
            )}

            {/* Layer Controls (Move Up/Down) - Show for all single selections */}
            {selectedItems.length === 1 && (
              <>
                <div
                  style={{
                    width: '1px',
                    height: '24px',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    margin: '0 8px',
                  }}
                />
                <button
                  onClick={onMoveUp}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Move Up (Bring Forward)"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 4L12 8H9V12H7V8H4L8 4Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <button
                  onClick={onMoveDown}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Move Down (Send Backward)"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 12L4 8H7V4H9V8H12L8 12Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </>
            )}

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
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 2V1C5 0.447715 5.44772 0 6 0H10C10.5523 0 11 0.447715 11 1V2H14C14.5523 2 15 2.44772 15 3C15 3.55228 14.5523 4 14 4H13V13C13 14.1046 12.1046 15 11 15H5C3.89543 15 3 14.1046 3 13V4H2C1.44772 4 1 3.55228 1 3C1 2.44772 1.44772 2 2 2H5ZM6 1V2H10V1H6ZM4 4V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V4H4ZM6 6C6.55228 6 7 6.44772 7 7V11C7 11.5523 6.55228 12 6 12C5.44772 12 5 11.5523 5 11V7C5 6.44772 5.44772 6 6 6ZM10 6C10.5523 6 11 6.44772 11 7V11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11V7C9 6.44772 9.44772 6 10 6Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
}

