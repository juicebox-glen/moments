# CSS/Styling Patterns Analysis for Selection Effects

## 1. DraggableItem Transform Usage

### Transform Composition
**Location:** `components/DraggableItem.tsx` lines 288-322

```tsx
// Base transform: position + rotation
const baseTransform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;

// Visual effects layered on top
const transform = `${baseTransform} translateY(${translateY}px) scale(${hoverScale})`;
```

**Transform Breakdown:**
- `translate(${item.x}px, ${item.y}px)` - Position on canvas (absolute positioning)
- `rotate(${item.rotation}deg)` - Rotation from item state
- `translateY(${translateY}px)` - Visual lift effect (-4px when selected, -2px on hover)
- `scale(${hoverScale})` - Scale effect (1.02 on hover)

**Applied via:** Inline styles (line 391)
```tsx
style={{
  transform,  // Single combined transform string
  transformOrigin: 'center center',
}}
```

**Current States:**
- **Hover (unselected):** `translateY(-2px) scale(1.02)`
- **Selected (not hovering):** `translateY(-4px) scale(1)`
- **Selected + Hover:** `translateY(-4px) scale(1.02)`
- **Active (dragging/rotating):** No visual effects (scale 1, translateY 0)

---

## 2. Z-Index Hierarchy

### Current Z-Index Values

| Element | Z-Index | Location |
|---------|---------|----------|
| **Canvas Items** | `item.zIndex` (starts at 1, increments) | `DraggableItem.tsx:394` |
| **Rotation Handles** | `item.zIndex + 10` | `DraggableItem.tsx:624` |
| **Zoom Controls** | `50` | `CanvasFoundation.tsx:466` |
| **Contextual Toolbar** | `1000` | `ContextualToolbar.tsx:92` |
| **SizePresetDock** | `item.zIndex + 1000` | `SizePresetDock.tsx:66` |
| **Modals** | `50` (Tailwind z-50) | `CreateChapterModal.tsx:121` |

### Z-Index Notes
- Items start at z-index 1 and increment as new items are added
- Selected items use their natural `item.zIndex` (no boost applied)
- Rotation handles appear 10 levels above their item
- Toolbar and docks are very high (1000+) to appear above all items
- Modals use z-50, which is below toolbar (1000)

**Safe Range for Overlay:** z-40 would work (below toolbar/docks at 1000+, above items which max around 100-200)

---

## 3. Selection Indication (Current)

**Location:** `components/DraggableItem.tsx` lines 364-368, 398-399

### Current Selection Styles

```tsx
// Outline
const outline = isSelected || isActive
  ? '2px solid rgba(59, 130, 246, 0.6)'  // Blue outline
  : 'none';
const outlineOffset = isSelected || isActive ? '2px' : '0';

// Opacity dimming
const opacity = selectedId === null || selectedId === item.id 
  ? 1.0  // Selected or no selection: full opacity
  : 0.6; // Unselected items dimmed
```

**Visual Effects:**
- ✅ **Blue outline:** 2px solid, 60% opacity, 2px offset
- ✅ **Opacity dimming:** Unselected items at 0.6 opacity when something is selected
- ✅ **Visual lift:** Selected items translateY(-4px)
- ✅ **Enhanced shadows:** Stronger shadows when selected/active

**No current effects:**
- ❌ No scale on selection
- ❌ No blur on non-selected items
- ❌ No backdrop overlay

---

## 4. Performance-Intensive Effects

### Current Filter Usage

**Location:** `components/DraggableItem.tsx` lines 324-362, 397

```tsx
// Drop-shadow for photos (multiple layers)
dropShadow = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15)) drop-shadow(0 4px 12px rgba(0,0,0,0.1))';

// Applied via filter property
filter: isPhoto ? dropShadow : 'none'
```

**Backdrop Filter:**
- ✅ Used in `CanvasFoundation.tsx:474` - `backdropFilter: 'blur(8px)'` (zoom controls)
- ✅ Used in `SizePresetDock.tsx:91` - `backdropFilter: 'blur(8px)'` (toolbar)
- ✅ Used in `ContextualToolbar.tsx` - backdrop blur for frosted glass effect

**No blur filters currently on items:**
- ❌ No `filter: blur()` on items
- ✅ Only drop-shadow filters for photos

### Multiple Shadows
- **Photos:** Multiple drop-shadow layers (2 layers)
- **Other items:** Single box-shadow

### Transitions
**Location:** `components/DraggableItem.tsx:374-379`

```tsx
const transition = isActive
  ? 'none'  // No transitions during drag/rotate
  : `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),  // Spring bounce
     ${isPhoto ? 'filter' : 'box-shadow'} 0.15s ease,
     opacity 0.2s ease,
     outline 0.15s ease,
     width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
     height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`;
```

**Transitioned Properties:**
- `transform` - 500ms spring bounce (during resize, hover, selection)
- `filter` (photos) / `box-shadow` - 150ms
- `opacity` - 200ms
- `outline` - 150ms
- `width` / `height` - 500ms spring bounce (resize)

---

## 5. Stacking Context Issues

### Elements Creating Stacking Contexts

**Items:**
- ✅ **Transform:** All items have `transform` (creates stacking context)
- ✅ **Opacity:** Items can have opacity < 1 (creates stacking context when < 1)
  - Current: 1.0 (selected) or 0.6 (unselected when something selected)
- ✅ **Filter:** Photos use `filter: drop-shadow()` (creates stacking context)

**Impact:**
- Each item creates its own stacking context
- Z-index values work within parent stacking context (TransformWrapper)
- Rotation handles use `item.zIndex + 10` which works because they're children of the item

### Current Opacity Behavior
- Unselected items: `opacity: 0.6` when something is selected
- Selected item: `opacity: 1.0`
- This creates stacking contexts for all dimmed items

---

## 6. Canvas Transform System

**Location:** `components/CanvasFoundation.tsx` lines 260-637

### Canvas Wrapper
```tsx
<TransformWrapper>
  <TransformComponent>
    <div style={{ width: '10000px', height: '10000px' }}>
      {/* Items rendered here */}
    </div>
  </TransformComponent>
</TransformWrapper>
```

### Item Positioning

**Method:** Transform-based (NOT top/left)
```tsx
// Items use transform for positioning
const baseTransform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;

// Applied via:
style={{
  position: 'absolute',
  left: 0,  // Always 0
  top: 0,   // Always 0
  transform, // Position comes from transform
}}
```

**Why this matters:**
- Items are positioned via transform, not top/left
- Canvas pan/zoom uses TransformWrapper (react-zoom-pan-pinch library)
- Canvas transform affects all items equally (they're children)
- Item transforms are RELATIVE to canvas transform

### Canvas Pan/Zoom Impact
- Canvas pan/zoom applies transform to the wrapper
- Item transforms are applied on top of canvas transform
- No conflict - they compose naturally

---

## 7. Drag System Interaction

**Location:** `components/DraggableItem.tsx` lines 126-272

### Transform Behavior During Drag

**When `isDragging` or `isRotating` is true:**
```tsx
const isActive = isDragging || isRotating;

// Visual effects removed during drag/rotate
if (isActive) {
  translateY = 0;
  hoverScale = 1;
  transition = 'none';  // No transitions during interaction
}
```

### Drag Implementation
1. Mouse down → Sets dragState (doesn't start dragging yet)
2. Mouse move → If threshold exceeded (5px), `isDragging = true`
3. While dragging → Calls `onDrag(item.id, newX, newY)` continuously
4. Mouse up → `isDragging = false`, clears dragState

### Transform Updates
- Position (`x`, `y`) updates immediately via `onDrag` callback
- No animations during drag (transition: 'none')
- Transform recalculates every frame during drag
- Visual effects (lift, scale) disabled during drag

### Z-Index During Drag
- ✅ **No z-index changes during drag** - uses `item.zIndex` consistently
- Items maintain their layering order while dragging

---

## Summary: Compatibility Assessment

### ✅ SAFE TO ADD

1. **Selection Scale Effect**
   - ✅ Can add `scale(1.08)` to transform when selected
   - ✅ Current transform already uses scale for hover (1.02)
   - ⚠️ Need to ensure it doesn't conflict with hover scale (compose them)

2. **Backdrop Overlay**
   - ✅ Safe z-index range: **z-40** (above items, below toolbar at 1000)
   - ✅ backdrop-filter already used in app (supported)
   - ✅ Can use `pointer-events: none` to allow clicks through

3. **Blur on Non-Selected Items**
   - ✅ No blur currently used on items
   - ⚠️ Performance consideration: blur on many items (15-20+) might be expensive
   - ✅ Can add `filter: blur(4px)` to non-selected items

4. **Opacity Changes**
   - ⚠️ **Already in use!** Unselected items are at 0.6 opacity
   - ✅ Can modify this behavior (remove or adjust)

### ⚠️ POTENTIAL CONFLICTS

1. **Transform Composition**
   - Current: `translate(x, y) rotate(r) translateY(ty) scale(s)`
   - New selection might need: `... scale(1.08)` 
   - **Solution:** Compose scales: `scale(hoverScale * selectionScale)`

2. **Transition Timing**
   - Current: Transform uses 500ms spring bounce
   - Selection effects should match this timing
   - **Solution:** Use same timing for consistency

3. **Z-Index for Selected Items**
   - Currently: Selected items use natural `item.zIndex`
   - New effect needs selected item above overlay (z-40) but preserve layering
   - **Solution:** `Math.max(item.zIndex + 1, 41)` or conditional boost

4. **Opacity Already Applied**
   - Unselected items already dim to 0.6
   - May conflict with new blur/darken effects
   - **Decision needed:** Remove opacity dimming or combine with blur?

### 🔴 POTENTIAL ISSUES

1. **Performance with Blur**
   - Blur on 15-20+ items could be expensive
   - **Mitigation:** Only blur when selection exists, use GPU-accelerated filters

2. **Stacking Context Complexity**
   - Items already create stacking contexts (transform + opacity)
   - Adding blur creates another context
   - **Impact:** Should be fine, but test with many items

3. **Transform Origin**
   - Currently: `transformOrigin: 'center center'` ✅
   - This is correct for center-based scaling
   - **No change needed**

---

## Recommended Implementation Strategy

1. **Add backdrop overlay** at z-40 when selection exists
2. **Scale selected item** by composing with existing hover scale
3. **Blur non-selected items** (replace or complement opacity dimming)
4. **Keep transform timing** synchronized (500ms spring)
5. **Ensure z-index** allows selected item above overlay while preserving layering

### Transform Composition Pattern
```tsx
// Current hover scale: hoverScale (1 or 1.02)
// Add selection scale: selectionScale (1 or 1.08)
const finalScale = hoverScale * selectionScale;
const transform = `${baseTransform} translateY(${translateY}px) scale(${finalScale})`;
```

### Z-Index Pattern
```tsx
// Selected items above overlay, but preserve relative layering
zIndex: isSelected ? Math.max(item.zIndex + 1, 41) : item.zIndex
```

