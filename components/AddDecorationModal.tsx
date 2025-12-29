'use client';

import { useState, useEffect, useRef } from 'react';
import { DecorationPreset, getPresetsByCategory } from '@/lib/decoration-presets';

interface AddDecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (preset: DecorationPreset) => void;
}

type CategoryType = 'solid' | 'pattern' | 'texture' | 'vintage';

export default function AddDecorationModal({
  isOpen,
  onClose,
  onAdd,
}: AddDecorationModalProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('solid');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter presets by category and search
  const filteredPresets = getPresetsByCategory(activeCategory).filter(preset => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return preset.name.toLowerCase().includes(query);
  });

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handlePresetSelect = (preset: DecorationPreset) => {
    onAdd(preset);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-background rounded-2xl shadow-xl border border-grid max-w-2xl w-full mx-4 max-h-[70vh] min-h-[400px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-grid">
          <h2 className="text-lg font-semibold text-foreground">Add Decoration</h2>
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

        {/* Search Bar */}
        <div className="p-4 border-b border-grid">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decorations..."
              className="w-full pl-10 pr-4 py-2 border border-grid rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all text-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-grid">
          <button
            onClick={() => setActiveCategory('solid')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeCategory === 'solid'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Solid
          </button>
          <button
            onClick={() => setActiveCategory('pattern')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeCategory === 'pattern'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Patterns
          </button>
          <button
            onClick={() => setActiveCategory('texture')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeCategory === 'texture'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Textures
          </button>
          <button
            onClick={() => setActiveCategory('vintage')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeCategory === 'vintage'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Vintage
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px] relative">
          <div style={{ 
            minHeight: '300px', 
            padding: '16px',
          }}>
            {filteredPresets.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-foreground/60 text-sm">No decorations found</div>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="relative aspect-[5/4] rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                    style={{
                      backgroundColor: preset.previewColor || '#f5f5f5',
                      backgroundImage: preset.fill.startsWith('data:') || preset.fill.startsWith('url(') 
                        ? `url(${preset.fill})` 
                        : undefined,
                      backgroundSize: preset.category === 'pattern' || preset.category === 'texture' ? 'cover' : undefined,
                    }}
                    title={preset.name}
                  >
                    {/* Show solid color or pattern/texture */}
                    {preset.category === 'solid' ? (
                      <div 
                        className="w-full h-full"
                        style={{ backgroundColor: preset.fill }}
                      />
                    ) : (
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: preset.fill.startsWith('data:') 
                            ? `url(${preset.fill})` 
                            : undefined,
                          backgroundColor: preset.previewColor || '#f5f5f5',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'repeat',
                        }}
                      />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    {/* Name tooltip on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

