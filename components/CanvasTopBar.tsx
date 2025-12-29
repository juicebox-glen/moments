'use client';

import Link from 'next/link';
import { Chapter } from '@/lib/types';
import { useRef } from 'react';

interface CanvasTopBarProps {
  chapter: Chapter;
  onAddRectangle?: () => void;
  onAddPhoto?: (files: File[]) => void;
  onAddSong?: () => void;
}

export default function CanvasTopBar({ chapter, onAddRectangle, onAddPhoto, onAddSong }: CanvasTopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formattedDate = chapter.date
    ? new Date(chapter.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onAddPhoto) {
      // Pass all selected files to the handler
      onAddPhoto(Array.from(files));
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

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

          <div className="flex items-center gap-3">
            {onAddPhoto && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handlePhotoClick}
                  className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.5 2H3.5C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H12.5C13.33 14 14 13.33 14 12.5V3.5C14 2.67 13.33 2 12.5 2ZM11 8.5L8.5 11L6.5 8.5L4.5 10.5V4H11.5V8.5H11Z"
                      fill="currentColor"
                    />
                  </svg>
                  Add Photos
                </button>
              </>
            )}
            {onAddSong && (
              <button
                onClick={onAddSong}
                className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM11 10.5L6.5 8V11.5L4 10V6L8.5 8.5V5L11 6.5V10.5Z"
                    fill="currentColor"
                  />
                </svg>
                Add Song
              </button>
            )}
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
    </div>
  );
}

