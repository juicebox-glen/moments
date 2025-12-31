'use client';

import { useParams } from 'next/navigation';
import { useChapterStore } from '@/stores/chapter-store';
import { useEffect, useState, useCallback, useRef } from 'react';
import CanvasTopBar from '@/components/CanvasTopBar';
import CanvasWithItems from '@/components/CanvasWithItems';
import AddSongModal from '@/components/AddSongModal';
import AddEmojiStickerGifModal from '@/components/AddEmojiStickerGifModal';
import AddDecorationModal from '@/components/AddDecorationModal';
import TextEditModal from '@/components/TextEditModal';
import { type DecorationPreset } from '@/lib/decoration-presets';
import Link from 'next/link';
import { CanvasItem } from '@/lib/canvas-item-types';
import { saveImage, getImage, deleteImage, base64ToBlob, fileToBlob } from '@/lib/image-storage';

export default function ChapterPage() {
  const params = useParams();
  const id = params.id as string;
  const { chapters, getChapter, loadChapters } = useChapterStore();
  const [isLoading, setIsLoading] = useState(true);
  const chaptersLoadedRef = useRef(false);
  
  // Prevent body scroll when canvas is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load chapters from localStorage on mount
  useEffect(() => {
    if (!chaptersLoadedRef.current && typeof window !== 'undefined') {
      if (chapters.length === 0) {
        loadChapters();
      }
      chaptersLoadedRef.current = true;
    }
    setIsLoading(false);
  }, [chapters.length, loadChapters]);

  const chapter = getChapter(id);
  const addItemRef = useRef<((item: Omit<CanvasItem, 'id' | 'zIndex' | 'createdAt' | 'updatedAt'>) => string) | null>(null);
  const getViewportCenterRef = useRef<(() => { x: number; y: number }) | null>(null);
  const [items, setItems] = useState<CanvasItem[]>([]);
  const itemsRef = useRef<CanvasItem[]>([]); // Keep ref in sync with items state
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasLoadedRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Wrapped setItems to add logging
  const setItemsWithLogging = useCallback((newItems: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => {
    setItems((prev) => {
      const updatedItems = typeof newItems === 'function' ? newItems(prev) : newItems;
      console.log('📝 Parent setItems called', {
        prevCount: prev.length,
        newCount: updatedItems.length,
        prevIds: prev.map(i => i.id),
        newIds: updatedItems.map(i => i.id),
        timestamp: new Date().toISOString()
      });
      return updatedItems;
    });
  }, []);

  // Keep ref in sync with items state
  useEffect(() => {
    itemsRef.current = items;
    console.log('📝 itemsRef updated', {
      count: items.length,
      ids: items.map(i => i.id),
      timestamp: new Date().toISOString()
    });
  }, [items]);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [isAddEmojiStickerGifModalOpen, setIsAddEmojiStickerGifModalOpen] = useState(false);
  const [isAddDecorationModalOpen, setIsAddDecorationModalOpen] = useState(false);
  const [isTextEditModalOpen, setIsTextEditModalOpen] = useState(false);
  const [editingTextItemId, setEditingTextItemId] = useState<string | null>(null);

  // Storage key for this chapter's items
  const storageKey = `chapter-${id}-items`;

  // Helper to serialize items (convert Date objects to ISO strings)
  // Note: blob URLs are not serialized - they'll be regenerated from IndexedDB on load
  const serializeItems = useCallback((itemsToSerialize: CanvasItem[]): string => {
    return JSON.stringify(
      itemsToSerialize.map((item) => {
        const serialized = {
          ...item,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
          updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
        };
        
        // Remove blob URLs (they're temporary, images are stored in IndexedDB)
        // Keep base64 URLs for migration compatibility
        if (serialized.imageUrl && serialized.imageUrl.startsWith('blob:')) {
          delete serialized.imageUrl;
        }
        
        return serialized;
      })
    );
  }, []);

  // Helper to deserialize items (convert ISO strings back to Date objects)
  // Also restores images from IndexedDB and migrates base64 images
  const deserializeItems = useCallback(async (serialized: string): Promise<CanvasItem[]> => {
    try {
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        return [];
      }
      
      const deserializedItems = await Promise.all(
        parsed.map(async (item: Omit<CanvasItem, 'createdAt' | 'updatedAt'> & { createdAt: string | Date; updatedAt: string | Date; textMode?: string; imageUrl?: string }) => {
          // Normalize textMode to lowercase (fix any old data with 'Object' or 'Editing')
          let normalizedTextMode: 'editing' | 'object' | undefined = undefined;
          if (item.textMode) {
            const lowerMode = item.textMode.toLowerCase();
            if (lowerMode === 'editing' || lowerMode === 'object') {
              normalizedTextMode = lowerMode as 'editing' | 'object';
            }
            // If invalid value, leave as undefined
          }
          
          const deserialized: CanvasItem = {
            ...item,
            textMode: normalizedTextMode,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          };
          
          // Handle image restoration/migration
          if (item.type === 'photo' && item.id) {
            console.log(`🔄 Attempting to restore image for item ${item.id} (chapter: ${id})`);
            // Always try to load from IndexedDB first (images are stored there, blob URLs are temporary)
            const blob = await getImage(id!, item.id);
            
            if (blob) {
              // Image exists in IndexedDB, create blob URL
              deserialized.imageUrl = URL.createObjectURL(blob);
              console.log(`✅ Restored image from IndexedDB: ${item.id} (size: ${blob.size})`);
            } else if (item.imageUrl && item.imageUrl.startsWith('data:')) {
              // Migrate: base64 image needs to be converted and saved to IndexedDB
              console.log(`🔄 Migrating base64 image to IndexedDB: ${item.id}`);
              try {
                const blob = base64ToBlob(item.imageUrl);
                await saveImage(id!, item.id, blob);
                // Create new blob URL
                deserialized.imageUrl = URL.createObjectURL(blob);
                console.log(`✅ Migrated image to IndexedDB: ${item.id}`);
              } catch (error) {
                console.error(`❌ Failed to migrate image ${item.id}:`, error);
                // Keep the base64 URL as fallback
                deserialized.imageUrl = item.imageUrl;
              }
            } else {
              // No image in IndexedDB and no valid imageUrl (blob URLs are expired, or imageUrl was removed during serialization)
              console.warn(`⚠️ No image found in IndexedDB for item ${item.id} (chapter: ${id}), imageUrl will be undefined`, {
                hasImageUrl: !!item.imageUrl,
                imageUrlType: item.imageUrl ? (item.imageUrl.startsWith('blob:') ? 'blob' : item.imageUrl.startsWith('data:') ? 'data' : 'other') : 'none'
              });
              // Leave imageUrl undefined - image will be missing but item structure preserved
              delete deserialized.imageUrl;
            }
          }
          
          return deserialized;
        })
      );
      
      return deserializedItems;
    } catch (error) {
      console.warn('Failed to deserialize items:', error);
      return [];
    }
  }, [id]);

  // Save items to localStorage (debounced)
  const saveItems = useCallback(
    (itemsToSave: CanvasItem[]) => {
      // Don't save during initial load
      if (isInitialLoadRef.current) {
        console.log('⏭️ Skipping save - initial load');
        return;
      }

      console.log('💾 Scheduling save (debounced)', {
        itemCount: itemsToSave.length,
        itemIds: itemsToSave.map(i => i.id),
        timestamp: new Date().toISOString()
      });

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        try {
          if (typeof window !== 'undefined') {
            const serialized = serializeItems(itemsToSave);
            localStorage.setItem(storageKey, serialized);
            console.log('✅ Saved to localStorage', {
              itemCount: itemsToSave.length,
              itemIds: itemsToSave.map(i => i.id),
              storageKey,
              timestamp: new Date().toISOString()
            });
            // Verify what's actually in localStorage
            const saved = localStorage.getItem(storageKey);
            const savedItems = saved ? JSON.parse(saved) : [];
            console.log('💾 localStorage contents after save', {
              itemCount: Array.isArray(savedItems) ? savedItems.length : 0,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.warn('❌ Failed to save items to localStorage:', error);
        }
        // Clear the timeout reference after save completes
        saveTimeoutRef.current = undefined;
      }, 500);
    },
    [storageKey, serializeItems]
  );

  // Load items from localStorage on mount
  useEffect(() => {
    if (hasLoadedRef.current || !id) return;
    hasLoadedRef.current = true;

    const loadItems = async () => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            console.log('📂 Starting to deserialize items from localStorage', {
              savedLength: saved.length,
              timestamp: new Date().toISOString()
            });
            const loadedItems = await deserializeItems(saved);
            console.log('📂 Deserialization complete', {
              itemCount: loadedItems.length,
              itemIds: loadedItems.map((i: CanvasItem) => i.id),
              timestamp: new Date().toISOString()
            });
            if (Array.isArray(loadedItems) && loadedItems.length > 0) {
              console.log('📂 Setting loaded items', {
                itemCount: loadedItems.length,
                itemIds: loadedItems.map((i: CanvasItem) => i.id),
                timestamp: new Date().toISOString()
              });
              setItemsWithLogging(loadedItems);
            } else if (Array.isArray(loadedItems) && loadedItems.length === 0) {
              console.log('📂 Loaded empty array, not setting items');
            } else {
              console.warn('📂 Loaded items is not an array:', loadedItems);
            }
          } else {
            console.log('📂 No saved items found in localStorage');
          }
        }
      } catch (error) {
        console.error('❌ Failed to load items from localStorage:', error);
        // Start with empty array on error
        setItemsWithLogging([]);
      } finally {
        // Mark initial load as complete after a short delay to avoid saving during load
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadItems();
  }, [id, storageKey, deserializeItems, setItemsWithLogging]);

  // Save items whenever they change (but not during initial load)
  // Also cleanup deleted items (revoke blob URLs and delete from IndexedDB)
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      saveItems(items);
      
      // Cleanup deleted items: revoke blob URLs and delete from IndexedDB
      // This happens automatically when items change, cleaning up any removed items
      // We track previous items to detect deletions
    }
  }, [items, saveItems]);

  // Track previous items for cleanup detection
  const previousItemsRef = useRef<CanvasItem[]>([]);

  // Cleanup blob URLs and IndexedDB entries when items are deleted
  useEffect(() => {
    if (!id || isInitialLoadRef.current) {
      // Update previous items ref even during initial load
      previousItemsRef.current = items;
      return;
    }
    
    // Get previous items
    const previousItems = previousItemsRef.current;
    const currentItemIds = new Set(items.map(item => item.id));
    
    // Find deleted items
    const deletedItems = previousItems.filter(item => 
      !currentItemIds.has(item.id) && item.type === 'photo' && item.imageUrl
    );
    
    // Cleanup deleted items
    deletedItems.forEach(async (item) => {
      // Revoke blob URL
      if (item.imageUrl && item.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.imageUrl);
        console.log(`🗑️ Revoked blob URL for deleted item: ${item.id}`);
      }
      
      // Delete from IndexedDB
      try {
        await deleteImage(id, item.id);
        console.log(`🗑️ Deleted image from IndexedDB: ${item.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete image from IndexedDB: ${item.id}`, error);
      }
    });
    
    // Update previous items ref for next comparison
    previousItemsRef.current = items;
  }, [items, id]);

  // Save items on unmount and before page unload to ensure nothing is lost
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Before page unload (refresh/close), save immediately
      if (!isInitialLoadRef.current) {
        console.log('💾 Saving items (beforeunload)', {
          itemCount: itemsRef.current.length,
          itemIds: itemsRef.current.map(i => i.id),
          timestamp: new Date().toISOString()
        });
        // Clear any pending debounced save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = undefined;
        }
        // Save immediately using latest items from ref (most up-to-date)
        try {
          const serialized = serializeItems(itemsRef.current);
          localStorage.setItem(storageKey, serialized);
          console.log('✅ Saved on beforeunload', {
            itemCount: itemsRef.current.length,
            itemIds: itemsRef.current.map(i => i.id),
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn('❌ Failed to save items to localStorage on beforeunload:', error);
        }
      }
    };

    // Also handle visibility change (when tab becomes hidden)
    const handleVisibilityChange = () => {
      if (document.hidden && !isInitialLoadRef.current) {
        console.log('💾 Saving items (visibilitychange)', {
          itemCount: itemsRef.current.length,
          itemIds: itemsRef.current.map(i => i.id),
          timestamp: new Date().toISOString()
        });
        // Clear any pending debounced save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = undefined;
        }
        // Save immediately using latest items from ref
        try {
          const serialized = serializeItems(itemsRef.current);
          localStorage.setItem(storageKey, serialized);
          console.log('✅ Saved on visibilitychange', {
            itemCount: itemsRef.current.length,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn('❌ Failed to save items to localStorage on visibility change:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // On unmount, save immediately if there's a pending save
      if (saveTimeoutRef.current && !isInitialLoadRef.current) {
        console.log('💾 Saving items (unmount)', {
          itemCount: itemsRef.current.length,
          itemIds: itemsRef.current.map(i => i.id),
          timestamp: new Date().toISOString()
        });
        clearTimeout(saveTimeoutRef.current);
        // Save immediately using latest items from ref (most up-to-date)
        try {
          if (typeof window !== 'undefined') {
            const serialized = serializeItems(itemsRef.current);
            localStorage.setItem(storageKey, serialized);
            console.log('✅ Saved on unmount', {
              itemCount: itemsRef.current.length,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.warn('❌ Failed to save items to localStorage on unmount:', error);
        }
      }
    };
  }, [storageKey, serializeItems]);

  // Color palette for rectangles - kept for potential future use
  // const rectangleColors = [
  //   '#ff69b4', // Pink
  //   '#3b82f6', // Blue
  //   '#10b981', // Green
  //   '#f59e0b', // Amber
  //   '#8b5cf6', // Purple
  //   '#ef4444', // Red
  //   '#06b6d4', // Cyan
  //   '#f97316', // Orange
  //   '#84cc16', // Lime
  //   '#ec4899', // Pink
  //   '#6366f1', // Indigo
  //   '#14b8a6', // Teal
  // ];

  // Handle adding rectangle (kept for potential future use)
  // const handleAddRectangle = () => {
  //   if (!addItemRef.current || !getViewportCenterRef.current) return;
  //   const center = getViewportCenterRef.current();
  //   const colorIndex = items.length % rectangleColors.length;
  //   const color = rectangleColors[colorIndex];
  //   addItemRef.current({
  //     type: 'color',
  //     x: center.x - 100,
  //     y: center.y - 75,
  //     width: 200,
  //     height: 150,
  //     rotation: 0,
  //     color,
  //   });
  // };


  // Handle adding songs
  const handleAddSong = (spotifyTrackId: string) => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    // Calculate viewport center in canvas coordinates
    const center = getViewportCenterRef.current!();
    
    // Default size for Spotify embed (standard Spotify player size)
    const defaultWidth = 300;
    const defaultHeight = 152; // Standard Spotify embed height
    
    // Scatter songs naturally around viewport center
    const offsetX = (Math.random() - 0.5) * 160; // -80 to +80
    const offsetY = (Math.random() - 0.5) * 160; // -80 to +80
    
    // Add slight random rotation for playful scrapbook feel (-3° to +3°)
    const rotation = (Math.random() - 0.5) * 6;
    
    // Add song centered at scattered position
    addItemRef.current!({
      type: 'song',
      x: center.x + offsetX - defaultWidth / 2,
      y: center.y + offsetY - defaultHeight / 2,
      width: Math.round(defaultWidth),
      height: Math.round(defaultHeight),
      rotation,
      spotifyTrackId,
    });
  };

  // Handle adding emojis
  const handleAddEmoji = (emoji: string) => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    const center = getViewportCenterRef.current!();
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    const rotation = (Math.random() - 0.5) * 6;
    
    // Default size for emojis
    const defaultSize = 80;
    
    addItemRef.current!({
      type: 'emoji',
      x: center.x + offsetX - defaultSize / 2,
      y: center.y + offsetY - defaultSize / 2,
      width: defaultSize,
      height: defaultSize,
      rotation,
      emoji,
    });
  };

  // Handle adding stickers
  const handleAddSticker = (stickerUrl: string, width: number, height: number) => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    const center = getViewportCenterRef.current!();
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    const rotation = (Math.random() - 0.5) * 6;
    
    addItemRef.current!({
      type: 'sticker',
      x: center.x + offsetX - width / 2,
      y: center.y + offsetY - height / 2,
      width: Math.round(width),
      height: Math.round(height),
      rotation,
      stickerUrl,
    });
  };

  // Handle adding GIFs
  const handleAddGif = (gifUrl: string, width: number, height: number) => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    const center = getViewportCenterRef.current!();
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    const rotation = (Math.random() - 0.5) * 6;
    
    addItemRef.current!({
      type: 'gif',
      x: center.x + offsetX - width / 2,
      y: center.y + offsetY - height / 2,
      width: Math.round(width),
      height: Math.round(height),
      rotation,
      gifUrl,
    });
  };

  // Handle adding decorations
  const handleAddDecoration = (preset: DecorationPreset) => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    const center = getViewportCenterRef.current!();
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    
    // Default size for decorations (400x300)
    const defaultWidth = 400;
    const defaultHeight = 300;
    
    // Slight random rotation (-2° to +2°)
    const rotation = (Math.random() - 0.5) * 4;
    
    addItemRef.current!({
      type: 'decoration',
      x: center.x + offsetX - defaultWidth / 2,
      y: center.y + offsetY - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      rotation,
      decorationPreset: preset.id,
      decorationFill: preset.fill,
    });
  };

  // Handle adding text
  const handleAddText = (content: string) => {
    if (!addItemRef.current || !getViewportCenterRef.current) return;

    const center = getViewportCenterRef.current!();
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    
    // Default size for text items
    const defaultWidth = 250;
    const defaultHeight = 150;
    
    // Slight random rotation (-3° to +3°)
    const rotation = (Math.random() - 0.5) * 6;
    
    addItemRef.current!({
      type: 'note',
      x: center.x + offsetX - defaultWidth / 2,
      y: center.y + offsetY - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      rotation,
      content,
    });
  };

  // Handle editing text (updates existing item)
  const handleEditText = useCallback((content: string) => {
    if (!editingTextItemId) {
      // If no editing item ID, treat as new text
      handleAddText(content);
      return;
    }

    // Update existing item
    setItemsWithLogging((prev) =>
      prev.map((item) =>
        item.id === editingTextItemId && item.type === 'note'
          ? { ...item, content, updatedAt: new Date() }
          : item
      )
    );
    
    setEditingTextItemId(null);
  }, [editingTextItemId, handleAddText, setItemsWithLogging]);

  // Handle double-click on text item
  const handleTextItemDoubleClick = useCallback((itemId: string) => {
    const item = itemsRef.current.find(i => i.id === itemId);
    if (item && item.type === 'note') {
      setEditingTextItemId(itemId);
      setIsTextEditModalOpen(true);
    }
  }, []);

  // Handle adding photos
  const handleAddPhoto = useCallback(async (files: File[]) => {
    if (!files || files.length === 0 || !addItemRef.current || !getViewportCenterRef.current || !id) return;

    console.log('📸 handleAddPhoto called', {
      fileCount: files.length,
      currentItemCount: itemsRef.current.length,
      timestamp: new Date().toISOString()
    });

    // Process each file
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      try {
        console.log(`📸 Processing file ${index + 1}/${files.length}`, {
          fileName: file.name,
          fileSize: file.size,
          currentItemCount: itemsRef.current.length
        });

        // Convert File to Blob and create object URL
        const blob = fileToBlob(file);
        const blobUrl = URL.createObjectURL(blob);

        // Create an image to get dimensions
        const img = new Image();
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
          img.src = blobUrl;
        });

        // Calculate viewport center in canvas coordinates
        const center = getViewportCenterRef.current!();
        
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        
        // Always start at Small size (200px width)
        const defaultWidth = 200;
        const defaultHeight = defaultWidth / aspectRatio;
        
        // Scatter photos naturally around viewport center (±50-80px offset)
        const offsetX = (Math.random() - 0.5) * 160; // -80 to +80
        const offsetY = (Math.random() - 0.5) * 160; // -80 to +80
        
        // Add slight random rotation for playful scrapbook feel (-3° to +3°)
        const rotation = (Math.random() - 0.5) * 6;
        
        // Generate a temporary ID for the item (we'll use this to save to IndexedDB first)
        // The actual ID will be generated by addItem, but we need to coordinate the save
        // So we'll save to IndexedDB with a placeholder, then update after we get the real ID
        
        // Actually, better approach: generate ID first, save to IndexedDB, then add item
        // But addItem generates the ID... Let's use a different approach:
        // Save blob to IndexedDB after getting the ID, but do it synchronously before state update propagates
        
        console.log(`📸 Adding photo ${index + 1}/${files.length}`, {
          currentItemCount: itemsRef.current.length,
          timestamp: new Date().toISOString()
        });

        // Add photo centered at scattered position (using blob URL temporarily)
        const newItemId = addItemRef.current!({
          type: 'photo',
          x: center.x + offsetX - defaultWidth / 2,
          y: center.y + offsetY - defaultHeight / 2,
          width: Math.round(defaultWidth),
          height: Math.round(defaultHeight),
          rotation,
          imageUrl: blobUrl, // Temporary blob URL for immediate display
          aspectRatio, // Store aspect ratio for resize operations
        });

        // Save blob to IndexedDB IMMEDIATELY (before any save to localStorage happens)
        // Use await to ensure it completes before the debounced save triggers
        try {
          await saveImage(id, newItemId, blob);
          console.log(`✅ Photo ${index + 1}/${files.length} saved to IndexedDB`, {
            newItemId,
            chapterId: id,
            blobSize: blob.size,
            timestamp: new Date().toISOString()
          });
          
          // Verify the save worked by immediately trying to retrieve it
          const verifyBlob = await getImage(id, newItemId);
          if (verifyBlob) {
            console.log(`✅ Verified: Image ${newItemId} exists in IndexedDB (size: ${verifyBlob.size})`);
          } else {
            console.error(`❌ Verification failed: Image ${newItemId} not found in IndexedDB immediately after save!`);
          }
        } catch (error) {
          console.error(`❌ Failed to save image to IndexedDB for item ${newItemId}:`, error);
          // If IndexedDB save fails, the item will still be added with the blob URL
          // but it won't persist on refresh. We should maybe show an error to the user?
        }

        console.log(`✅ Photo ${index + 1}/${files.length} added`, {
          newItemId,
          currentItemCountAfter: itemsRef.current.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Failed to process file ${index + 1}/${files.length}:`, error);
      }
    }
  }, [id]);

  // Handle paste events to add images from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't handle paste if user is typing in an input/textarea
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable))
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check if clipboard contains image data
      const items = Array.from(clipboardData.items);
      const imageItem = items.find(
        (item) => item.type.indexOf('image') !== -1
      );

      if (!imageItem) {
        // No image in clipboard, ignore silently
        return;
      }

      // Get the image file from clipboard
      const file = imageItem.getAsFile();
      if (!file) return;

      // Convert clipboard item to File object and use existing photo handler
      // The File object from clipboard should work directly with handleAddPhoto
      handleAddPhoto([file]);
    };

    // Add paste event listener to window
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleAddPhoto]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground/40 text-sm">Loading...</div>
      </div>
    );
  }

  // Not found state
  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-medium text-foreground mb-4">
            Chapter not found
          </h1>
          <p className="text-foreground/60 mb-6">
            The chapter you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground underline"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to calendar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <CanvasTopBar 
        chapter={chapter}
      />
      <AddSongModal
        isOpen={isAddSongModalOpen}
        onClose={() => setIsAddSongModalOpen(false)}
        onAdd={handleAddSong}
      />
      <AddEmojiStickerGifModal
        isOpen={isAddEmojiStickerGifModalOpen}
        onClose={() => setIsAddEmojiStickerGifModalOpen(false)}
        onAddEmoji={handleAddEmoji}
        onAddSticker={handleAddSticker}
        onAddGif={handleAddGif}
      />
      <AddDecorationModal
        isOpen={isAddDecorationModalOpen}
        onClose={() => setIsAddDecorationModalOpen(false)}
        onAdd={handleAddDecoration}
      />
      <TextEditModal
        isOpen={isTextEditModalOpen}
        onClose={() => {
          setIsTextEditModalOpen(false);
          setEditingTextItemId(null);
        }}
        onAdd={handleEditText}
        initialContent={editingTextItemId ? items.find(i => i.id === editingTextItemId && i.type === 'note')?.content || '' : ''}
      />
      <div className="flex-1 relative overflow-hidden">
        <CanvasWithItems
          initialItems={items}
          onItemsChange={setItemsWithLogging}
          onAddItem={(addItem, getViewportCenter) => {
            addItemRef.current = addItem;
            getViewportCenterRef.current = getViewportCenter;
          }}
          onAddPhoto={handleAddPhoto}
          onAddSong={() => setIsAddSongModalOpen(true)}
          onAddEmoji={() => setIsAddEmojiStickerGifModalOpen(true)}
          onAddSticker={() => setIsAddEmojiStickerGifModalOpen(true)}
          onAddDecoration={() => setIsAddDecorationModalOpen(true)}
          onAddText={() => {
            setEditingTextItemId(null);
            setIsTextEditModalOpen(true);
          }}
          onItemDoubleClick={handleTextItemDoubleClick}
        />
      </div>
    </div>
  );
}

