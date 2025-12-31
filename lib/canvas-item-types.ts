/**
 * Canvas Item Types
 * Types for items that can be placed on the canvas
 */

export interface CanvasItem {
  id: string;
  type: 'photo' | 'note' | 'memento' | 'color' | 'song' | 'gif' | 'emoji' | 'sticker' | 'decoration';
  x: number; // Canvas coordinates (absolute)
  y: number; // Canvas coordinates (absolute)
  width: number;
  height: number;
  rotation: number; // Rotation in degrees
  zIndex: number; // Stacking order
  // Type-specific properties
  color?: string; // For color blocks
  content?: string; // For notes/text
  imageUrl?: string; // For photos
  aspectRatio?: number; // For photos: width/height ratio (preserved during resize)
  spotifyTrackId?: string; // For songs: Spotify track ID
  gifUrl?: string; // For GIFs: Giphy GIF URL
  emoji?: string; // For emojis: emoji character
  stickerUrl?: string; // For stickers: Giphy sticker URL
  decorationPreset?: string; // For decorations: preset ID
  decorationFill?: string; // For decorations: CSS fill (color, pattern, texture)
  // Text properties
  font?: string; // Font family for text
  fontSize?: number; // Font size in pixels
  textColor?: string; // Text color (hex)
  textAlign?: 'left' | 'center' | 'right'; // Text alignment
  textBackgroundColor?: string; // Background color for text (like Instagram stories)
  textMode?: 'editing' | 'object'; // Text interaction mode: editing (typing) or object (draggable)
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  itemStartX: number;
  itemStartY: number;
}

export interface RotateState {
  isRotating: boolean;
  startAngle: number;
  startRotation: number;
  centerX: number;
  centerY: number;
}

