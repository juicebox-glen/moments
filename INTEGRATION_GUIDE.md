# Canvas Items Integration Guide

## Complete Implementation

This guide provides the complete code for placing, dragging, rotating, selecting, and deleting objects on the canvas.

## Files Created

1. **`lib/canvas-item-types.ts`** - TypeScript types for canvas items
2. **`components/DraggableItem.tsx`** - Main draggable/rotatable item component
3. **`hooks/useCanvasItems.ts`** - Hook for managing canvas items state
4. **`components/CanvasWithItems.tsx`** - Wrapper component that integrates items with canvas

## Dependencies

```bash
npm install lucide-react
```

## Implementation Details

### 1. Drag Functionality

**Library:** None - uses native mouse events

**How it works:**
- `onMouseDown` captures start position
- `mousemove` calculates delta and updates position
- Delta is divided by `scale` to account for zoom
- `e.stopPropagation()` prevents canvas pan during drag
- No bounds - items can be dragged anywhere

**Code location:** `components/DraggableItem.tsx` - `handleMouseDown` and drag effect

### 2. Rotate Functionality

**Trigger:** Drag near corner when item is selected

**How it works:**
- `checkCornerType` detects if mouse is within threshold of corner
- Threshold scales with zoom: `40 / scale` pixels
- Rotation angle calculated using `Math.atan2` from center to mouse
- Continuous rotation (no snapping)
- Visual indicator (blue dot) appears at corner when hovering

**Code location:** `components/DraggableItem.tsx` - `checkCornerType` and rotate effect

### 3. Selection

**Trigger:** `onMouseDown` on item

**Visual:**
- Lift effect: `-4px` translateY
- Enhanced shadow
- Blue border outline (2px solid)
- Blue rotation handle indicator at top-right corner

**State management:** `useCanvasItems` hook manages `selectedId`

**Deselect:** Click empty canvas or another item

**Code location:** 
- Selection logic: `hooks/useCanvasItems.ts` - `handleSelect`
- Visual: `components/DraggableItem.tsx` - selection styles

### 4. Delete

**Button visibility:** Only when item is selected

**Position:** Top-left corner (-12px offset)

**Trigger:** Click delete button or Delete/Backspace key

**Code location:** 
- Button: `components/DraggableItem.tsx` - delete button JSX
- Handler: `hooks/useCanvasItems.ts` - `handleDelete`
- Keyboard: `components/CanvasWithItems.tsx` - keyboard handler

### 5. Z-Index Management

**Storage:** Stored in `item.zIndex` property

**Auto-increment:** New items get `max(zIndex) + 1`

**Bring to front:** Selecting an item updates its z-index to highest value

**Code location:** `hooks/useCanvasItems.ts` - `handleSelect` and `getNextZIndex`

### 6. Item Positioning

**Coordinates:** Absolute canvas coordinates (pixels)

**Storage:** `item.x` and `item.y` properties

**Transform:** Applied via CSS `transform: translate(x, y) rotate(deg)`

**Zoom interaction:** Drag delta divided by scale to maintain correct position

**Code location:** `components/DraggableItem.tsx` - transform style

## Usage Example

### Basic Integration

```typescript
import CanvasWithItems from '@/components/CanvasWithItems';
import { CanvasItem } from '@/lib/canvas-item-types';

export default function ChapterPage() {
  const [items, setItems] = useState<CanvasItem[]>([]);

  return (
    <div>
      <CanvasTopBar chapter={chapter} />
      <CanvasWithItems
        initialItems={items}
        onItemsChange={setItems}
      />
    </div>
  );
}
```

### Adding Items Programmatically

```typescript
import { useCanvasItems } from '@/hooks/useCanvasItems';

function MyComponent() {
  const { addItem } = useCanvasItems();

  const handleAddColorBlock = () => {
    addItem({
      type: 'color',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      color: '#ff69b4',
    });
  };

  return <button onClick={handleAddColorBlock}>Add Color Block</button>;
}
```

### Item Types

```typescript
// Color block
{
  type: 'color',
  color: '#ff69b4',
  x: 100,
  y: 100,
  width: 200,
  height: 200,
  rotation: 0,
}

// Photo
{
  type: 'photo',
  imageUrl: 'https://example.com/image.jpg',
  x: 200,
  y: 200,
  width: 300,
  height: 300,
  rotation: 15,
}

// Note
{
  type: 'note',
  content: 'Hello world',
  x: 300,
  y: 300,
  width: 250,
  height: 150,
  rotation: -5,
}
```

## Coordinate System

- **Absolute coordinates** - `x` and `y` are in canvas space (pixels)
- **No transformation needed** - React handles rendering
- **Viewport center calculation** (if needed):
  ```typescript
  const canvasX = (window.innerWidth / 2 - positionX) / scale;
  const canvasY = (window.innerHeight / 2 - positionY) / scale;
  ```

## Performance Optimizations

- **Memoization** - `DraggableItem` is memoized with `React.memo`
- **Throttled cursor updates** - ~60fps (16ms throttle)
- **Cleanup listeners** - Properly removes event listeners on unmount
- **Transition disabled during drag** - Smooth dragging without lag

## Customization

### Change selection visual

Modify in `DraggableItem.tsx`:
```typescript
const lift = isSelected ? -4 : 0; // Change -4 to adjust lift
const boxShadow = isSelected
  ? '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)'
  : '0 2px 8px rgba(0, 0, 0, 0.1)';
```

### Change rotation threshold

Modify in `DraggableItem.tsx`:
```typescript
const threshold = 40 / scale; // Change 40 to adjust sensitivity
```

### Add rotation snapping

Modify `handleRotateMove` in drag effect:
```typescript
const snappedRotation = Math.round((startRotation + deltaAngle) / 15) * 15;
onRotate(item.id, snappedRotation);
```

## Troubleshooting

**Items not dragging:**
- Check `scale` prop is being passed correctly
- Ensure `onDrag` callback is connected
- Verify `disabled` prop is not true

**Rotation not working:**
- Ensure item is selected (rotation only works when selected)
- Check `scale` prop is correct (affects threshold)
- Verify `onRotate` callback is connected

**Selection not working:**
- Check `onSelect` callback is connected
- Verify `isSelected` prop is calculated correctly
- Ensure `e.stopPropagation()` is called

**Z-index issues:**
- Verify `handleSelect` updates z-index
- Check items have unique z-index values
- Ensure z-index is applied via CSS

