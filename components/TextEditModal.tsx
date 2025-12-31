'use client';

import { useState, useEffect } from 'react';

interface TextEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (content: string) => void;
  initialContent?: string; // For editing existing text
}

export default function TextEditModal({ isOpen, onClose, onAdd, initialContent = '' }: TextEditModalProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or initialContent changes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setError(null);
    } else {
      setContent('');
      setError(null);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please enter some text');
      return;
    }

    // Add or update the text
    onAdd(content.trim());
    
    // Reset form and close
    setContent('');
    setError(null);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-background rounded-2xl shadow-xl border border-grid max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {initialContent ? 'Edit Text' : 'Add Text'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-grid transition-colors"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="text-content" className="block text-sm font-medium text-foreground mb-2">
              Text
            </label>
            <textarea
              id="text-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              placeholder="Type your text here..."
              className="w-full px-4 py-3 border border-grid rounded-lg bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-grid text-foreground/60 hover:text-foreground hover:bg-grid transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              {initialContent ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

