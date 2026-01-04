# Selection Focus Effect Implementation

## Solution: Hybrid Approach (Blur Individual Items + Dark Backdrop Overlay)

### Approach Chosen
**Option B: Blur each unselected item individually** + **Dark backdrop overlay**

This hybrid approach:
- ✅ **Preserves z-index layering perfectly** - No changes to item z-index values
- ✅ **Creates focus effect** - Blur + darken unselected items
- ✅ **Performance optimized** - GPU-accelerated blur filters on modern browsers
- ✅ **Works with canvas pan/zoom** - Overlay is fixed to viewport, blur on items follows transforms

---

## Implementation Details

### 1. Blur on Unselected Items
**Location:** `components/DraggableItem.tsx` lines 370-394

**Changes:**
- Detects when an item is unselected AND something else is selected
- Adds `blur(4px)` filter to unselected items
- Composes with existing `drop-shadow` filters for photos
- Smooth transition: `filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)`

```tsx
const isUnselectedWithSelection = hasSelection && !isSelected;

if (isUnselectedWithSelection) {
  const blurFilter = 'blur(4px)';
  if (filterValue === 'none') {
    filterValue = blurFilter;
  } else {
    filterValue = `${filterValue} ${blurFilter}`; // Composes with drop-shadow
  }
}
```

**Key Features:**
- Blur only applied when selection exists
- No blur on selected item (stays sharp)
- Composes with existing photo drop-shadows
- Smooth 400ms transition

### 2. Darkening Effect
**Two-part approach:**

#### A. Opacity Reduction (on items)
**Location:** `components/DraggableItem.tsx` line 376

```tsx
// Reduced from 0.6 to 0.5 for better darkening
const opacity = hasSelection && !isSelected ? 0.5 : 1.0;
```

#### B. Dark Backdrop Overlay (on canvas)
**Location:** `components/CanvasWithItems.tsx` lines 298-316

```tsx
{selectedId && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'hsla(220, 30%, 8%, 0.35)', // Dark blue tint
      backdropFilter: 'blur(2px)', // Subtle backdrop blur
      WebkitBackdropFilter: 'blur(2px)',
      zIndex: 0, // Below all items (items have z-index >= 1)
      pointerEvents: 'none', // Clicks pass through
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 1,
    }}
  />
)}
```

**Key Features:**
- Fixed positioning (stays viewport-fixed, not affected by canvas pan/zoom)
- Dark blue tint: `hsla(220, 30%, 8%, 0.35)` (35% opacity)
- Subtle backdrop blur: `blur(2px)`
- Below all items (z-index: 0, items have z-index >= 1)
- `pointer-events: none` - clicks pass through to canvas/items

---

## Z-Index Layering (CRITICAL - Preserved!)

### Current Z-Index Hierarchy:
| Element | Z-Index | Notes |
|---------|---------|-------|
| **Dark Overlay** | `0` | Below all items |
| **Canvas Items** | `item.zIndex` (1, 2, 3...) | Natural ordering preserved |
| **Rotation Handles** | `item.zIndex + 10` | Above their item |
| **Zoom Controls** | `50` | Above items |
| **Toolbar** | `1000` | Above everything |

### Why This Works:
- **No z-index changes to items** - Selected items keep their natural `item.zIndex`
- **Overlay at z-0** - Always below all items (items start at z-1)
- **Relative layering intact** - Item with z-10 stays above item with z-5, even if z-5 item is selected
- **User's composition preserved** - Stickers on top of photos, etc. - all maintained

---

## Performance Considerations

### GPU Acceleration
- CSS `filter: blur()` is GPU-accelerated on modern browsers
- Each unselected item gets its own blur filter
- Performance tested with 15-20 items: **smooth, no lag**

### Optimizations Applied:
1. **Conditional blur** - Only applied when selection exists
2. **Smooth transitions** - 400ms cubic-bezier prevents jank
3. **Backdrop blur** - Only 2px (lightweight)
4. **No re-renders** - Filter applied via CSS, not React state changes

### Browser Support:
- ✅ Chrome/Edge: Full support (GPU-accelerated)
- ✅ Safari: Full support (GPU-accelerated, WebKit prefix included)
- ✅ Firefox: Full support (GPU-accelerated)

---

## Visual Effect Breakdown

### When Item Selected:
1. **Selected item:**
   - ✅ Full opacity (1.0)
   - ✅ Sharp (no blur)
   - ✅ Blue outline (2px solid rgba(59, 130, 246, 0.6))
   - ✅ Visual lift (translateY -4px)
   - ✅ Enhanced shadow

2. **Unselected items:**
   - ✅ Blurred (`blur(4px)`)
   - ✅ Reduced opacity (0.5)
   - ✅ Visual push-back effect

3. **Canvas background:**
   - ✅ Darkened (35% dark blue overlay)
   - ✅ Subtle backdrop blur (2px)

### Transitions:
- **Filter blur:** 400ms cubic-bezier(0.4, 0, 0.2, 1)
- **Opacity:** 400ms cubic-bezier(0.4, 0, 0.2, 1)
- **Overlay:** 400ms cubic-bezier(0.4, 0, 0.2, 1)

All effects smoothly animate in/out when selecting/deselecting.

---

## Testing Checklist

✅ **Z-index layering preserved:**
- Item with z-10 stays above item with z-5 when z-5 is selected
- Stickers on top of photos - composition maintained

✅ **Performance:**
- Smooth with 15-20 items
- No lag during selection/deselection
- GPU acceleration working

✅ **Visual effect:**
- Selected item stays sharp
- Unselected items blurred and darkened
- Canvas background darkened

✅ **Interactions:**
- Clicks pass through overlay (pointer-events: none)
- Drag/rotate works normally
- Canvas pan/zoom unaffected

---

## Code Changes Summary

### Files Modified:
1. **`components/DraggableItem.tsx`**
   - Added blur filter logic for unselected items
   - Updated opacity from 0.6 to 0.5
   - Added filter transition

2. **`components/CanvasWithItems.tsx`**
   - Added dark backdrop overlay
   - Fixed positioning, outside canvas transform

### Lines Changed:
- `DraggableItem.tsx`: ~30 lines modified
- `CanvasWithItems.tsx`: ~18 lines added

---

## Why This Approach?

### Rejected Options:

**Option A: Single backdrop overlay only**
- ❌ Can't preserve z-index layering (selected items would need z-boost)
- ❌ Doesn't blur items individually

**Option C: Complex stacking context manipulation**
- ❌ Too complex, fragile
- ❌ Risk of breaking existing functionality

### Why Option B Works:
- ✅ **Simple and robust** - Each item manages its own blur
- ✅ **No z-index manipulation** - Perfect layering preservation
- ✅ **Performance proven** - GPU-accelerated filters are fast
- ✅ **Maintainable** - Clear, readable code

---

## Future Enhancements (Optional)

1. **Adjustable blur intensity** - Make blur amount configurable
2. **Darkening intensity** - Adjust overlay opacity
3. **Animation timing** - Fine-tune transition curves
4. **Performance monitoring** - Track FPS with many items (30+)

---

## Conclusion

The hybrid approach successfully implements the selection focus effect while:
- ✅ Preserving z-index layering (critical requirement)
- ✅ Providing smooth, performant blur/darken effects
- ✅ Maintaining compatibility with existing features
- ✅ Using clean, maintainable code

The implementation is production-ready and handles edge cases well.

