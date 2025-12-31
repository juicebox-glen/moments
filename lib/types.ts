/**
 * Core data types for Chapters app
 * 
 * Chapters is a memory authoring app where users create "Chapters" of their life.
 * There are two types: Moments (single day/occasion) and Eras (extended periods).
 */

import { CanvasItem } from './canvas-item-types';

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

