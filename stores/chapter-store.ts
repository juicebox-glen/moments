import { create } from 'zustand';
import { Chapter } from '@/lib/types';

interface ChapterStore {
  chapters: Chapter[];
  addChapter: (chapter: Chapter) => void;
  getChapter: (id: string) => Chapter | undefined;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  loadChapters: () => void;
}

const STORAGE_KEY = 'chapters';

// Helper to ensure Date objects are properly created
const normalizeChapter = (chapter: Chapter): Chapter => {
  return {
    ...chapter,
    date: chapter.date ? new Date(chapter.date) : undefined,
    dateRange: chapter.dateRange
      ? {
          start: new Date(chapter.dateRange.start),
          end: new Date(chapter.dateRange.end),
        }
      : undefined,
    createdAt: new Date(chapter.createdAt),
    updatedAt: new Date(chapter.updatedAt),
  };
};

// Helper to serialize chapters for localStorage
const serializeChapters = (chapters: Chapter[]): string => {
  return JSON.stringify(
    chapters.map((chapter) => ({
      ...chapter,
      date: chapter.date ? chapter.date.toISOString() : undefined,
      dateRange: chapter.dateRange
        ? {
            start: chapter.dateRange.start.toISOString(),
            end: chapter.dateRange.end.toISOString(),
          }
        : undefined,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString(),
    }))
  );
};

// Helper to deserialize chapters from localStorage
const deserializeChapters = (serialized: string): Chapter[] => {
  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((chapter: any) => ({
      ...chapter,
      date: chapter.date ? new Date(chapter.date) : undefined,
      dateRange: chapter.dateRange
        ? {
            start: new Date(chapter.dateRange.start),
            end: new Date(chapter.dateRange.end),
          }
        : undefined,
      createdAt: new Date(chapter.createdAt),
      updatedAt: new Date(chapter.updatedAt),
    }));
  } catch (error) {
    console.warn('Failed to deserialize chapters:', error);
    return [];
  }
};

// Load chapters from localStorage
const loadChaptersFromStorage = (): Chapter[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return deserializeChapters(saved);
    }
  } catch (error) {
    console.warn('Failed to load chapters from localStorage:', error);
  }
  return [];
};

// Save chapters to localStorage (debounced)
let saveTimeout: NodeJS.Timeout | undefined;
const saveChaptersToStorage = (chapters: Chapter[]) => {
  if (typeof window === 'undefined') return;
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    try {
      const serialized = serializeChapters(chapters);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('Failed to save chapters to localStorage:', error);
    }
  }, 300);
};

export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  
  loadChapters: () => {
    const loaded = loadChaptersFromStorage();
    set({ chapters: loaded });
  },
  
  addChapter: (chapter) => {
    const normalized = normalizeChapter(chapter);
    set((state) => {
      const newChapters = [...state.chapters, normalized];
      saveChaptersToStorage(newChapters);
      return { chapters: newChapters };
    });
  },
  
  getChapter: (id) => {
    const state = get();
    const chapter = state.chapters.find((ch) => ch.id === id);
    return chapter ? normalizeChapter(chapter) : undefined;
  },
  
  updateChapter: (id, updates) =>
    set((state) => {
      const newChapters = state.chapters.map((ch) => {
        if (ch.id === id) {
          const updated = { ...ch, ...updates, updatedAt: new Date() };
          return normalizeChapter(updated);
        }
        return ch;
      });
      saveChaptersToStorage(newChapters);
      return { chapters: newChapters };
    }),
}));

