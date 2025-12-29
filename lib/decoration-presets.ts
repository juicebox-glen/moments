/**
 * Decoration Presets
 * Curated decorative shapes for scrapbook layering
 */

export interface DecorationPreset {
  id: string;
  category: 'solid' | 'pattern' | 'texture' | 'vintage';
  name: string;
  fill: string; // CSS color, pattern, or texture
  previewColor?: string; // For preview thumbnail
}

// Helper to create pattern data URLs
const createPattern = (type: string, color1: string, color2: string): string => {
  const patterns: Record<string, string> = {
    polka: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="2" fill="${color1}"/>
      </svg>
    `)}`,
    stripes: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="4" fill="${color1}"/>
      </svg>
    `)}`,
    gingham: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="10" height="10" fill="${color1}"/>
        <rect x="10" y="10" width="10" height="10" fill="${color1}"/>
        <rect x="0" y="10" width="10" height="10" fill="${color2}" opacity="0.3"/>
        <rect x="10" y="0" width="10" height="10" fill="${color2}" opacity="0.3"/>
      </svg>
    `)}`,
    floral: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="3" fill="${color1}" opacity="0.6"/>
        <circle cx="15" cy="15" r="2" fill="${color1}" opacity="0.4"/>
        <circle cx="25" cy="15" r="2" fill="${color1}" opacity="0.4"/>
        <circle cx="15" cy="25" r="2" fill="${color1}" opacity="0.4"/>
        <circle cx="25" cy="25" r="2" fill="${color1}" opacity="0.4"/>
      </svg>
    `)}`,
    lined: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="10" x2="20" y2="10" stroke="${color1}" stroke-width="0.5"/>
      </svg>
    `)}`,
    grid: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="0" x2="0" y2="20" stroke="${color1}" stroke-width="0.5"/>
        <line x1="0" y1="0" x2="20" y2="0" stroke="${color1}" stroke-width="0.5"/>
      </svg>
    `)}`,
  };
  return patterns[type] || color1;
};

// Helper to create texture data URLs
const createTexture = (type: string, baseColor: string): string => {
  const textures: Record<string, string> = {
    kraft: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${baseColor}"/>
        <circle cx="20" cy="30" r="1" fill="rgba(0,0,0,0.05)"/>
        <circle cx="60" cy="40" r="1" fill="rgba(0,0,0,0.05)"/>
        <circle cx="80" cy="70" r="1" fill="rgba(0,0,0,0.05)"/>
        <circle cx="30" cy="80" r="1" fill="rgba(0,0,0,0.05)"/>
      </svg>
    `)}`,
    watercolor: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="watercolor-${baseColor}" cx="50%" cy="50%">
            <stop offset="0%" stop-color="${baseColor}" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="${baseColor}" stop-opacity="0.3"/>
          </radialGradient>
        </defs>
        <ellipse cx="30" cy="40" rx="25" ry="20" fill="url(#watercolor-${baseColor})"/>
        <ellipse cx="70" cy="60" rx="20" ry="25" fill="url(#watercolor-${baseColor})"/>
      </svg>
    `)}`,
    linen: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="20" fill="${baseColor}"/>
        <line x1="0" y1="0" x2="20" y2="20" stroke="rgba(0,0,0,0.03)" stroke-width="0.5"/>
        <line x1="20" y1="0" x2="0" y2="20" stroke="rgba(0,0,0,0.03)" stroke-width="0.5"/>
      </svg>
    `)}`,
    cardboard: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="50" height="50" fill="${baseColor}"/>
        <rect x="0" y="0" width="50" height="1" fill="rgba(0,0,0,0.1)"/>
        <rect x="0" y="49" width="50" height="1" fill="rgba(0,0,0,0.1)"/>
        <rect x="0" y="0" width="1" height="50" fill="rgba(0,0,0,0.1)"/>
        <rect x="49" y="0" width="1" height="50" fill="rgba(0,0,0,0.1)"/>
      </svg>
    `)}`,
  };
  return textures[type] || baseColor;
};

export const DECORATION_PRESETS: DecorationPreset[] = [
  // Solid Colors - Pastels
  { id: 'solid-pastel-pink', category: 'solid', name: 'Soft Pink', fill: '#FFE5E5', previewColor: '#FFE5E5' },
  { id: 'solid-pastel-blue', category: 'solid', name: 'Sky Blue', fill: '#E5F3FF', previewColor: '#E5F3FF' },
  { id: 'solid-pastel-yellow', category: 'solid', name: 'Butter Yellow', fill: '#FFF9E5', previewColor: '#FFF9E5' },
  { id: 'solid-pastel-green', category: 'solid', name: 'Mint Green', fill: '#E5FFE5', previewColor: '#E5FFE5' },
  { id: 'solid-pastel-lavender', category: 'solid', name: 'Lavender', fill: '#F0E5FF', previewColor: '#F0E5FF' },
  { id: 'solid-pastel-peach', category: 'solid', name: 'Peach', fill: '#FFE5D9', previewColor: '#FFE5D9' },
  
  // Solid Colors - Earth Tones
  { id: 'solid-terracotta', category: 'solid', name: 'Terracotta', fill: '#E07A5F', previewColor: '#E07A5F' },
  { id: 'solid-sage', category: 'solid', name: 'Sage Green', fill: '#9CAF88', previewColor: '#9CAF88' },
  { id: 'solid-sand', category: 'solid', name: 'Sand', fill: '#E8D5B7', previewColor: '#E8D5B7' },
  { id: 'solid-cream', category: 'solid', name: 'Cream', fill: '#FFF8E7', previewColor: '#FFF8E7' },
  { id: 'solid-dusty-rose', category: 'solid', name: 'Dusty Rose', fill: '#D4A5A5', previewColor: '#D4A5A5' },
  
  // Solid Colors - Neutrals
  { id: 'solid-white', category: 'solid', name: 'White', fill: '#FFFFFF', previewColor: '#FFFFFF' },
  { id: 'solid-light-gray', category: 'solid', name: 'Light Gray', fill: '#F5F5F5', previewColor: '#F5F5F5' },
  { id: 'solid-beige', category: 'solid', name: 'Beige', fill: '#F5E6D3', previewColor: '#F5E6D3' },
  
  // Patterns
  { id: 'pattern-polka-cream', category: 'pattern', name: 'Polka Dots', fill: createPattern('polka', '#8B7355', '#FFF8E7'), previewColor: '#FFF8E7' },
  { id: 'pattern-stripes-navy', category: 'pattern', name: 'Navy Stripes', fill: createPattern('stripes', '#1E3A5F', '#FFFFFF'), previewColor: '#FFFFFF' },
  { id: 'pattern-gingham-red', category: 'pattern', name: 'Red Gingham', fill: createPattern('gingham', '#C41E3A', '#FFFFFF'), previewColor: '#FFFFFF' },
  { id: 'pattern-gingham-blue', category: 'pattern', name: 'Blue Gingham', fill: createPattern('gingham', '#4A90E2', '#FFFFFF'), previewColor: '#FFFFFF' },
  { id: 'pattern-floral-pink', category: 'pattern', name: 'Floral Pink', fill: createPattern('floral', '#FFB6C1', '#FFE5E5'), previewColor: '#FFE5E5' },
  { id: 'pattern-floral-blue', category: 'pattern', name: 'Floral Blue', fill: createPattern('floral', '#87CEEB', '#E5F3FF'), previewColor: '#E5F3FF' },
  { id: 'pattern-lined-paper', category: 'pattern', name: 'Lined Paper', fill: createPattern('lined', '#8B7355', '#FFF8E7'), previewColor: '#FFF8E7' },
  { id: 'pattern-grid-paper', category: 'pattern', name: 'Graph Paper', fill: createPattern('grid', '#D3D3D3', '#FFFFFF'), previewColor: '#FFFFFF' },
  { id: 'pattern-dots-blue', category: 'pattern', name: 'Blue Dots', fill: createPattern('polka', '#4A90E2', '#E5F3FF'), previewColor: '#E5F3FF' },
  { id: 'pattern-dots-pink', category: 'pattern', name: 'Pink Dots', fill: createPattern('polka', '#FFB6C1', '#FFE5E5'), previewColor: '#FFE5E5' },
  { id: 'pattern-stripes-pink', category: 'pattern', name: 'Pink Stripes', fill: createPattern('stripes', '#FFB6C1', '#FFE5E5'), previewColor: '#FFE5E5' },
  { id: 'pattern-stripes-green', category: 'pattern', name: 'Green Stripes', fill: createPattern('stripes', '#9CAF88', '#E5FFE5'), previewColor: '#E5FFE5' },
  
  // Textures
  { id: 'texture-kraft', category: 'texture', name: 'Kraft Paper', fill: createTexture('kraft', '#D4A574'), previewColor: '#D4A574' },
  { id: 'texture-watercolor-pink', category: 'texture', name: 'Watercolor Pink', fill: createTexture('watercolor', '#FFB6C1'), previewColor: '#FFB6C1' },
  { id: 'texture-watercolor-blue', category: 'texture', name: 'Watercolor Blue', fill: createTexture('watercolor', '#87CEEB'), previewColor: '#87CEEB' },
  { id: 'texture-watercolor-lavender', category: 'texture', name: 'Watercolor Lavender', fill: createTexture('watercolor', '#DDA0DD'), previewColor: '#DDA0DD' },
  { id: 'texture-linen-cream', category: 'texture', name: 'Linen Cream', fill: createTexture('linen', '#FFF8E7'), previewColor: '#FFF8E7' },
  { id: 'texture-linen-beige', category: 'texture', name: 'Linen Beige', fill: createTexture('linen', '#F5E6D3'), previewColor: '#F5E6D3' },
  { id: 'texture-cardboard', category: 'texture', name: 'Cardboard', fill: createTexture('cardboard', '#D4A574'), previewColor: '#D4A574' },
  { id: 'texture-paper-white', category: 'texture', name: 'Paper White', fill: '#FFFFFF', previewColor: '#FFFFFF' },
  
  // Vintage
  { id: 'vintage-map', category: 'vintage', name: 'Map Fragment', fill: '#E8D5B7', previewColor: '#E8D5B7' },
  { id: 'vintage-newspaper', category: 'vintage', name: 'Newspaper', fill: '#F5E6D3', previewColor: '#F5E6D3' },
  { id: 'vintage-stamp', category: 'vintage', name: 'Postage Stamp', fill: '#FFFFFF', previewColor: '#FFFFFF' },
  { id: 'vintage-photo-border', category: 'vintage', name: 'Photo Border', fill: '#F5F5F5', previewColor: '#F5F5F5' },
  { id: 'vintage-handwriting', category: 'vintage', name: 'Handwriting', fill: '#FFF8E7', previewColor: '#FFF8E7' },
  { id: 'vintage-sheet-music', category: 'vintage', name: 'Sheet Music', fill: '#FFFFFF', previewColor: '#FFFFFF' },
  { id: 'vintage-aged-paper', category: 'vintage', name: 'Aged Paper', fill: '#E8D5B7', previewColor: '#E8D5B7' },
  { id: 'vintage-sepia', category: 'vintage', name: 'Sepia', fill: '#D4A574', previewColor: '#D4A574' },
];

export const getPresetById = (id: string): DecorationPreset | undefined => {
  return DECORATION_PRESETS.find(preset => preset.id === id);
};

export const getPresetsByCategory = (category: 'solid' | 'pattern' | 'texture' | 'vintage'): DecorationPreset[] => {
  return DECORATION_PRESETS.filter(preset => preset.category === category);
};

