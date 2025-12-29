/**
 * Spotify utility functions
 * For parsing Spotify share links and generating embed URLs
 */

/**
 * Extract Spotify track ID from various Spotify URL formats
 * Supports:
 * - https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
 * - spotify:track:4iV5W9uYEdYUVa79Axb7Rh
 * - https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=...
 */
export function extractSpotifyTrackId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Remove whitespace
  url = url.trim();

  // Try to match open.spotify.com URLs
  const openSpotifyMatch = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (openSpotifyMatch) {
    return openSpotifyMatch[1];
  }

  // Try to match spotify:track: format
  const spotifyUriMatch = url.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (spotifyUriMatch) {
    return spotifyUriMatch[1];
  }

  // If it's already just an ID (alphanumeric, 22 chars is typical Spotify ID length)
  if (/^[a-zA-Z0-9]{20,25}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Generate Spotify embed URL from track ID
 */
export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
}

