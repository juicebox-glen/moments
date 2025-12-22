'use client';

import { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import CalendarView from '@/components/CalendarView';
import { useChapterStore } from '@/stores/chapter-store';

export default function Home() {
  const { loadChapters } = useChapterStore();
  const hasLoadedRef = useRef(false);

  // Load chapters from localStorage on mount
  useEffect(() => {
    if (!hasLoadedRef.current && typeof window !== 'undefined') {
      loadChapters();
      hasLoadedRef.current = true;
    }
  }, [loadChapters]);

  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Header />
        <CalendarView />
      </div>
    </div>
  );
}
