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

  // Find and scroll to target element when step changes
  useEffect(() => {
    if (isActive && currentStep) {
      let retryCount = 0;
      const maxRetries = 10;

      // Small delay to let the page render
      const findElement = () => {
        // Try primary target first, then fallback
        let element = document.querySelector(currentStep.target) as HTMLElement;

        // If primary target not found, try fallback
        if (!element && (currentStep as any).fallbackTarget) {
          element = document.querySelector((currentStep as any).fallbackTarget) as HTMLElement;
        }

        if (element) {
          setTargetElement(element);

          // Check if element is in viewport
          const rect = element.getBoundingClientRect();
          const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          );

          // Only scroll if element is not in viewport
          if (!isInViewport) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }

          // Update positions after scroll completes
          setTimeout(updatePositions, 300);
        } else if (retryCount < maxRetries) {
          // Element not found, retry after a short delay
          retryCount++;
          setTimeout(findElement, 200);
        } else {
          // Max retries reached, show tutorial without highlight
          setTargetElement(null);
          console.warn(`Tutorial target not found: ${currentStep.target}`);
        }
      };

      findElement();
    } else {
      setTargetElement(null);
    }
  }, [isActive, currentStep, updatePositions]);

  // Set up event listeners for scroll and resize
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const handleUpdate = () => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(updatePositions);
    };

    // Listen to scroll on window and all scrollable containers
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    // Also use ResizeObserver to detect element size changes
    const resizeObserver = new ResizeObserver(handleUpdate);
    resizeObserver.observe(targetElement);

    // Initial position update
    updatePositions();

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

  // Check if target element is visible in viewport
  const isTargetVisible = targetElement && overlayPosition.width > 0 && overlayPosition.height > 0;

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
        className="fixed z-[10000] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 ease-out"
        style={tooltipPosition}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentStep.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded capitalize">
                    {currentPage}
                  </span>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${i === currentStepIndex ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {currentStepIndex + 1}/{totalSteps}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={skipTutorial}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Element not found warning */}
          {!isTargetVisible && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                The highlighted element is not visible. Try scrolling or navigate to see it.
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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
