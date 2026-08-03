import {
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Sparkles,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTutorial } from '../hooks/useTutorial';

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TutorialOverlay: React.FC = () => {
  const { user } = useAuth();
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipTutorial,
    completePageTutorial,
    tutorialMode,
    currentPage
  } = useTutorial();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%' });
  const [showLocatingHint, setShowLocatingHint] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // User preference for tutorial guide visibility
  const [showTutorialGuide, setShowTutorialGuide] = useState(() => localStorage.getItem('showTutorialGuide') !== 'false');

  // Listen for storage changes (from Settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      setShowTutorialGuide(localStorage.getItem('showTutorialGuide') !== 'false');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Function to update positions based on current element location
  const updatePositions = useCallback(() => {
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();

    // Update highlight position (using viewport coordinates for fixed positioning)
    setOverlayPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });

    // Update tooltip position
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const padding = 16;

    let top = 0;
    let left = 0;

    // Calculate position based on step configuration
    switch (currentStep?.position) {
      case 'top':
        top = rect.top - tooltipRect.height - padding;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + padding;
        break;
      default:
        top = rect.bottom + padding;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

    // Keep tooltip within viewport bounds
    if (left < padding) left = padding;
    if (left + tooltipRect.width > windowWidth - padding) {
      left = windowWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > windowHeight - padding) {
      top = windowHeight - tooltipRect.height - padding;
    }

    // If tooltip would cover the target, try alternative positions
    const tooltipWouldCover = (
      top < rect.bottom + padding &&
      top + tooltipRect.height > rect.top - padding &&
      left < rect.right + padding &&
      left + tooltipRect.width > rect.left - padding
    );

    if (tooltipWouldCover) {
      // Try positioning below if there's space
      if (rect.bottom + tooltipRect.height + padding * 2 < windowHeight) {
        top = rect.bottom + padding;
      } else if (rect.top - tooltipRect.height - padding > 0) {
        top = rect.top - tooltipRect.height - padding;
      }
    }

    setTooltipPosition({ top: `${top}px`, left: `${left}px` });
  }, [targetElement, currentStep?.position]);

  // Find and scroll/reveal target element when step changes
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      setOverlayPosition({ top: 0, left: 0, width: 0, height: 0 });
      setShowLocatingHint(false);
      return;
    }

    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 40;
    let timers: ReturnType<typeof setTimeout>[] = [];
    let observer: MutationObserver | null = null;
    let hintTimer: ReturnType<typeof setTimeout> | null = null;

    // Clear previous highlight immediately; delay the yellow "locating" hint so
    // route / Suspense transitions don't flash a false error for 1–2s.
    setTargetElement(null);
    setOverlayPosition({ top: 0, left: 0, width: 0, height: 0 });
    setShowLocatingHint(false);
    hintTimer = setTimeout(() => {
      if (!cancelled) setShowLocatingHint(true);
    }, 1400);

    const measure = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      setOverlayPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      return rect;
    };

    const isUsableRect = (rect: DOMRect) =>
      rect.width > 2 &&
      rect.height > 2 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;

    const markFound = (element: HTMLElement) => {
      setTargetElement(element);
      setShowLocatingHint(false);
      if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
      }
      measure(element);
    };

    const findElement = () => {
      if (cancelled) return;

      let element = document.querySelector(currentStep.target) as HTMLElement | null;
      if (!element && currentStep.fallbackTarget) {
        element = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
      }

      if (!element) {
        // Ask the page to reveal / prep UI (select message, open sidebar, switch tab)
        window.dispatchEvent(
          new CustomEvent('tutorial:reveal-target', {
            detail: { stepId: currentStep.id, page: currentPage, target: currentStep.target },
          })
        );
        if (retryCount < maxRetries) {
          retryCount++;
          timers.push(setTimeout(findElement, 150));
        } else {
          setTargetElement(null);
          setOverlayPosition({ top: 0, left: 0, width: 0, height: 0 });
          setShowLocatingHint(true);
          console.warn(`Tutorial target not found: ${currentStep.target}`);
        }
        return;
      }

      markFound(element);

      // Ask the page to reveal tutorial targets (sidebars/drawers) if needed
      window.dispatchEvent(
        new CustomEvent('tutorial:reveal-target', {
          detail: { stepId: currentStep.id, page: currentPage, target: currentStep.target },
        })
      );

      let rect = element.getBoundingClientRect();

      // Off-screen or zero-size — scroll and retry measure after layout settles
      if (!isUsableRect(rect)) {
        try {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch {
          /* ignore */
        }
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            rect = measure(element!);
            if (!isUsableRect(rect) && retryCount < maxRetries) {
              retryCount++;
              timers.push(setTimeout(findElement, 250));
            }
          }, 350)
        );
      } else {
        // Re-measure after paint in case layout shifts
        timers.push(
          setTimeout(() => {
            if (!cancelled) measure(element!);
          }, 100)
        );
      }
    };

    // Brief delay so route transitions / tab switches can mount targets
    timers.push(setTimeout(findElement, 80));

    // Re-find when pages mount targets after selecting a row / expanding a panel
    let observerTimer: ReturnType<typeof setTimeout> | null = null;
    observer = new MutationObserver(() => {
      if (cancelled) return;
      if (observerTimer) clearTimeout(observerTimer);
      observerTimer = setTimeout(() => {
        if (cancelled) return;
        const preferred = document.querySelector(currentStep.target) as HTMLElement | null;
        if (!preferred) return;
        setTargetElement((prev) => {
          if (prev === preferred) return prev;
          setShowLocatingHint(false);
          if (hintTimer) {
            clearTimeout(hintTimer);
            hintTimer = null;
          }
          measure(preferred);
          try {
            preferred.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } catch {
            /* ignore */
          }
          return preferred;
        });
      }, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (observerTimer) clearTimeout(observerTimer);
      if (hintTimer) clearTimeout(hintTimer);
      observer?.disconnect();
    };
  }, [isActive, currentStep, currentPage]);

  // Keep highlight synced on scroll/resize while a target is active
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const handleUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = targetElement.getBoundingClientRect();
        setOverlayPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        // Still update tooltip via shared helper when possible
        updatePositions();
      });
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    const resizeObserver = new ResizeObserver(handleUpdate);
    resizeObserver.observe(targetElement);

    handleUpdate();

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, targetElement, updatePositions]);

  // Don't show overlay when not logged in, tutorial is not active, or user disabled it
  if (!user || !isActive || !currentStep || !showTutorialGuide) return null;

  // Visible = found, has size, and intersects the viewport (not just off-canvas)
  const isTargetVisible = Boolean(
    targetElement &&
      overlayPosition.width > 2 &&
      overlayPosition.height > 2 &&
      overlayPosition.top + overlayPosition.height > 0 &&
      overlayPosition.left + overlayPosition.width > 0 &&
      overlayPosition.top < (typeof window !== 'undefined' ? window.innerHeight : 0) &&
      overlayPosition.left < (typeof window !== 'undefined' ? window.innerWidth : 0)
  );

  return (
    <>
      {/* Backdrop with cutout effect */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: isTargetVisible
            ? `radial-gradient(ellipse ${overlayPosition.width + 40}px ${overlayPosition.height + 40}px at ${overlayPosition.left + overlayPosition.width / 2}px ${overlayPosition.top + overlayPosition.height / 2}px, transparent 60%, rgba(0, 0, 0, 0.6) 100%)`
            : 'rgba(0, 0, 0, 0.6)'
        }}
      />

      {/* Clickable backdrop to prevent interactions */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Highlight overlay - only show if element is found */}
      {isTargetVisible && (
        <div
          className="fixed z-[9999] border-2 border-blue-500 rounded-lg shadow-2xl transition-all duration-200 ease-out"
          style={{
            top: overlayPosition.top - 4,
            left: overlayPosition.left - 4,
            width: overlayPosition.width + 8,
            height: overlayPosition.height + 8,
            pointerEvents: 'none'
          }}
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-lg animate-pulse" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 transition-all duration-200 ease-out"
        style={tooltipPosition}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-900 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentStep.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded capitalize">
                    {currentPage}
                  </span>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${i === currentStepIndex ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    {currentStepIndex + 1}/{totalSteps}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={skipTutorial}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              title="Close tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isTargetVisible && showLocatingHint && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Locating this control… If it stays hidden, open the left menu or scroll, then click Next.
              </p>
            </div>
          )}
          {!isTargetVisible && !showLocatingHint && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading this page…</p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={skipTutorial}
                className="flex items-center space-x-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>

              <button
                onClick={() => {
                  if (currentStepIndex === totalSteps - 1) {
                    if (tutorialMode === 'page') {
                      completePageTutorial();
                    } else {
                      nextStep(); // This will either go to next page or complete
                    }
                  } else {
                    nextStep();
                  }
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-900 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <span>
                  {currentStepIndex === totalSteps - 1
                    ? (tutorialMode === 'page' ? 'Done' : 'Continue')
                    : 'Next'}
                </span>
                {currentStepIndex === totalSteps - 1 ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointer */}
        {isTargetVisible && (
          <div
            className={`absolute w-4 h-4 bg-white transform rotate-45 border border-gray-200 ${currentStep.position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0' :
                currentStep.position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0' :
                  currentStep.position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-l-0 border-b-0' :
                    'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-r-0 border-t-0'
              }`}
          />
        )}
      </div>
    </>
  );
};

export default TutorialOverlay;
