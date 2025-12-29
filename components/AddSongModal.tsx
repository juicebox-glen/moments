'use client';

import { useState } from 'react';
import { extractSpotifyTrackId } from '@/lib/spotify-utils';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (spotifyTrackId: string) => void;
}

export default function AddSongModal({ isOpen, onClose, onAdd }: AddSongModalProps) {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!spotifyUrl.trim()) {
      setError('Please enter a Spotify link');
      return;
    }

    setIsSubmitting(true);

    // Extract track ID from URL
    const trackId = extractSpotifyTrackId(spotifyUrl.trim());
    
    if (!trackId) {
      setError('Invalid Spotify link. Please paste a Spotify track share link.');
      setIsSubmitting(false);
      return;
    }

    // Add the song
    onAdd(trackId);
    
    // Reset form
    setSpotifyUrl('');
    setError(null);
    setIsSubmitting(false);
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
          <h2 className="text-xl font-semibold text-foreground">Add Song</h2>
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
            <label htmlFor="spotify-url" className="block text-sm font-medium text-foreground mb-2">
              Spotify Track Link
            </label>
            <input
              id="spotify-url"
              type="text"
              value={spotifyUrl}
              onChange={(e) => {
                setSpotifyUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://open.spotify.com/track/..."
              className="w-full px-4 py-2.5 border border-grid rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
              autoFocus
              disabled={isSubmitting}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
            <p className="mt-2 text-xs text-foreground/60">
              Paste a Spotify track share link. You can get this by clicking &quot;Share&quot; on any Spotify track.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-grid rounded-lg font-medium text-foreground hover:bg-grid transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-foreground text-background rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

