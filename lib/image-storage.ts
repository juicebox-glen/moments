/**
 * IndexedDB storage for images
 * Stores image blobs separately from metadata to avoid localStorage quota issues
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImagesDB extends DBSchema {
  images: {
    key: string; // "chapterId-itemId"
    value: Blob;
  };
}

let db: IDBPDatabase<ImagesDB> | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initImageDB(): Promise<IDBPDatabase<ImagesDB>> {
  if (db) return db;

  try {
    db = await openDB<ImagesDB>('moments-images', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('images')) {
          database.createObjectStore('images');
        }
      },
    });
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * Save image blob to IndexedDB
 */
export async function saveImage(
  chapterId: string,
  itemId: string,
  imageBlob: Blob
): Promise<void> {
  try {
    const database = await initImageDB();
    const key = `${chapterId}-${itemId}`;
    await database.put('images', imageBlob, key);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('IndexedDB quota exceeded');
      throw new Error('Storage full. Please delete some items.');
    }
    console.error('Failed to save image to IndexedDB:', error);
    throw error;
  }
}

/**
 * Get image blob from IndexedDB
 */
export async function getImage(
  chapterId: string,
  itemId: string
): Promise<Blob | undefined> {
  try {
    const database = await initImageDB();
    const key = `${chapterId}-${itemId}`;
    console.log(`🔍 Looking for image in IndexedDB with key: "${key}"`);
    const blob = await database.get('images', key);
    if (blob) {
      console.log(`✅ Found image in IndexedDB: ${key} (size: ${blob.size})`);
    } else {
      console.log(`❌ Image not found in IndexedDB: ${key}`);
      // List all keys to help debug
      const allKeys = await database.getAllKeys('images');
      console.log(`📋 All keys in IndexedDB:`, allKeys);
    }
    return blob;
  } catch (error) {
    console.error('Failed to get image from IndexedDB:', error);
    return undefined;
  }
}

/**
 * Delete image from IndexedDB
 */
export async function deleteImage(
  chapterId: string,
  itemId: string
): Promise<void> {
  try {
    const database = await initImageDB();
    const key = `${chapterId}-${itemId}`;
    await database.delete('images', key);
  } catch (error) {
    console.error('Failed to delete image from IndexedDB:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Delete all images for a chapter
 */
export async function deleteChapterImages(chapterId: string): Promise<void> {
  try {
    const database = await initImageDB();
    const tx = database.transaction('images', 'readwrite');
    const store = tx.objectStore('images');
    
    // Get all keys for this chapter
    const keys = await store.getAllKeys();
    const chapterKeys = keys.filter((key) => 
      typeof key === 'string' && key.startsWith(`${chapterId}-`)
    );
    
    await Promise.all(chapterKeys.map((key) => store.delete(key)));
    await tx.done;
  } catch (error) {
    console.error('Failed to delete chapter images from IndexedDB:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert File to Blob (File is already a Blob, but this is for clarity)
 */
export function fileToBlob(file: File): Blob {
  return file;
}

