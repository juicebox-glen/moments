# Storage Migration Plan: localStorage → IndexedDB

## Problem Analysis

**Current Issue:**
- Images stored as base64 in localStorage
- localStorage quota: ~5-10MB per domain
- Base64 encoding increases size by ~33%
- Hitting quota after ~3-5 photos (depending on image size)
- Silent failures cause data loss on refresh

**Storage Needs:**
- 20-50+ photos per chapter
- Average photo: 2-5MB (original) → 200-500KB (compressed)
- Total needed: 4-25MB per chapter
- localStorage insufficient for this use case

## Recommendation: IndexedDB

### Why IndexedDB is the Best Solution

✅ **Storage Capacity**
- Quota: Typically 50MB+ (can be much higher, up to 50% of disk space)
- Supports storing Blobs directly (no base64 overhead)
- Can easily handle 50+ photos per chapter

✅ **Perfect for This Use Case**
- Native browser API (no external dependencies required, but libraries help)
- Works offline
- Persistent storage (survives browser restarts)
- Designed for large binary data (images, videos, files)

✅ **Developer Experience**
- Can use simple library like `idb` (2KB) to simplify API
- Better than native IndexedDB API (which is verbose)
- TypeScript-friendly with good type support

✅ **Implementation Complexity**
- Medium complexity (more than localStorage, less than backend)
- Well-documented and widely used
- Good browser support (all modern browsers)

### Trade-offs vs Alternatives

| Solution | Storage | Complexity | Reliability | Offline | Recommendation |
|----------|---------|------------|-------------|---------|----------------|
| **IndexedDB** | 50MB+ | Medium | ✅ High | ✅ Yes | ✅ **Best choice** |
| Image compression only | Still ~5MB | Low | ⚠️ Limited | ✅ Yes | ❌ Delays problem |
| File System Access API | Unlimited | Low | ❌ Chrome only | ❌ No | ❌ Not reliable |
| Backend (Supabase) | Unlimited | High | ✅ High | ❌ No | ⏸️ Future option |
| Hybrid (IDB + localStorage) | 50MB+ | Medium | ✅ High | ✅ Yes | ✅ Good alternative |

### Recommended Approach: IndexedDB with `idb` Library

**Why use `idb` library?**
- Native IndexedDB API is verbose and callback-based
- `idb` provides Promise-based API (much cleaner)
- Tiny library (~2KB gzipped)
- Maintained by Jake Archibald (Google)
- Excellent TypeScript support

## Implementation Overview

### Architecture

```
Current:
localStorage → { items: [{ id, x, y, imageUrl: "data:image/..." }] }

New:
IndexedDB (images) → { chapterId, itemId, imageBlob }
localStorage (metadata) → { items: [{ id, x, y, imageUrl: "blob:..." }] }
```

**Benefits:**
- Images stored as Blobs in IndexedDB (efficient)
- Metadata (positions, rotations) in localStorage (fast, small)
- Object URLs for display (blob:// URLs)
- Can migrate existing data

### Implementation Steps

1. **Install `idb` library**
   ```bash
   npm install idb
   ```

2. **Create IndexedDB storage utility**
   - Store images by `chapterId-itemId`
   - Retrieve images by key
   - Handle migrations

3. **Update image storage flow**
   - Store Blobs in IndexedDB (not base64)
   - Generate blob URLs for display
   - Store blob URL references in item data

4. **Update image loading flow**
   - Load blob from IndexedDB
   - Create object URL for display
   - Cache object URLs

5. **Migration script**
   - Read existing localStorage data
   - Extract base64 images
   - Convert to Blobs
   - Store in IndexedDB
   - Update references to blob URLs

## Detailed Implementation

### 1. Storage Utility (`lib/storage.ts`)

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImagesDB extends DBSchema {
  images: {
    key: string; // "chapterId-itemId"
    value: Blob;
  };
}

let db: IDBPDatabase<ImagesDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<ImagesDB>> {
  if (db) return db;

  db = await openDB<ImagesDB>('moments-images', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    },
  });

  return db;
}

export async function saveImage(
  chapterId: string,
  itemId: string,
  imageBlob: Blob
): Promise<void> {
  const database = await initDB();
  const key = `${chapterId}-${itemId}`;
  await database.put('images', imageBlob, key);
}

export async function getImage(
  chapterId: string,
  itemId: string
): Promise<Blob | undefined> {
  const database = await initDB();
  const key = `${chapterId}-${itemId}`;
  return database.get('images', key);
}

export async function deleteImage(
  chapterId: string,
  itemId: string
): Promise<void> {
  const database = await initDB();
  const key = `${chapterId}-${itemId}`;
  await database.delete('images', key);
}

export async function deleteChapterImages(chapterId: string): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('images', 'readwrite');
  const store = tx.objectStore('images');
  
  // Get all keys for this chapter
  const keys = await store.getAllKeys();
  const chapterKeys = keys.filter((key) => key.startsWith(`${chapterId}-`));
  
  await Promise.all(chapterKeys.map((key) => store.delete(key)));
  await tx.done;
}
```

### 2. Update Item Storage

**Current:** Store base64 in item.imageUrl
**New:** Store blob URL in item.imageUrl, blob in IndexedDB

```typescript
// When adding photo
const blob = await fileToBlob(file); // Convert File to Blob
const imageUrl = URL.createObjectURL(blob); // Create blob URL

// Save blob to IndexedDB
await saveImage(chapterId, itemId, blob);

// Store blob URL in item (not the blob itself)
item.imageUrl = imageUrl;
```

### 3. Object URL Management

Need to revoke URLs when items are deleted to prevent memory leaks:

```typescript
// When deleting item
if (item.imageUrl?.startsWith('blob:')) {
  URL.revokeObjectURL(item.imageUrl);
  await deleteImage(chapterId, itemId);
}
```

### 4. Migration Strategy

Create migration utility to convert existing base64 images:

```typescript
export async function migrateBase64ToIndexedDB(
  chapterId: string,
  items: CanvasItem[]
): Promise<CanvasItem[]> {
  const migratedItems = await Promise.all(
    items.map(async (item) => {
      // Skip if already using blob URL
      if (item.imageUrl?.startsWith('blob:')) {
        return item;
      }

      // Convert base64 to blob
      if (item.imageUrl?.startsWith('data:')) {
        const response = await fetch(item.imageUrl);
        const blob = await response.blob();
        
        // Save to IndexedDB
        await saveImage(chapterId, item.id, blob);
        
        // Create new blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        return {
          ...item,
          imageUrl: blobUrl,
        };
      }

      return item;
    })
  );

  return migratedItems;
}
```

### 5. Error Handling

Add proper error handling for quota issues:

```typescript
export async function saveImageWithRetry(
  chapterId: string,
  itemId: string,
  imageBlob: Blob
): Promise<void> {
  try {
    await saveImage(chapterId, itemId, imageBlob);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Could implement: delete old images, compress more, show user warning
      console.error('IndexedDB quota exceeded');
      throw new Error('Storage full. Please delete some items.');
    }
    throw error;
  }
}
```

## Migration Path

### Phase 1: Add IndexedDB Support (Backwards Compatible)
1. Install `idb` library
2. Create storage utility
3. Add IndexedDB support alongside localStorage
4. New items use IndexedDB, old items still work

### Phase 2: Migration Script
1. Run migration on app load
2. Convert base64 → Blobs → IndexedDB
3. Update item references to blob URLs
4. Keep old localStorage data as backup

### Phase 3: Cleanup
1. After migration confirmed working
2. Remove base64 handling code
3. Remove migration script
4. localStorage only stores metadata

## Benefits of This Approach

✅ **Storage Capacity**: 50MB+ vs 5MB
✅ **Efficiency**: Blobs more efficient than base64
✅ **Performance**: Faster saves (no base64 encoding)
✅ **Reliability**: Better error handling, no silent failures
✅ **Scalability**: Can easily support 50+ photos
✅ **Migration**: Can migrate existing data
✅ **Simplicity**: Still client-side, no backend needed

## Implementation Complexity

**Estimated Time:** 4-6 hours

**Steps:**
1. Install and set up `idb` (30 min)
2. Create storage utility (1 hour)
3. Update image save/load logic (2 hours)
4. Add migration script (1 hour)
5. Testing and error handling (1-2 hours)

## Next Steps (If Needed Later)

**When to consider backend:**
- Need to sync across devices
- Need sharing/collaboration
- Storage needs exceed IndexedDB quota
- Need cloud backup

**Backend options:**
- Supabase Storage (object storage)
- Cloudflare R2
- AWS S3
- Firebase Storage

For now, IndexedDB is the perfect solution for an MVP that needs to work offline with many photos.

