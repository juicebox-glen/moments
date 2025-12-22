'use client';

import Link from 'next/link';
import { Chapter } from '@/lib/types';

interface CanvasTopBarProps {
  chapter: Chapter;
  onAddRectangle?: () => void;
}

export default function CanvasTopBar({ chapter, onAddRectangle }: CanvasTopBarProps) {
  const formattedDate = chapter.date
    ? new Date(chapter.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="border-b border-grid bg-background">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-start gap-4">
          <Link
            href="/"
            className="mt-1 p-2 -ml-2 rounded-lg hover:bg-grid transition-colors flex-shrink-0"
            aria-label="Back to calendar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium text-foreground mb-1">
              {chapter.title}
            </h1>
            {formattedDate && (
              <p className="text-sm text-foreground/60">{formattedDate}</p>
            )}
          </div>

          {onAddRectangle && (
            <button
              onClick={onAddRectangle}
              className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
            >
              + Add Rectangle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

