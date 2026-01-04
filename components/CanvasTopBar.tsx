'use client';

import Link from 'next/link';
import { Chapter } from '@/lib/types';

interface CanvasTopBarProps {
  chapter: Chapter;
}

export default function CanvasTopBar({ chapter }: CanvasTopBarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-grid transition-colors flex-shrink-0"
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
            <h1 className="text-2xl font-medium text-foreground">
              {chapter.title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

