# Comprehensive Codebase Review: Chapters App

**Date:** 2024  
**App:** Memory scrapbook with infinite canvas, draggable items  
**Stack:** Next.js 14, TypeScript, React 18, Zustand, react-zoom-pan-pinch

---

## Executive Summary

The codebase shows thoughtful architecture with good TypeScript usage, but suffers from custom drag implementation complexity and performance issues. The main areas of concern are:

1. **Critical:** Custom drag system with bugs (items getting stuck)
2. **Important:** Excessive re-renders and console logging in production
3. **Important:** Complex event handling with potential race conditions
4. **Nice-to-have:** Code organization and dependency optimization

**Overall Assessment:** Good foundation with technical debt requiring systematic refactoring. Priority should be on drag system stability and performance optimization.

---

## 1. Architecture Review

### ✅ What's Working Well

- **Clean separation of concerns:** Components, hooks, stores, and lib directories are well-organized
- **TypeScript coverage:** Strong typing throughout, good use of interfaces
- **Zustand usage:** Appropriate choice for state management, correctly implemented for chapters
- **Component composition:** Good use of compound components (CanvasFoundation, CanvasWithItems)
- **LocalStorage persistence:** Proper serialization/deserialization with debouncing

### ⚠️ What Needs Improvement

#### 1.1 State Management Fragmentation

**Issue:** Canvas items state is managed locally in `useCanvasItems` hook, not in a store. This creates inconsistency:

- Chapters are in Zustand store (`chapter-store.ts`)
- Canvas items are in React state (`useCanvasItems` hook)
- Canvas transform state is in refs (`CanvasFoundation.tsx`)

**Recommendation:** Create a unified `canvas-store.ts` using Zustand:

```typescript
// stores/canvas-store.ts
interface CanvasStore {
  items: CanvasItem[];
  selectedId: string | null;
  transform: { scale: number; positionX: number; positionY: number };
  
  // Actions
  setItems: (items: CanvasItem[]) => void;
  addItem: (item: Omit<CanvasItem, 'id' | 'zIndex' | 'createdAt' | 'updatedAt'>) => string;
  updateItem: (id: string, updates: Partial<CanvasItem>) => void;
  deleteItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  // ... other actions
}
```

**Priority:** Important  
**Effort:** Medium  
**Impact/Effort Ratio:** High

#### 1.2 Duplicate Type Definitions

**Issue:** `CanvasItem` is defined in both `lib/types.ts` (incomplete) and `lib/canvas-item-types.ts` (complete).

**Recommendation:** Remove from `lib/types.ts`, use only `canvas-item-types.ts`:

```typescript
// lib/types.ts - Remove CanvasItem interface
// lib/canvas-item-types.ts - Keep as single source of truth
```

**Priority:** Nice-to-have  
**Effort:** Small  
**Impact/Effort Ratio:** Medium

---

## 2. Drag System Review

### ❌ Critical Issues

#### 2.1 Custom Drag Implementation Complexity

**Issue:** The custom drag implementation in `DraggableItem.tsx` is overly complex with several problems:

1. **Event listener management:** `useEffect` with complex dependencies that attaches/removes window listeners frequently
2. **State synchronization:** Multiple state variables (`dragState`, `rotateState`, `isDragging`, `isRotating`) that can get out of sync
3. **Race conditions:** Mouse events can fire out of order, causing items to get "stuck"
4. **Scale handling:** Manual coordinate transformation that's error-prone
5. **Console logging:** 15+ console.log statements in production code (lines 58-60, 117-118, 188-195, 200-201, etc.)

**Current Problems:**

```typescript
// DraggableItem.tsx:174-302
// Complex useEffect that runs on many dependencies
useEffect(() => {
  // This runs too often and can cause issues
  const shouldAttachListeners = dragState !== null || rotateState !== null || ...
  
  const handleMouseMove = (e: MouseEvent) => {
    // Complex logic that can fail
    if (dragState && !isDragging && !isRotating) {
      // Threshold check
      // State updates that can race
    }
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, [isDragging, isRotating, dragState, rotateState, item.id, item.type, item.x, item.y, isSelected, scale, onDrag, onRotate, setIsDragging, setIsHovering, onInteractionStart]);
```

**Recommendation:** Migrate to `@dnd-kit/core` (recommended) or `react-draggable` (simpler alternative).

**Option A: @dnd-kit (Recommended)**

```typescript
// Better: Using @dnd-kit
import { useDraggable, useDndMonitor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function DraggableItem({ item, ... }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    // ... other styles
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* Item content */}
    </div>
  );
}
```

**Benefits:**
- Handles all edge cases (touch, keyboard, accessibility)
- Better performance (virtualization support)
- Active development and maintenance
- Handles coordinate transformation automatically

**Option B: react-draggable (Simpler)**

```typescript
import Draggable from 'react-draggable';

function DraggableItem({ item, scale, onDrag }: DraggableItemProps) {
  const handleDrag = (e: any, data: DraggableData) => {
    // data.x and data.y are already in the correct coordinate space
    onDrag(item.id, data.x / scale, data.y / scale);
  };

  return (
    <Draggable
      position={{ x: item.x * scale, y: item.y * scale }}
      onDrag={handleDrag}
      handle=".drag-handle"
      scale={scale}
    >
      <div className="drag-handle">
        {/* Item content */}
      </div>
    </Draggable>
  );
}
```

**Benefits:**
- Simpler API
- Well-tested library
- Handles most edge cases

**Priority:** Critical  
**Effort:** Large  
**Impact/Effort Ratio:** Very High

#### 2.2 Rotation Implementation

**Issue:** Rotation uses manual angle calculations that don't account for canvas transform properly.

**Current Code (problematic):**

```typescript
// DraggableItem.tsx:239-255
if (isRotating && rotateState) {
  const deltaAngle = Math.atan2(
    e.clientY - rotateState.centerY,
    e.clientX - rotateState.centerX
  ) - rotateState.startAngle;
  const newRotation = rotateState.startRotation + (deltaAngle * 180) / Math.PI;
  onRotate(item.id, newRotation);
}
```

**Issue:** Uses screen coordinates (`e.clientY`, `e.clientX`) without accounting for canvas scale/pan.

**Recommendation:** 
- If using @dnd-kit: Use `@dnd-kit/rotate` extension
- If keeping custom: Transform coordinates to canvas space first

**Priority:** Important  
**Effort:** Medium  
**Impact/Effort Ratio:** High

---

## 3. Canvas Implementation Review

### ✅ What's Working Well

- **react-zoom-pan-pinch integration:** Good choice for zoom/pan functionality
- **LocalStorage persistence:** Viewport state saved and restored
- **Grid background:** Scales with zoom level correctly

### ⚠️ What Needs Improvement

#### 3.1 Grid Synchronization Complexity

**Issue:** Grid background uses `backgroundSize: ${40 * gridScale}px` which works but requires careful state management. The grid position is static (0,0) while canvas panning uses transform - this is correct but the code comments suggest confusion.

**Current Code:**

```typescript
// CanvasFoundation.tsx:616-622
backgroundSize: `${40 * gridScale}px ${40 * gridScale}px`,
backgroundPosition: '0 0' // Static - transform handles movement
```

**Recommendation:** This is actually correct, but add clearer comments:

```typescript
// Grid background: scale changes with zoom, position is handled by CSS transform
// The transform component handles panning, so grid stays at (0,0) in canvas space
backgroundSize: `${40 * gridScale}px ${40 * gridScale}px`,
backgroundPosition: '0 0', // Static position - panning handled by transform wrapper
```

**Priority:** Nice-to-have  
**Effort:** Small  
**Impact/Effort Ratio:** Low

#### 3.2 Scale Drift Prevention

**Issue:** Complex logic to prevent scale drift during panning (lines 142-159, 298-316). Multiple defensive checks suggest the library isn't handling this reliably.

**Current Code:**

```typescript
// CanvasFoundation.tsx:298-316
onTransformed={(ref) => {
  let scaleToUse = ref.state.scale;
  if (isPanningRef.current && !isZoomingRef.current) {
    const expectedScale = currentScaleRef.current;
    if (Math.abs(ref.state.scale - expectedScale) > 0.001) {
      // Force scale back - this shouldn't be necessary
      transformRef.current?.setTransform(..., expectedScale, 0);
      scaleToUse = expectedScale;
    }
  }
  // ...
}}
```

**Recommendation:** This is a workaround. Consider:

1. **Keep as-is:** The workaround works, but document why it's needed
2. **Switch library:** Consider `react-pan-zoom` or `@react-spring/zoom` if issues persist
3. **File issue:** Report to `react-zoom-pan-pinch` maintainers

**Priority:** Important  
**Effort:** Small (documentation) / Medium (library switch)  
**Impact/Effort Ratio:** Medium

---

## 4. Performance Review

### ❌ Critical Issues

#### 4.1 Excessive Re-renders

**Issue:** `DraggableItem` re-renders on every drag event, even with `React.memo`. The custom comparison function (`areEqual`) is complex and may not prevent all unnecessary renders.

**Current Code:**

```typescript
// DraggableItem.tsx:18-40
const areEqual = (prevProps, nextProps) => {
  // 13 property comparisons - runs on every parent re-render
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.x === nextProps.item.x &&
    // ... 11 more comparisons
  );
};
```

**Problems:**

1. **Console logging in production:** Lines 58-60 log on every render
2. **Complex memoization:** The comparison function may miss some cases
3. **Parent re-renders:** `CanvasWithItems` passes new function references

**Recommendation:**

1. **Remove console.log statements** (or use conditional compilation):

```typescript
// Remove all console.log statements or wrap in dev check
if (process.env.NODE_ENV === 'development') {
  console.log('🎨 DraggableItem render', item.id);
}
```

2. **Memoize callbacks in parent:**

```typescript
// CanvasWithItems.tsx
const handleDrag = useCallback((id: string, x: number, y: number) => {
  // ...
}, []); // Already memoized, good

// But ensure all handlers are stable
const handleSelect = useCallback((id: string) => {
  canvasStore.selectItem(id);
}, []); // Use store method instead of hook
```

3. **Use React.memo more effectively:**

```typescript
// Consider splitting DraggableItem into two components:
// - DraggableItemContainer (handles drag logic)
// - DraggableItemContent (pure render, memoized)
```

**Priority:** Critical  
**Effort:** Medium  
**Impact/Effort Ratio:** High

#### 4.2 useEffect Dependencies in DraggableItem

**Issue:** The main `useEffect` in `DraggableItem.tsx` (line 174) has 15 dependencies, causing it to re-run frequently and re-attach event listeners.

**Current Code:**

```typescript
useEffect(() => {
  // This effect runs whenever ANY of these 15 dependencies change
  // That's too many, causing excessive listener attach/detach
}, [isDragging, isRotating, dragState, rotateState, item.id, item.type, item.x, item.y, isSelected, scale, onDrag, onRotate, setIsDragging, setIsHovering, onInteractionStart]);
```

**Recommendation:**

1. **Use refs for stable values:**

```typescript
const onDragRef = useRef(onDrag);
useEffect(() => { onDragRef.current = onDrag; }, [onDrag]);

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    onDragRef.current(item.id, newX, newY);
  };
  // Now onDrag is not a dependency
}, [item.id]); // Only item.id needed
```

2. **Better: Use a drag library** (see section 2.1) which handles this internally

**Priority:** Important  
**Effort:** Medium  
**Impact/Effort Ratio:** High

#### 4.3 Item List Rendering

**Issue:** All items are rendered even when off-screen. No virtualization.

**Current Code:**

```typescript
// CanvasWithItems.tsx:148-160
{items.map((item) => (
  <DraggableItem
    key={item.id}
    item={item}
    // ...
  />
))}
```

**Recommendation:** Add viewport culling (only render items in view):

```typescript
const visibleItems = useMemo(() => {
  // Calculate which items are in viewport
  const viewportBounds = {
    left: -canvasTransform.positionX / canvasTransform.scale,
    right: (window.innerWidth - canvasTransform.positionX) / canvasTransform.scale,
    top: -canvasTransform.positionY / canvasTransform.scale,
    bottom: (window.innerHeight - canvasTransform.positionY) / canvasTransform.scale,
  };
  
  return items.filter(item => {
    const itemRight = item.x + item.width;
    const itemBottom = item.y + item.height;
    return !(
      itemRight < viewportBounds.left ||
      item.x > viewportBounds.right ||
      itemBottom < viewportBounds.top ||
      item.y > viewportBounds.bottom
    );
  });
}, [items, canvasTransform]);

// Render only visible items
{visibleItems.map((item) => (
  <DraggableItem key={item.id} item={item} ... />
))}
```

**Priority:** Nice-to-have (unless performance is poor)  
**Effort:** Medium  
**Impact/Effort Ratio:** Medium (High if many items)

---

## 5. File Organization Review

### ✅ What's Working Well

- **Clear directory structure:** `app/`, `components/`, `hooks/`, `stores/`, `lib/`
- **Logical grouping:** Related files are together
- **Consistent naming:** Files use kebab-case or PascalCase appropriately

### ⚠️ What Needs Improvement

#### 5.1 Component Organization

**Issue:** Some components are tightly coupled but in separate files. Examples:

- `CanvasFoundation.tsx` and `CanvasWithItems.tsx` are tightly coupled
- `DraggableItem.tsx` is 710 lines - too large
- `CanvasControlDock.tsx` is dead code (not imported anywhere)

**Recommendation:**

```
components/
├── canvas/
│   ├── CanvasFoundation.tsx      # Zoom/pan wrapper
│   ├── CanvasContainer.tsx        # Combines Foundation + Items
│   ├── DraggableItem/
│   │   ├── index.tsx              # Main component
│   │   ├── DragHandlers.ts        # Drag logic (if keeping custom)
│   │   └── ItemRenderer.tsx       # Pure render component
│   └── CanvasGrid.tsx             # Grid background component
├── toolbar/
│   ├── ContextualToolbar.tsx      # Main toolbar (remove CanvasControlDock.tsx - it's unused)
│   └── ToolbarButtons.tsx         # Shared button components
└── ...
```

**Priority:** Nice-to-have  
**Effort:** Medium  
**Impact/Effort Ratio:** Medium

#### 5.2 Unused/Dead Code

**Issue:** `Canvas.tsx` appears to be unused (simple placeholder component).

**Recommendation:** Remove if not used, or document its purpose.

**Priority:** Nice-to-have  
**Effort:** Small  
**Impact/Effort Ratio:** Low

#### 5.3 Dead Code: CanvasControlDock

**Issue:** `CanvasControlDock.tsx` is not imported or used anywhere. Only `ContextualToolbar.tsx` is used (in `CanvasWithItems.tsx`). This is dead code that should be removed.

**Recommendation:** Delete `CanvasControlDock.tsx` to reduce confusion and maintenance burden.

**Priority:** Important  
**Effort:** Small  
**Impact/Effort Ratio:** Medium

---

## 6. Dependencies Review

### Current Dependencies

```json
{
  "dependencies": {
    "lucide-react": "^0.562.0",        // ✅ Good - icon library
    "next": "14.2.35",                  // ⚠️  Outdated (latest: 15.x)
    "react": "^18",                     // ✅ Good
    "react-dom": "^18",                 // ✅ Good
    "react-zoom-pan-pinch": "^3.7.0",  // ⚠️  Review needed (scale drift issues)
    "zustand": "^5.0.9"                // ✅ Good - latest version
  }
}
```

### ⚠️ Issues & Recommendations

#### 6.1 Next.js Version

**Issue:** Using Next.js 14.2.35, but 15.x is available with performance improvements.

**Recommendation:** Consider upgrading (test thoroughly first):

```bash
npm install next@latest react@latest react-dom@latest
```

**Priority:** Nice-to-have  
**Effort:** Small (if compatible) / Medium (if breaking changes)  
**Impact/Effort Ratio:** Medium

#### 6.2 Missing Dev Dependencies

**Recommendation:** Add development tools:

```json
{
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    // Add these:
    "@types/node": "^20",              // ✅ Already present
    "prettier": "^3.0.0",              // ⚠️  Missing - code formatting
    "@typescript-eslint/eslint-plugin": "^6.0.0",  // Better TS linting
  }
}
```

**Priority:** Nice-to-have  
**Effort:** Small  
**Impact/Effort Ratio:** Low

#### 6.3 react-zoom-pan-pinch Review

**Issue:** Complex workarounds needed for scale drift suggest library issues.

**Recommendation:** 

1. **Stay with current library:** Add comments explaining workarounds
2. **Alternative libraries to consider:**
   - `react-pan-zoom` (simpler, fewer features)
   - `@react-spring/zoom` (more control, steeper learning curve)
   - Custom implementation (high effort)

**Priority:** Important (if issues persist)  
**Effort:** Large (if switching)  
**Impact/Effort Ratio:** Medium

---

## 7. Code Quality Review

### ✅ What's Working Well

- **TypeScript usage:** Strong typing throughout
- **Consistent code style:** Generally consistent formatting
- **Error handling:** Proper try-catch blocks for localStorage operations
- **Date normalization:** Good handling of Date serialization/deserialization

### ❌ Critical Issues

#### 7.1 Console Logging in Production

**Issue:** 35+ console.log/warn/error statements throughout codebase. Many in hot paths (DraggableItem renders, drag handlers).

**Files with excessive logging:**
- `DraggableItem.tsx`: 15+ console.log statements
- `useCanvasItems.ts`: 1 console.log
- Various files: console.warn/error (acceptable, but should be consistent)

**Recommendation:**

1. **Remove debug console.log statements:**
   - Lines 58-60, 117-118, 188-195, 200-201, 211, 218, 259-275, 283-301 in `DraggableItem.tsx`
   - Line 125 in `useCanvasItems.ts`

2. **Use conditional logging:**

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('🎨 DraggableItem render', item.id);
}
```

3. **Use a logging utility:**

```typescript
// lib/logger.ts
export const logger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};
```

**Priority:** Critical  
**Effort:** Small  
**Impact/Effort Ratio:** Very High

#### 7.2 Code Duplication

**Issue:** Size preset constants duplicated (defined in both `ContextualToolbar.tsx` and potentially elsewhere). Also, `CanvasControlDock.tsx` is dead code.

**Recommendation:** Extract to shared utility:

```typescript
// lib/size-presets.ts
export const SIZE_PRESETS = {
  S: { width: 200, height: 200 },
  M: { width: 300, height: 300 },
  L: { width: 400, height: 400 },
};

export function getActivePreset(item: CanvasItem): 'S' | 'M' | 'L' | null {
  if (item.type === 'song' || item.type === 'gif') return null;
  
  const currentSize = 
    item.type === 'photo' 
      ? item.width 
      : Math.max(item.width, item.height);
  
  if (currentSize <= 250) return 'S';
  if (currentSize <= 350) return 'M';
  return 'L';
}
```

**Priority:** Important  
**Effort:** Small  
**Impact/Effort Ratio:** Medium

#### 7.3 Complex Functions

**Issue:** Some functions are too long/complex:

- `handleMoveUp` in `useCanvasItems.ts` (lines 192-261): 70 lines, deeply nested
- `handleMoveDown` in `useCanvasItems.ts` (lines 264-339): 75 lines, deeply nested
- `DraggableItem` component: 710 lines total

**Recommendation:** Extract helper functions:

```typescript
// useCanvasItems.ts
function findOverlappingItems(
  item: CanvasItem,
  allItems: CanvasItem[],
  itemsOverlap: (a: CanvasItem, b: CanvasItem) => boolean,
  filter: (item: CanvasItem) => boolean
) {
  return allItems
    .filter(i => filter(i) && i.id !== item.id && itemsOverlap(item, i))
    .sort((a, b) => a.zIndex - b.zIndex);
}

const handleMoveUp = useCallback((id: string) => {
  setItems((prev) => {
    const item = prev.find((i) => i.id === id);
    if (!item) return prev;

    const filter = item.type === 'decoration' 
      ? (i: CanvasItem) => i.type === 'decoration'
      : (i: CanvasItem) => i.type !== 'decoration';

    const overlapping = findOverlappingItems(
      item,
      prev,
      itemsOverlap,
      (i) => filter(i) && i.zIndex > item.zIndex
    );

    // ... rest of logic
  });
}, [itemsOverlap]);
```

**Priority:** Nice-to-have  
**Effort:** Medium  
**Impact/Effort Ratio:** Low

---

## Prioritized Refactoring Plan

### Phase 1: Critical Fixes (Do First)

1. **Remove console.log statements** ⚡
   - Priority: Critical
   - Effort: Small (2 hours)
   - Impact: Immediate performance improvement, cleaner code

2. **Migrate drag system to @dnd-kit** ⚡
   - Priority: Critical
   - Effort: Large (2-3 days)
   - Impact: Fixes drag bugs, reduces complexity, improves performance
   - **Start here if drag bugs are blocking users**

3. **Optimize DraggableItem re-renders** ⚡
   - Priority: Critical
   - Effort: Medium (1 day)
   - Impact: Significant performance improvement
   - **Do in parallel with #2 if using library, or after if keeping custom**

### Phase 2: Important Improvements (Do Next)

4. **Remove dead code** (CanvasControlDock.tsx)
   - Priority: Important
   - Effort: Small (5 minutes)
   - Impact: Reduces confusion and maintenance burden

5. **Extract shared utilities** (size presets, logging)
   - Priority: Important
   - Effort: Small (2 hours)
   - Impact: Reduces duplication

6. **Create canvas store** (unify state management)
   - Priority: Important
   - Effort: Medium (1 day)
   - Impact: Better state management, easier debugging

7. **Fix rotation coordinate transformation**
   - Priority: Important
   - Effort: Medium (4 hours)
   - Impact: Fixes rotation bugs

### Phase 3: Nice-to-Haves (Polish)

8. **Add viewport culling** (virtualization)
   - Priority: Nice-to-have
   - Effort: Medium (1 day)
   - Impact: Performance improvement with many items

9. **Refactor complex functions** (extract helpers)
   - Priority: Nice-to-have
   - Effort: Medium (1 day)
   - Impact: Better code maintainability

10. **Reorganize component structure** (group by feature)
    - Priority: Nice-to-have
    - Effort: Medium (4 hours)
    - Impact: Better code organization

11. **Upgrade Next.js** (if compatible)
    - Priority: Nice-to-have
    - Effort: Small/Medium (4 hours)
    - Impact: Latest features and performance improvements

12. **Remove duplicate type definitions**
    - Priority: Nice-to-have
    - Effort: Small (1 hour)
    - Impact: Cleaner types

---

## Quick Wins (Do These First)

These can be done immediately with high impact:

1. **Remove console.log statements** (30 minutes)
2. **Extract SIZE_PRESETS constant** (15 minutes)
3. **Add conditional logging utility** (30 minutes)
4. **Remove unused/dead code** (Canvas.tsx, CanvasControlDock.tsx) (10 minutes)
5. **Fix TypeScript duplicate CanvasItem** (15 minutes)

**Total time: ~2 hours for significant code quality improvement**

---

## Recommended Migration Path

### If Drag Bugs Are Critical:

1. **Week 1:** Remove console.log, extract utilities (quick wins)
2. **Week 2-3:** Migrate to @dnd-kit, fix rotation
3. **Week 4:** Optimize performance, add viewport culling
4. **Week 5:** Refactor and polish

### If Drag Works But Performance Is Issue:

1. **Week 1:** Remove console.log, optimize re-renders
2. **Week 2:** Add viewport culling, extract utilities
3. **Week 3:** Create canvas store, consolidate components
4. **Week 4:** Consider drag library migration (if time permits)

---

## Metrics to Track

After refactoring, measure:

1. **Performance:**
   - Render time for 100 items
   - Drag latency (time from mouse move to item update)
   - Memory usage

2. **Code Quality:**
   - Cyclomatic complexity (target: < 10 per function)
   - File length (target: < 300 lines)
   - Test coverage (if adding tests)

3. **User Experience:**
   - Drag bugs (should be zero)
   - Rotation accuracy
   - Grid alignment

---

## Conclusion

The codebase has a solid foundation with good TypeScript usage and thoughtful architecture. The main issues are:

1. **Custom drag implementation** causing bugs and complexity
2. **Performance issues** from excessive re-renders and logging
3. **Code organization** opportunities for better maintainability

**Recommended immediate actions:**
1. Remove console.log statements (quick win)
2. Migrate drag system to @dnd-kit (fixes bugs)
3. Optimize re-renders (improves performance)

The refactoring plan above prioritizes by impact/effort ratio, focusing on drag stability and performance first, then code organization.

