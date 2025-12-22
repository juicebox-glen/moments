'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChapterStore } from '@/stores/chapter-store';
import { Chapter } from '@/lib/types';

interface CreateChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateChapterModal({
  isOpen,
  onClose,
}: CreateChapterModalProps) {
  const router = useRouter();
  const addChapter = useChapterStore((state) => state.addChapter);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [people, setPeople] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form and focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDate('');
      setPeople('');
      setIsSubmitting(false);
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Generate unique ID
    const id = `moment-${Date.now()}`;

    // Parse people (comma-separated)
    const peopleList = people
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((name, idx) => ({
        id: `person-${Date.now()}-${idx}`,
        name,
      }));

    // Create new chapter
    const newChapter: Chapter = {
      id,
      type: 'moment',
      title: title.trim(),
      date: date ? new Date(date) : undefined,
      people: peopleList,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to store
    addChapter(newChapter);

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Navigate to chapter page
    router.push(`/chapter/${id}`);
    
    // Close modal
    onClose();
    setIsSubmitting(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      
      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative bg-background rounded-2xl shadow-xl max-w-md w-full p-8 border border-grid"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2
              id="modal-title"
              className="text-2xl font-medium text-foreground"
            >
              A moment that mattered
            </h2>
            <p className="text-sm text-foreground/60">
              One day, one feeling
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-foreground/70 mb-2"
              >
                What should we call this?
              </label>
              <input
                ref={titleInputRef}
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Berlin, February"
                className="w-full px-4 py-3 border border-grid rounded-lg bg-background text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-foreground/70 mb-2"
              >
                When was this?
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-grid rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
              />
            </div>

            {/* People */}
            <div>
              <label
                htmlFor="people"
                className="block text-sm font-medium text-foreground/70 mb-2"
              >
                Who was there?
              </label>
              <input
                id="people"
                type="text"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="Sarah, Alex, Jamie"
                className="w-full px-4 py-3 border border-grid rounded-lg bg-background text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
              />
              <p className="mt-1.5 text-xs text-foreground/50">
                Separate names with commas
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-grid rounded-lg font-medium text-sm text-foreground hover:bg-grid transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 px-6 py-3 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? 'Creating...' : 'Start building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

