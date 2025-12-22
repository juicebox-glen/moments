'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// LocalStorage keys
const STORAGE_KEYS = {
  SCALE: 'canvas-scale',
  POSITION_X: 'canvas-position-x',
  POSITION_Y: 'canvas-position-y',
};

// Helper functions for localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

interface CanvasFoundationProps {
  children?: React.ReactNode | ((props: { scale: number; positionX: number; positionY: number }) => React.ReactNode);
  onCanvasClick?: (e: React.MouseEvent) => void;
  onTransformChange?: (scale: number, positionX: number, positionY: number) => void;
}

export default function CanvasFoundation({ children, onCanvasClick, onTransformChange }: CanvasFoundationProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Default values
  const DEFAULT_SCALE = 1;
  const DEFAULT_POSITION_X = -4500;
  const DEFAULT_POSITION_Y = -4500;

  // Track transform state in refs to avoid constant re-renders
  const currentScaleRef = useRef(DEFAULT_SCALE);
  const currentPositionXRef = useRef(DEFAULT_POSITION_X);
  const currentPositionYRef = useRef(DEFAULT_POSITION_Y);
  const throttleRef = useRef<number>(0);
  const isZoomingRef = useRef(false);
  const isPanningRef = useRef(false); // Track when we're panning to prevent scale drift
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasHydratedRef = useRef(false);
  const panningEndTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined); // Track timeout to clear it when new pan starts

  // For UI display (toolbar) - only update when actually needed (throttled)
  // This state is used to trigger re-renders for the toolbar, even though the toolbar reads from refs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentScale, setCurrentScale] = useState(DEFAULT_SCALE);
  
  // Separate state for grid background scale (position is static, transform handles movement)
  const [gridScale, setGridScale] = useState(DEFAULT_SCALE);

  // Load from localStorage after hydration
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    // Load saved state from localStorage
    const savedScale = loadFromStorage(STORAGE_KEYS.SCALE, DEFAULT_SCALE);
    const savedPositionX = loadFromStorage(STORAGE_KEYS.POSITION_X, DEFAULT_POSITION_X);
    const savedPositionY = loadFromStorage(STORAGE_KEYS.POSITION_Y, DEFAULT_POSITION_Y);

    // Update refs
    currentScaleRef.current = savedScale;
    currentPositionXRef.current = savedPositionX;
    currentPositionYRef.current = savedPositionY;

    // Update state
    setCurrentScale(savedScale);
    setGridScale(savedScale);

    // Update TransformWrapper to saved position
    if (transformRef.current) {
      transformRef.current.setTransform(savedPositionX, savedPositionY, savedScale, 0);
    }
  }, [DEFAULT_SCALE, DEFAULT_POSITION_X, DEFAULT_POSITION_Y]);

  // Debounced function to save viewport state
  const saveViewportState = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(STORAGE_KEYS.SCALE, currentScaleRef.current);
      saveToStorage(STORAGE_KEYS.POSITION_X, currentPositionXRef.current);
      saveToStorage(STORAGE_KEYS.POSITION_Y, currentPositionYRef.current);
    }, 500);
  }, []);

  // Custom wheel handler for trackpad panning (2-finger drag = pan, not zoom)
  // Optimized for smoothness matching 3-finger drag feel
  useEffect(() => {
    if (!transformRef.current) return;

    // Sensitivity multiplier to match 3-finger drag distance
    // Higher value = more distance covered per gesture (more natural feel)
    const PAN_SENSITIVITY = 2.5;

    let rafId: number | null = null;
    let pendingDeltaX = 0;
    let pendingDeltaY = 0;
    let isUpdating = false;

    const applyPan = () => {
      if (pendingDeltaX === 0 && pendingDeltaY === 0) {
        isUpdating = false;
        return;
      }

      // Get current transform state
      const currentX = currentPositionXRef.current;
      const currentY = currentPositionYRef.current;
      const currentScale = currentScaleRef.current;

      // Apply accumulated deltas with sensitivity multiplier
      // Negative because wheel direction is opposite to pan direction
      const newX = currentX - (pendingDeltaX * PAN_SENSITIVITY);
      const newY = currentY - (pendingDeltaY * PAN_SENSITIVITY);

      // Reset pending deltas
      pendingDeltaX = 0;
      pendingDeltaY = 0;

      // Update refs immediately
      currentPositionXRef.current = newX;
      currentPositionYRef.current = newY;
      // IMPORTANT: Keep scale ref in sync to prevent zoom drift
      currentScaleRef.current = currentScale;

      // Update grid scale (position is static, transform handles movement)
      setGridScale(currentScale);

      // Apply transform (no animation for smooth panning)
      // CRITICAL: Explicitly preserve scale to prevent zoom changes during pan
      if (transformRef.current) {
        // Force scale to be exactly what we expect (prevent any drift)
        transformRef.current.setTransform(newX, newY, currentScale, 0);
        // Immediately verify and correct if needed (defensive)
        const actualState = transformRef.current.state;
        if (actualState && Math.abs(actualState.scale - currentScale) > 0.001) {
          // Scale still drifted, force it again
          transformRef.current.setTransform(newX, newY, currentScale, 0);
        }
      }

      // Notify parent of transform changes
      onTransformChange?.(currentScale, newX, newY);

      // Schedule next update if there's more pending
      if (pendingDeltaX !== 0 || pendingDeltaY !== 0) {
        rafId = requestAnimationFrame(applyPan);
      } else {
        isUpdating = false;
        // Save state after panning stops
        saveViewportState();
        // Mark panning as complete
        handleWheelEnd();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Only handle if wheel is being used for panning (trackpad drag)
      // Wheel events with deltaX/deltaY are trackpad pan gestures
      if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Clear any existing panning end timeout to prevent interference
        if (panningEndTimeoutRef.current) {
          clearTimeout(panningEndTimeoutRef.current);
          panningEndTimeoutRef.current = undefined;
        }
        // Mark as panning to prevent scale changes
        isPanningRef.current = true;

        // Accumulate deltas for smooth batching
        pendingDeltaX += e.deltaX;
        pendingDeltaY += e.deltaY;

        // Start update loop if not already running
        if (!isUpdating) {
          isUpdating = true;
          rafId = requestAnimationFrame(applyPan);
        }
      }
    };

    const handleWheelEnd = () => {
      // Clear any existing timeout to prevent interference
      if (panningEndTimeoutRef.current) {
        clearTimeout(panningEndTimeoutRef.current);
        panningEndTimeoutRef.current = undefined;
      }
      // Small delay to ensure all pan operations complete
      panningEndTimeoutRef.current = setTimeout(() => {
        isPanningRef.current = false;
        panningEndTimeoutRef.current = undefined;
      }, 100);
    };

    // Add wheel listener to the canvas container
    const container = document.querySelector('[data-canvas-container]') as HTMLElement;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      // Also listen for mouseup to detect when panning ends (for mouse drag panning)
      const handleMouseUp = () => {
        if (isPanningRef.current) {
          // Clear any existing timeout to prevent interference
          if (panningEndTimeoutRef.current) {
            clearTimeout(panningEndTimeoutRef.current);
            panningEndTimeoutRef.current = undefined;
          }
          // Small delay to ensure all pan operations complete
          panningEndTimeoutRef.current = setTimeout(() => {
            isPanningRef.current = false;
            panningEndTimeoutRef.current = undefined;
          }, 100);
        }
      };
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        container.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mouseup', handleMouseUp);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        // Clear any pending panning end timeout on cleanup
        if (panningEndTimeoutRef.current) {
          clearTimeout(panningEndTimeoutRef.current);
          panningEndTimeoutRef.current = undefined;
        }
      };
    }
  }, [saveViewportState, onTransformChange]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCanvasClick?.(e);
    }
  };


  return (
    <div className="w-full h-full relative overflow-hidden bg-[#F8F2EA]" data-canvas-container>
      <TransformWrapper
        ref={transformRef}
        initialScale={DEFAULT_SCALE}
        minScale={0.5}
        maxScale={1}
        limitToBounds={false}
        centerOnInit={false}
        disablePadding={true}
        initialPositionX={DEFAULT_POSITION_X}
        initialPositionY={DEFAULT_POSITION_Y}
        wheel={{ disabled: true }}  // Disable wheel zoom - we'll handle panning manually
        panning={{ 
          disabled: false,
          velocityDisabled: true 
        }}
        doubleClick={{ disabled: true }}
        onPanningStart={() => {
          // Clear any existing panning end timeout to prevent interference
          if (panningEndTimeoutRef.current) {
            clearTimeout(panningEndTimeoutRef.current);
            panningEndTimeoutRef.current = undefined;
          }
          // Track when library's panning starts (mouse drag)
          isPanningRef.current = true;
        }}
        onPanningStop={() => {
          // Clear any existing timeout to prevent interference
          if (panningEndTimeoutRef.current) {
            clearTimeout(panningEndTimeoutRef.current);
            panningEndTimeoutRef.current = undefined;
          }
          // Mark panning as complete after a short delay
          panningEndTimeoutRef.current = setTimeout(() => {
            isPanningRef.current = false;
            panningEndTimeoutRef.current = undefined;
          }, 100);
        }}
        onTransformed={(ref) => {
          // CRITICAL: During panning, lock scale to prevent zoom drift
          let scaleToUse = ref.state.scale;
          if (isPanningRef.current && !isZoomingRef.current) {
            const expectedScale = currentScaleRef.current;
            // If scale changed during panning, force it back immediately
            if (Math.abs(ref.state.scale - expectedScale) > 0.001) {
              // Scale drifted - correct it immediately by calling setTransform with locked scale
              if (transformRef.current) {
                transformRef.current.setTransform(
                  ref.state.positionX,
                  ref.state.positionY,
                  expectedScale,
                  0
                );
                // Use expected scale for this update cycle
                scaleToUse = expectedScale;
              }
            }
          }

          // ALWAYS update refs immediately (even when correcting scale drift)
          currentScaleRef.current = scaleToUse;
          currentPositionXRef.current = ref.state.positionX;
          currentPositionYRef.current = ref.state.positionY;

          // Update grid scale
          setGridScale(scaleToUse);

          // Grid background is static (0,0) - transform handles movement
          // Just update scale for grid sizing
          // No need to update gridPosition since backgroundPosition is static

          // Save viewport state to localStorage (debounced)
          saveViewportState();

          // ALWAYS notify parent of transform changes (even when correcting scale drift)
          onTransformChange?.(currentScaleRef.current, currentPositionXRef.current, currentPositionYRef.current);

          // Skip state updates during programmatic zoom animations to avoid mid-animation percentages
          if (isZoomingRef.current) return;

          // Update scale for UI display (throttled) - triggers toolbar re-render
          const now = Date.now();
          if (now - throttleRef.current > 100) {
            throttleRef.current = now;
            setCurrentScale(currentScaleRef.current);
          }
        }}
      >
        {({ setTransform }) => {
          // Discrete zoom levels: 50%, 75%, 100%
          const ZOOM_LEVELS = [0.5, 0.75, 1.0];

          // Use ref for accurate current zoom level (not throttled state)
          const actualScale = currentScaleRef.current;

          // Round scale to 2 decimal places to avoid floating point precision issues
          const roundedScale = Math.round(actualScale * 100) / 100;

          // Find closest zoom level to current scale
          const currentZoomIndex = ZOOM_LEVELS.reduce((closestIdx, level, idx) => {
            const currentDiff = Math.abs(ZOOM_LEVELS[closestIdx] - roundedScale);
            const newDiff = Math.abs(level - roundedScale);
            return newDiff < currentDiff ? idx : closestIdx;
          }, 0);

          const zoomPercentage = Math.round(ZOOM_LEVELS[currentZoomIndex] * 100);
          const canZoomIn = currentZoomIndex < ZOOM_LEVELS.length - 1;
          const canZoomOut = currentZoomIndex > 0;

          const zoomTo = (targetScale: number, duration = 0) => {
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;

            // Keep the canvas point currently at the viewport center fixed while scaling
            const canvasCenterX = (viewportCenterX - currentPositionXRef.current) / currentScaleRef.current;
            const canvasCenterY = (viewportCenterY - currentPositionYRef.current) / currentScaleRef.current;

            const newPositionX = viewportCenterX - (canvasCenterX * targetScale);
            const newPositionY = viewportCenterY - (canvasCenterY * targetScale);

            currentScaleRef.current = targetScale;
            currentPositionXRef.current = newPositionX;
            currentPositionYRef.current = newPositionY;

            // Mark as animating to avoid mid-animation state overrides
            isZoomingRef.current = duration > 0;

            // Apply transform (allow animation when duration > 0)
            setTransform(newPositionX, newPositionY, targetScale, duration, 'easeOut');

            // Immediately set display scale so toolbar shows target value
            setCurrentScale(targetScale);
            // Update grid scale (position is static)
            setGridScale(targetScale);

            if (duration > 0) {
              // Ensure we end on the exact target scale/position after animation
              setTimeout(() => {
                currentScaleRef.current = targetScale;
                currentPositionXRef.current = newPositionX;
                currentPositionYRef.current = newPositionY;
                setCurrentScale(targetScale);
                setGridScale(targetScale);
                isZoomingRef.current = false;
              }, duration + 30);
            } else {
              isZoomingRef.current = false;
            }
          };

          const handleZoomIn = () => {
            if (canZoomIn) {
              zoomTo(ZOOM_LEVELS[currentZoomIndex + 1], 200);
            }
          };

          const handleZoomOut = () => {
            if (canZoomOut) {
              zoomTo(ZOOM_LEVELS[currentZoomIndex - 1], 200);
            }
          };

          const handleResetZoom = () => {
            // Reset to 100% zoom centered on current viewport (same as zoom in/out)
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;

            // Keep the canvas point currently at the viewport center fixed while scaling
            const canvasCenterX = (viewportCenterX - currentPositionXRef.current) / currentScaleRef.current;
            const canvasCenterY = (viewportCenterY - currentPositionYRef.current) / currentScaleRef.current;

            const targetScale = 1.0;
            const newPositionX = viewportCenterX - (canvasCenterX * targetScale);
            const newPositionY = viewportCenterY - (canvasCenterY * targetScale);

            currentScaleRef.current = targetScale;
            currentPositionXRef.current = newPositionX;
            currentPositionYRef.current = newPositionY;

            // Mark as animating to avoid mid-animation state overrides
            isZoomingRef.current = true;

            // Apply transform with animation
            setTransform(newPositionX, newPositionY, targetScale, 200, 'easeOut');

            // Immediately set display scale so toolbar shows target value
            setCurrentScale(targetScale);
            setGridScale(targetScale);

            // Ensure we end on the exact target scale/position after animation
            setTimeout(() => {
              currentScaleRef.current = targetScale;
              currentPositionXRef.current = newPositionX;
              currentPositionYRef.current = newPositionY;
              setCurrentScale(targetScale);
              setGridScale(targetScale);
              isZoomingRef.current = false;
            }, 230);
          };

          return (
            <>
              {/* Centered Floating Toolbar */}
              <div style={{
                position: 'fixed',
                top: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  {/* Zoom Controls */}
                  <button
                    onClick={handleZoomOut}
                    disabled={!canZoomOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: canZoomOut ? 'pointer' : 'not-allowed',
                      opacity: canZoomOut ? 1 : 0.4,
                      transition: 'all 0.2s ease',
                      color: '#374151'
                    }}
                    onMouseEnter={(e) => {
                      if (canZoomOut) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onMouseDown={(e) => {
                      if (canZoomOut) e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Zoom out"
                  >
                    <ZoomOut size={18} strokeWidth={2} />
                  </button>

                  <div style={{
                    minWidth: '3.5rem',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    userSelect: 'none'
                  }}>
                    {zoomPercentage}%
                  </div>

                  <button
                    onClick={handleZoomIn}
                    disabled={!canZoomIn}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: canZoomIn ? 'pointer' : 'not-allowed',
                      opacity: canZoomIn ? 1 : 0.4,
                      transition: 'all 0.2s ease',
                      color: '#374151'
                    }}
                    onMouseEnter={(e) => {
                      if (canZoomIn) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onMouseDown={(e) => {
                      if (canZoomIn) e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Zoom in"
                  >
                    <ZoomIn size={18} strokeWidth={2} />
                  </button>

                  <button
                    onClick={handleResetZoom}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: '#374151'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Reset zoom"
                  >
                    <Maximize2 size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <div 
                  onClick={handleCanvasClick}
                  style={{ 
                    width: '10000px', 
                    height: '10000px',
                    position: 'relative',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                    overflow: 'hidden',
                    backgroundColor: '#F8F2EA',
                    backgroundImage: `
                      linear-gradient(to right, rgba(221, 181, 181, 0.4) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(221, 181, 181, 0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: `${40 * gridScale}px ${40 * gridScale}px`,
                    backgroundPosition: '0 0'
                  }}
                >

                  {/* Your content goes here */}
                  {typeof children === 'function' 
                    ? (children as (props: { scale: number; positionX: number; positionY: number }) => React.ReactNode)({ 
                        scale: currentScaleRef.current,
                        positionX: currentPositionXRef.current,
                        positionY: currentPositionYRef.current,
                      })
                    : children}
                </div>
              </TransformComponent>
            </>
          );
        }}
      </TransformWrapper>
    </div>
  );
}

