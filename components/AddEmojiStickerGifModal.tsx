'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface AddEmojiStickerGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmoji: (emoji: string) => void;
  onAddSticker: (stickerUrl: string, width: number, height: number) => void;
  onAddGif: (gifUrl: string, width: number, height: number) => void;
}

type TabType = 'emojis' | 'gifs' | 'stickers';

interface GiphyItem {
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
const GIPHY_GIFS_URL = 'https://api.giphy.com/v1/gifs';
const GIPHY_STICKERS_URL = 'https://api.giphy.com/v1/stickers';

// Popular emoji categories
const EMOJI_CATEGORIES = {
  'Recent': [],
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🦅', '🦆', '🦢', '🦩', '🦚', '🦜', '🐓', '🦃', '🦤', '🦉', '🦅', '🦆', '🦢', '🦩', '🦚', '🦜', '🐓', '🦃', '🦤', '🦉'],
  'Food & Drink': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
  'Activity': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳️', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
  'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🚀', '🛸', '🚁', '🛶', '⛵️', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓️', '⛽️', '🚧', '🚦', '🚥', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲️', '⛱', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕', '⛺️', '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪️', '🕌', '🕍', '🕋', '⛩', '🛤', '🛣', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙', '🌃', '🌌', '🌉', '🌁'],
  'Objects': ['⌚️', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🧺', '🧻', '🚽', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🪣', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒', '🗓', '📆', '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊', '🖋', '✒️', '🖌', '🖍', '📝', '✏️', '🔍', '🔎', '🪓'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🔢', '🔟', '🔢', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '▪️', '▫️', '◾️', '◽️', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔳', '🔲'],
  'Flags': ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇳', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻', '🇧🇶', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨', '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇰', '🇨🇷', '🇨🇮', '🇭🇷', '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲', '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇪🇹', '🇪🇺', '🇫🇰', '🇫🇴', '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫', '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮', '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾', '🇭🇹', '🇭🇳', '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇯🇲', '🇯🇵', '🎌', '🇯🇪', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽🇰', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇴', '🇲🇰', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹', '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩', '🇲🇨', '🇲🇳', '🇲🇪', '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇷', '🇳🇵', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬', '🇳🇺', '🇳🇫', '🇰🇵', '🇲🇰', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼', '🇵🇸', '🇵🇦', '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇺', '🇷🇼', '🇼🇸', '🇸🇲', '🇸🇹', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇨', '🇸🇱', '🇸🇬', '🇸🇽', '🇸🇰', '🇸🇮', '🇬🇸', '🇸🇧', '🇸🇴', '🇿🇦', '🇰🇷', '🇸🇸', '🇪🇸', '🇱🇰', '🇧🇱', '🇸🇭', '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨', '🇸🇩', '🇸🇷', '🇸🇿', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿', '🇹🇭', '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇹🇨', '🇹🇻', '🇻🇮', '🇺🇬', '🇺🇦', '🇦🇪', '🇬🇧', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦', '🇻🇪', '🇻🇳', '🇼🇫', '🇪🇭', '🇾🇪', '🇿🇲', '🇿🇼']
};

export default function AddEmojiStickerGifModal({
  isOpen,
  onClose,
  onAddEmoji,
  onAddSticker,
  onAddGif,
}: AddEmojiStickerGifModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('emojis');
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyItem[]>([]);
  const [stickers, setStickers] = useState<GiphyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{ gifs: GiphyItem[]; stickers: GiphyItem[]; emojis: Record<string, string[]> } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recent-emojis');
      if (saved) {
        try {
          setRecentEmojis(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Load trending content on mount or tab change
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'gifs') {
        loadTrendingGifs();
      } else if (activeTab === 'stickers') {
        loadTrendingStickers();
      }
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Universal search - searches across all categories simultaneously
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        // Search all categories at once
        searchAll(searchQuery);
      } else {
        // Reset to trending when search is cleared
        setSearchResults(null);
        if (activeTab === 'gifs') {
          loadTrendingGifs();
        } else if (activeTab === 'stickers') {
          loadTrendingStickers();
        }
      }
    }, 200); // Debounce to prevent flashing

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);


  const loadTrendingGifs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GIPHY_GIFS_URL}/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=g`);
      if (!response.ok) throw new Error('Failed to load GIFs');
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
    try {
      const response = await fetch(
        `${GIPHY_GIFS_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=50&rating=g`
      );
      if (!response.ok) throw new Error('Failed to search GIFs');
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error searching GIFs:', err);
      return [];
    }
  };

  const loadTrendingStickers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${GIPHY_STICKERS_URL}/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=g`);
      if (!response.ok) throw new Error('Failed to load stickers');
      const data = await response.json();
      setStickers(data.data || []);
    } catch (err) {
      setError('Failed to load stickers. Please try again.');
      console.error('Error loading trending stickers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchStickers = async (query: string) => {
    try {
      const response = await fetch(
        `${GIPHY_STICKERS_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=50&rating=g`
      );
      if (!response.ok) throw new Error('Failed to search stickers');
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error searching stickers:', err);
      return [];
    }
  };

  // Universal search across all categories
  const searchAll = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Search all categories in parallel
      const [gifResults, stickerResults] = await Promise.all([
        searchGifs(query),
        searchStickers(query),
      ]);
      
      // Filter emojis
      const queryLower = query.toLowerCase();
      const filteredEmojis: Record<string, string[]> = {};
      Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]) => {
        const matching = emojis.filter(emoji => {
          return emoji.includes(queryLower) || category.toLowerCase().includes(queryLower);
        });
        if (matching.length > 0) {
          filteredEmojis[category] = matching;
        }
      });
      
      setSearchResults({
        gifs: gifResults,
        stickers: stickerResults,
        emojis: filteredEmojis,
      });
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Error in universal search:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get emojis to display (from search results or all categories)
  const filteredEmojis = useMemo(() => {
    if (searchQuery.trim() && searchResults) {
      return searchResults.emojis;
    }
    return EMOJI_CATEGORIES;
  }, [searchQuery, searchResults]);
  
  // Get GIFs to display (from search results or trending)
  const displayGifs = searchQuery.trim() && searchResults ? searchResults.gifs : gifs;
  
  // Get stickers to display (from search results or trending)
  const displayStickers = searchQuery.trim() && searchResults ? searchResults.stickers : stickers;

  const handleEmojiSelect = (emoji: string) => {
    // Add to recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 30);
    setRecentEmojis(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent-emojis', JSON.stringify(updated));
    }
    
    onAddEmoji(emoji);
    onClose();
  };

  const handleGifSelect = (gif: GiphyItem) => {
    const originalWidth = parseInt(gif.images.original.width);
    const originalHeight = parseInt(gif.images.original.height);
    const gifUrl = gif.images.original.url;
    
    const defaultWidth = 250;
    const aspectRatio = originalWidth / originalHeight;
    const defaultHeight = defaultWidth / aspectRatio;
    
    onAddGif(gifUrl, defaultWidth, defaultHeight);
    onClose();
  };

  const handleStickerSelect = (sticker: GiphyItem) => {
    const originalWidth = parseInt(sticker.images.original.width);
    const originalHeight = parseInt(sticker.images.original.height);
    const stickerUrl = sticker.images.original.url;
    
    const defaultWidth = 200;
    const aspectRatio = originalWidth / originalHeight;
    const defaultHeight = defaultWidth / aspectRatio;
    
    onAddSticker(stickerUrl, defaultWidth, defaultHeight);
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
          <h2 className="text-lg font-semibold text-foreground">Add Emoji, Sticker, or GIF</h2>
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
              placeholder="Search with text or emoji"
              className="w-full pl-10 pr-4 py-2 border border-grid rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all text-sm"
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-grid">
          <button
            onClick={() => setActiveTab('emojis')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeTab === 'emojis'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Emojis
          </button>
          <button
            onClick={() => setActiveTab('gifs')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeTab === 'gifs'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            GIFs
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
              activeTab === 'stickers'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Stickers
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px] relative">
          {/* Emojis Tab */}
          <div className="space-y-4" style={{ 
            minHeight: '300px', 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            padding: '16px',
            opacity: activeTab === 'emojis' ? 1 : 0, 
            pointerEvents: activeTab === 'emojis' ? 'auto' : 'none', 
            transition: 'opacity 0.15s ease',
            visibility: activeTab === 'emojis' ? 'visible' : 'hidden'
          }}>
              {recentEmojis.length > 0 && !searchQuery && (
                <div>
                  <h3 className="text-xs font-medium text-foreground/60 mb-2">Recent</h3>
                  <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5">
                    {recentEmojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-grid rounded-lg p-1.5 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Object.entries(filteredEmojis).map(([category, emojis]) => (
                <div key={category}>
                  <h3 className="text-xs font-medium text-foreground/60 mb-2">{category}</h3>
                  <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5">
                    {emojis.map((emoji, idx) => (
                      <button
                        key={`${category}-${idx}`}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl hover:bg-grid rounded-lg p-1.5 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* GIFs Tab */}
          <div style={{ 
            minHeight: '300px', 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            padding: '16px',
            opacity: activeTab === 'gifs' ? 1 : 0, 
            pointerEvents: activeTab === 'gifs' ? 'auto' : 'none', 
            transition: 'opacity 0.15s ease',
            visibility: activeTab === 'gifs' ? 'visible' : 'hidden'
          }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-foreground/60 text-sm">Loading GIFs...</div>
                </div>
              ) : displayGifs.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-foreground/60 text-sm">No GIFs found</div>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {displayGifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleGifSelect(gif)}
                      className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                      style={{ backgroundColor: '#f5f5f5' }}
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

          {/* Stickers Tab */}
          <div style={{ 
            minHeight: '300px', 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            padding: '16px',
            opacity: activeTab === 'stickers' ? 1 : 0, 
            pointerEvents: activeTab === 'stickers' ? 'auto' : 'none', 
            transition: 'opacity 0.15s ease',
            visibility: activeTab === 'stickers' ? 'visible' : 'hidden'
          }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-foreground/60 text-sm">Loading stickers...</div>
                </div>
              ) : displayStickers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-foreground/60 text-sm">No stickers found</div>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {displayStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerSelect(sticker)}
                      className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                      style={{ backgroundColor: '#f5f5f5' }}
                    >
                      <img
                        src={sticker.images.fixed_width.url}
                        alt={sticker.title}
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
    </div>
  );
}

