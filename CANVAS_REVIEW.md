# Canvas & Draggable Items - Performance & UX Review

## 🎯 Goal: FigJam-Level Smoothness

This document outlines improvements needed to achieve FigJam-level smoothness and polish.

---

## 🚀 Critical Performance Improvements

### 1. **Use requestAnimationFrame for Drag/Rotate Updates**
**Current Issue:** Direct state updates during drag cause janky movement
**Solution:** Batch updates using `requestAnimationFrame`

```typescript
// In DraggableItem.tsx - Replace direct onDrag/onRotate calls with RAF
const rafRef = useRef<number | null>(null);
const pendingUpdateRef = useRef<{ type: 'drag' | 'rotate', data: any } | null>(null);

const scheduleUpdate = useCallback(() => {
  if (rafRef.current) return; // Already scheduled
  
  rafRef.current = requestAnimationFrame(() => {
    if (pendingUpdateRef.current) {
      if (pendingUpdateRef.current.type === 'drag') {
        onDrag(item.id, pendingUpdateRef.current.data.x, pendingUpdateRef.current.data.y);
      } else {
        onRotate(item.id, pendingUpdateRef.current.data.rotation);
      }
      pendingUpdateRef.current = null;
    }
    rafRef.current = null;
  });
}, [item.id, onDrag, onRotate]);
```

### 2. **Optimize Re-renders with Better Memoization**
**Current Issue:** All items re-render when any item changes
**Solution:** 
- Use `React.memo` with custom comparison function
- Memoize expensive calculations
- Use refs for frequently updated values

```typescript
// Custom comparison for DraggableItem
const areEqual = (prevProps: DraggableItemProps, nextProps: DraggableItemProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.x === nextProps.item.x &&
    prevProps.item.y === nextProps.item.y &&
    prevProps.item.rotation === nextProps.item.rotation &&
    prevProps.item.zIndex === nextProps.item.zIndex &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.scale === nextProps.scale
  );
};

export default React.memo(DraggableItem, areEqual);
```

### 3. **Debounce Canvas Transform Updates**
**Current Issue:** Transform updates trigger too many re-renders
**Solution:** Debounce `onTransformChange` callback

```typescript
// In CanvasFoundation.tsx
const debouncedTransformChange = useMemo(
  () => debounce((scale: number, x: number, y: number) => {
    onTransformChange?.(scale, x, y);
  }, 100),
  [onTransformChange]
);
```

### 4. **Virtual Scrolling for Large Item Lists**
**Future:** If canvas has 100+ items, implement virtualization
**Solution:** Use `react-window` or `react-virtualized` to only render visible items

---

## ✨ UX Enhancements

### 1. **Smooth Selection Animations**
**Current Issue:** Selection appears instantly, feels abrupt
**Solution:** Add CSS transitions and scale animations

```typescript
// In DraggableItem.tsx - Add selection animation
const selectionStyle = {
  transition: isSelected 
    ? 'box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
    : 'box-shadow 0.2s ease, transform 0.2s ease',
  transform: `${baseTransform} translateY(${lift}px) scale(${isSelected ? 1.02 : 1})`,
};
```

### 2. **Drag Preview/Ghost**
**Current Issue:** No visual feedback during drag
**Solution:** Show semi-transparent clone while dragging

```typescript
// Add drag ghost element
{isDragging && (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${item.width}px`,
      height: `${item.height}px`,
      transform: baseTransform,
      opacity: 0.5,
      pointerEvents: 'none',
      zIndex: 9999,
    }}
  >
    {/* Clone of item content */}
  </div>
)}
```

### 3. **Multi-Select Support**
**Current Issue:** Can only select one item at a time
**Solution:** Add shift+click and drag selection box

```typescript
// Add to useCanvasItems hook
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const handleSelect = useCallback((id: string, multiSelect: boolean = false) => {
  if (multiSelect) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  } else {
    setSelectedIds(new Set([id]));
  }
}, []);
```

### 4. **Snap-to-Grid & Alignment Guides**
**Current Issue:** No visual feedback for alignment
**Solution:** Show alignment guides when items are near each other

```typescript
// Add alignment detection
const getAlignmentGuides = (item: CanvasItem, allItems: CanvasItem[]) => {
  const guides: Array<{ type: 'x' | 'y', position: number }> = [];
  const threshold = 5;
  
  allItems.forEach(other => {
    if (other.id === item.id) return;
    
    // Check horizontal alignment
    if (Math.abs(item.y - other.y) < threshold) {
      guides.push({ type: 'y', position: item.y });
    }
    
    // Check vertical alignment
    if (Math.abs(item.x - other.x) < threshold) {
      guides.push({ type: 'x', position: item.x });
    }
  });
  
  return guides;
};
```

### 5. **Better Rotation Handles**
**Current Issue:** Handles are small and hard to see
**Solution:** 
- Larger handles (24px instead of 20px)
- Show rotation angle indicator
- Add rotation snap (15° increments with Shift)

```typescript
// Enhanced rotation with snapping
const handleRotate = (newRotation: number, snap: boolean = false) => {
  if (snap) {
    const snapAngle = 15;
    newRotation = Math.round(newRotation / snapAngle) * snapAngle;
  }
  onRotate(item.id, newRotation);
};
```

### 6. **Keyboard Shortcuts**
**Current Issue:** Limited keyboard support
**Solution:** Add comprehensive shortcuts

```typescript
// Add to CanvasWithItems
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete selected
    } else if (e.key === 'Escape') {
      // Deselect all
    } else if (e.key === 'ArrowUp' && e.shiftKey) {
      // Move up
    } else if (e.key === 'ArrowDown' && e.shiftKey) {
      // Move down
    } else if (e.key === 'ArrowLeft' && e.shiftKey) {
      // Move left
    } else if (e.key === 'ArrowRight' && e.shiftKey) {
      // Move right
    } else if (e.key === 'r' && selectedId) {
      // Rotate 90°
    } else if (e.key === 'd' && e.metaKey) {
      // Duplicate
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedId]);
```

### 7. **Undo/Redo System**
**Current Issue:** No way to undo actions
**Solution:** Implement command pattern with history

```typescript
// Create useUndoRedo hook
interface HistoryState {
  items: CanvasItem[];
  selectedId: string | null;
}

const useUndoRedo = (initialState: HistoryState) => {
  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return history[currentIndex - 1];
    }
  }, [currentIndex, history]);
  
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return history[currentIndex + 1];
    }
  }, [currentIndex, history]);
  
  const pushState = useCallback((state: HistoryState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex]);
  
  return { undo, redo, pushState, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
};
```

---

## 🎨 Visual Polish

### 1. **Smoother Cursor Transitions**
**Current Issue:** Cursor changes feel abrupt
**Solution:** Add CSS transitions

```css
.draggable-item {
  cursor: grab;
  transition: cursor 0.1s ease;
}

.draggable-item:active {
  cursor: grabbing;
}

.draggable-item.rotating {
  cursor: crosshair;
}
```

### 2. **Better Selection Outline**
**Current Issue:** Simple blue border
**Solution:** Add animated dashed border with glow

```typescript
const selectionOutline = {
  position: 'absolute',
  inset: '-4px',
  border: '2px dashed #3b82f6',
  borderRadius: '6px',
  pointerEvents: 'none',
  boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.1), 0 0 8px rgba(59, 130, 246, 0.2)',
  animation: 'dash 1s linear infinite',
};

// Add CSS animation
@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}
```

### 3. **Hover States for All Interactive Elements**
**Current Issue:** Limited hover feedback
**Solution:** Add subtle hover effects to all interactive elements

### 4. **Loading States**
**Current Issue:** No feedback during operations
**Solution:** Add subtle loading indicators for async operations

---

## 🔧 Interaction Improvements

### 1. **Prevent Canvas Pan During Item Drag**
**Current Issue:** Canvas might pan while dragging items
**Solution:** Ensure `e.stopPropagation()` is called correctly

```typescript
// In DraggableItem handleMouseDown
e.stopPropagation(); // Already done, but ensure it's working
e.preventDefault();
```

### 2. **Click vs Drag Detection**
**Current Issue:** No distinction between click and drag
**Solution:** Add threshold before starting drag

```typescript
const DRAG_THRESHOLD = 5; // pixels

const handleMouseDown = (e: React.MouseEvent) => {
  const startX = e.clientX;
  const startY = e.clientY;
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = Math.abs(moveEvent.clientX - startX);
    const deltaY = Math.abs(moveEvent.clientY - startY);
    
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      // Start drag
    } else {
      // Just a click
    }
  };
};
```

### 3. **Better Rotation Center Calculation**
**Current Issue:** Rotation center might be off for rotated items
**Solution:** Calculate center from item's actual position, not bounding rect

```typescript
// Calculate actual center accounting for rotation
const getItemCenter = (item: CanvasItem) => {
  return {
    x: item.x + item.width / 2,
    y: item.y + item.height / 2,
  };
};
```

### 4. **Constrain Drag to Canvas Bounds (Optional)**
**Current Issue:** Items can be dragged off canvas
**Solution:** Add optional boundary constraints

```typescript
const constrainPosition = (x: number, y: number, item: CanvasItem) => {
  const minX = 0;
  const minY = 0;
  const maxX = 10000 - item.width;
  const maxY = 10000 - item.height;
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
};
```

---

## 📊 Performance Monitoring

### 1. **Add Performance Metrics**
**Solution:** Track FPS and render times

```typescript
// Add performance monitoring
const usePerformanceMonitor = () => {
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        console.log('FPS:', fps);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }, []);
};
```

---

## 🎯 Priority Implementation Order

1. **High Priority (Immediate Impact):**
   - ✅ Use requestAnimationFrame for drag/rotate
   - ✅ Better memoization
   - ✅ Smooth selection animations
   - ✅ Click vs drag detection

2. **Medium Priority (Significant UX Improvement):**
   - ✅ Multi-select support
   - ✅ Keyboard shortcuts
   - ✅ Better rotation handles
   - ✅ Undo/redo system

3. **Low Priority (Nice to Have):**
   - ✅ Snap-to-grid & alignment guides
   - ✅ Drag preview/ghost
   - ✅ Virtual scrolling
   - ✅ Performance monitoring

---

## 📝 Code Quality Improvements

### 1. **Extract Constants**
```typescript
// Create constants file
export const CANVAS_CONSTANTS = {
  DRAG_THRESHOLD: 5,
  ROTATION_SNAP_ANGLE: 15,
  ALIGNMENT_THRESHOLD: 5,
  SELECTION_LIFT: -4,
  ROTATION_HANDLE_SIZE: 24,
};
```

### 2. **Better Type Safety**
```typescript
// Add stricter types
type InteractionMode = 'idle' | 'dragging' | 'rotating' | 'selecting';
type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
```

### 3. **Error Boundaries**
```typescript
// Add error boundary for canvas
class CanvasErrorBoundary extends React.Component {
  // Implementation
}
```

---

## 🧪 Testing Recommendations

1. **Performance Testing:**
   - Test with 100+ items
   - Test with rapid drag operations
   - Test with high zoom levels

2. **Interaction Testing:**
   - Test drag/rotate with different zoom levels
   - Test multi-select scenarios
   - Test keyboard shortcuts

3. **Edge Cases:**
   - Very small items
   - Very large items
   - Items at canvas boundaries
   - Rapid selection/deselection

---

## 🚀 Quick Wins (Can Implement Immediately)

1. **Add requestAnimationFrame** - Biggest performance win
2. **Smooth selection animations** - Immediate visual improvement
3. **Better rotation handles** - Better UX
4. **Keyboard shortcuts** - Power user feature
5. **Click vs drag detection** - Better interaction

---

## 📚 References

- FigJam interaction patterns
- React performance best practices
- Canvas interaction design patterns
- requestAnimationFrame optimization

