'use client';

import { useState } from 'react';
import CreateChapterModal from './CreateChapterModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between mb-12 flex-wrap gap-4">
        <h1 className="text-3xl sm:text-4xl font-medium text-foreground">Chapters</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
        >
          + Add Chapter
        </button>
      </header>
      <CreateChapterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

