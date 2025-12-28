/**
 * Canvas Item Types
 * Types for items that can be placed on the canvas
 */

export interface CanvasItem {
  id: string;
  type: 'photo' | 'note' | 'memento' | 'color';
  x: number; // Canvas coordinates (absolute)
  y: number; // Canvas coordinates (absolute)
  width: number;
  height: number;
  rotation: number; // Rotation in degrees
  zIndex: number; // Stacking order
  // Type-specific properties
  color?: string; // For color blocks
  content?: string; // For notes
  imageUrl?: string; // For photos
  aspectRatio?: number; // For photos: width/height ratio (preserved during resize)
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

