# Background Removal Options for Scrapbook App

## Overview
Adding background removal to allow users to isolate subjects in photos, creating a proper scrapbook aesthetic where photos appear cut out and can be layered naturally.

## Options Comparison

### 1. **Client-Side Processing (Recommended for MVP)**
**Library: `@imgly/background-removal`**

**Pros:**
- ✅ **Privacy-first**: Processing happens entirely in the browser
- ✅ **No API costs**: Free to use
- ✅ **Offline capable**: Works without internet after initial load
- ✅ **No server infrastructure needed**: Perfect for MVP
- ✅ **Fast for small-medium images**: Processes in seconds
- ✅ **Active maintenance**: Well-maintained library by IMG.LY

**Cons:**
- ❌ **Large bundle size**: ~5-10MB (WebAssembly + models)
- ❌ **Performance**: Can be slow for large images (5+ MB)
- ❌ **Quality**: Good but not perfect (especially fine details like hair)
- ❌ **Browser requirements**: Needs WebAssembly/WebGL support

**Implementation Complexity:** ⭐⭐ (Medium)
**Cost:** Free
**Best For:** MVP, privacy-focused apps, offline-first

---

### 2. **API-Based Services**
**Services: Remove.bg, FreeBgRemover, PhotoRoom API**

**Pros:**
- ✅ **Best quality**: Professional-grade results, especially for fine details
- ✅ **Fast processing**: Typically < 2 seconds
- ✅ **No bundle size impact**: Zero client-side code
- ✅ **Handles any image size**: Server can process large images

**Cons:**
- ❌ **Ongoing costs**: $0.02-0.05 per image (Remove.bg), or subscription
- ❌ **Privacy concerns**: Images sent to third-party servers
- ❌ **Requires backend**: Need API route to hide API keys
- ❌ **Requires internet**: Won't work offline
- ❌ **Rate limits**: May have usage restrictions

**Implementation Complexity:** ⭐⭐⭐ (Medium-High - needs API route)
**Cost:** ~$0.02-0.05 per image or $10-50/month subscription
**Best For:** Production apps with budget, when quality is critical

---

### 3. **Hybrid Approach**
Use client-side for small images, API for large images or when quality is critical.

**Pros:**
- ✅ **Best of both worlds**: Privacy + quality options
- ✅ **Cost optimization**: Only pay for large/high-quality requests
- ✅ **Flexibility**: User chooses or automatic based on image size

**Cons:**
- ❌ **Most complex**: Need to implement both solutions
- ❌ **Maintenance**: Two code paths to maintain

**Implementation Complexity:** ⭐⭐⭐⭐ (High)
**Best For:** Production apps that want both privacy and quality options

---

## Recommendation: **Start with Client-Side (`@imgly/background-removal`)**

**Why:**
1. **Perfect for MVP**: No costs, no backend changes needed
2. **Privacy**: User data never leaves their device
3. **Fast enough**: Good quality for most scrapbook use cases
4. **Easy to upgrade**: Can add API option later without breaking existing functionality

**Migration Path:**
- Start with `@imgly/background-removal` (client-side)
- Add API option later if needed (hybrid approach)
- Or switch entirely to API if quality becomes critical

---

## Implementation Plan

### Step 1: Install Library
```bash
npm install @imgly/background-removal
```

### Step 2: Create Background Removal Utility
Create `lib/background-removal.ts`:
- Function to process image (Blob → Blob with transparent background)
- Error handling
- Progress callbacks (optional, for UX)

### Step 3: Add to Canvas Item Type
Add optional field to track if background is removed:
```typescript
// In canvas-item-types.ts
backgroundRemoved?: boolean; // Optional flag
```

**Note:** The processed image replaces the original, so this flag is mainly for UI state tracking.

### Step 4: Add "Remove Background" Button
In `ContextualToolbar.tsx` edit mode:
- Show button only when `selectedItem.type === 'photo'`
- Add handler prop `onRemoveBackground?: (itemId: string) => void`
- Show loading state while processing

### Step 5: Implement Handler in Parent Component
In `app/chapter/[id]/page.tsx`:
- Create `handleRemoveBackground` function
- Load image from IndexedDB
- Process with background removal library
- Save processed image back to IndexedDB
- Update canvas item with new image URL

### Step 6: Handle Processing State
- Show loading indicator during processing (can take 2-10 seconds)
- Disable other actions while processing
- Handle errors gracefully

---

## Code Structure Preview

### Background Removal Utility (`lib/background-removal.ts`)
```typescript
import { removeBackground } from '@imgly/background-removal';

export async function removeImageBackground(
  imageBlob: Blob
): Promise<Blob> {
  try {
    // Process image (returns Blob with PNG alpha channel)
    const blob = await removeBackground(imageBlob);
    return blob;
  } catch (error) {
    console.error('Background removal failed:', error);
    throw new Error('Failed to remove background. Please try again.');
  }
}
```

### ContextualToolbar Button
```typescript
{selectedItem && selectedItem.type === 'photo' && onRemoveBackground && (
  <button onClick={() => onRemoveBackground(selectedItem.id)}>
    Remove Background
  </button>
)}
```

### Handler in ChapterPage
```typescript
const handleRemoveBackground = async (itemId: string) => {
  // 1. Get item
  // 2. Load image from IndexedDB
  // 3. Process with removeImageBackground()
  // 4. Save processed image to IndexedDB
  // 5. Update item with new blob URL
  // 6. Trigger save
};
```

---

## User Experience Flow

1. User selects a photo
2. "Remove Background" button appears in contextual toolbar
3. User clicks button
4. Loading indicator shows (button disabled, maybe spinner)
5. Processing happens (2-10 seconds depending on image size)
6. Image updates with transparent background
7. User can continue editing, moving, resizing, etc.

---

## Performance Considerations

### Image Size Limits
- **Recommended**: Images under 2MB process quickly (< 5 seconds)
- **Acceptable**: Images 2-5MB may take 10-15 seconds
- **Warn user**: Images over 5MB may take 30+ seconds or fail

### Optimization Tips
1. **Resize before processing**: If image is very large, resize to max 2000px before processing
2. **Show progress**: Use loading indicators
3. **Cancel option**: Allow user to cancel long-running operations
4. **Cache results**: Once processed, don't re-process (store processed version)

---

## Alternative: API Implementation (If Needed Later)

### Next.js API Route (`app/api/remove-background/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get('image') as File;
  
  // Call Remove.bg API (or other service)
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY!,
    },
    body: formData,
  });
  
  const blob = await response.blob();
  return new NextResponse(blob, {
    headers: { 'Content-Type': 'image/png' },
  });
}
```

---

## Next Steps

1. **Decision**: Choose client-side (`@imgly/background-removal`) for MVP
2. **Install**: `npm install @imgly/background-removal`
3. **Implement**: Follow the implementation plan above
4. **Test**: Try with various image sizes and types
5. **Iterate**: Add loading states, error handling, image size warnings

Would you like me to implement the client-side solution now?

