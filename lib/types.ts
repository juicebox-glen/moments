/**
 * Core data types for Chapters app
 * 
 * Chapters is a memory authoring app where users create "Chapters" of their life.
 * There are two types: Moments (single day/occasion) and Eras (extended periods).
 */

export type ChapterType = 'moment' | 'era';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Person {
  id: string;
  name: string;
  // Future: avatar, relationship type, etc.
}

export interface Chapter {
  id: string;
  type: ChapterType;
  title: string;
  // For moments: single date, for eras: date range
  date?: Date;
  dateRange?: DateRange;
  people: Person[];
  items: CanvasItem[];
  // Hierarchy support
  parentEra?: string; // ID of parent Era (if this is a Moment)
  childMoments?: string[]; // Array of Moment IDs (if this is an Era)
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasItem {
  id: string;
  type: string; // e.g., 'photo', 'note', 'memento'
  x: number;
  y: number;
  rotation: number; // in degrees
  scale: number;
  // Future: content, metadata, etc.
}

