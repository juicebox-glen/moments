# Chapters - Project Setup & Architecture

## Project Structure

```
moments/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Inter font
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles with brand colors
├── lib/                    # Core utilities and types
│   ├── types.ts           # TypeScript interfaces (Chapter, CanvasItem, etc.)
│   └── mock-data.ts       # Sample chapters for development
├── components/             # React components (to be created)
├── hooks/                  # Custom React hooks (to be created)
└── stores/                 # State management (to be created)
```

## State Management Approach

**Decision: Zustand**

For this project, we'll use **Zustand** for state management because:

1. **Lightweight**: Minimal boilerplate, perfect for a memory authoring app
2. **TypeScript-first**: Excellent TypeScript support out of the box
3. **Simple API**: Easy to understand and maintain
4. **Scalable**: Can grow with the app without becoming unwieldy
5. **No Context overhead**: More performant than React Context for frequently updated state

### Planned Store Structure

```
stores/
├── chapter-store.ts       # Main chapters state (CRUD operations)
├── canvas-store.ts        # Canvas state (items, selection, etc.)
└── ui-store.ts            # UI state (modals, sidebar, etc.)
```

### Alternative Considered: React Context
- Rejected because: Context can cause unnecessary re-renders, especially with hierarchical chapter data
- Zustand provides better performance and developer experience for this use case

## Design Philosophy

- **Warm, tactile, editorial aesthetic** - Not a productivity tool
- **Calm and human** - Not technical
- **Brand colors**:
  - Background: `#FAFAF8` (warm off-white)
  - Grid/borders: `#EEEEEB` (subtle neutral)
- **Typography**: Inter font family

## Data Model

### Chapter Types
- **Moment**: Single day/occasion (wedding, trip, birthday)
- **Era**: Extended period (band years, friendship group, college)

### Hierarchy
- Moments can belong to Eras (`parentEra` field)
- Eras can contain multiple Moments (`childMoments` array)

### Canvas Items
- Future support for placing items on a canvas
- Each item has position (x, y), rotation, and scale

## Next Steps

1. Install Zustand: `npm install zustand`
2. Create store structure
3. Build UI components
4. Implement chapter CRUD operations
5. Add canvas functionality

