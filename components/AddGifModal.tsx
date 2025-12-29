'use client';

import { useState, useEffect, useRef } from 'react';

interface AddGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (gifUrl: string, width: number, height: number) => void;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
  title: string;
}

const GIPHY_API_KEY = 'JIaR7MYAmmY3oejZ1NpVEdCzYji5mHH4';
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

export default function AddGifModal({ isOpen, onClose, onAdd }: AddGifModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load trending GIFs on mount
  useEffect(() => {
    if (isOpen) {
      loadTrendingGifs();
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const loadTrendingGifs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`);
      if (!response.ok) {
        throw new Error('Failed to load GIFs');
      }
      const data = await response.json();
      setGifs(data.data || []);
    } catch (err) {
      setError('Failed to load GIFs. Please try again.');
      console.error('Error loading trending GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`
      );
      if (!response.ok) {
        throw new Error('Failed to search GIFs');
      }
      const data = await response.json();
      setGifs(data.data || []);
    } catch (err) {
      setError('Failed to search GIFs. Please try again.');
      console.error('Error searching GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchQuery);
  };

  const handleGifSelect = (gif: GiphyGif) => {
    // Use fixed_width for consistent sizing, but get original dimensions for aspect ratio
    const originalWidth = parseInt(gif.images.original.width);
    const originalHeight = parseInt(gif.images.original.height);
    const gifUrl = gif.images.original.url; // Use original for best quality
    
    // Default width (similar to photos but slightly larger for GIFs)
    const defaultWidth = 250;
    const aspectRatio = originalWidth / originalHeight;
    const defaultHeight = defaultWidth / aspectRatio;
    
    onAdd(gifUrl, defaultWidth, defaultHeight);
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
        className="bg-background rounded-2xl shadow-xl border border-grid max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-grid">
          <h2 className="text-xl font-semibold text-foreground">Add GIF</h2>
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

        <div className="p-6 border-b border-grid">
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full px-4 py-2.5 border border-grid rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-foreground/60 text-sm">Loading GIFs...</div>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-foreground/60 text-sm">No GIFs found</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                  style={{
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <img
                    src={gif.images.fixed_width.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

