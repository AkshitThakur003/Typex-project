import { useRef, useState, useEffect } from 'react';

/**
 * Hook for pull-to-refresh functionality on mobile
 * @param {Function} onRefresh - Callback when refresh is triggered
 * @param {Object} options - Configuration options
 * @returns {Object} - Pull state and handlers
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80,
    resistance = 2.5,
    disabled = false,
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const elementRef = useRef(null);

  useEffect(() => {
    if (disabled) return;

    const element = elementRef.current || document.documentElement;
    let touchStartY = 0;
    let touchCurrentY = 0;
    let currentPullDistance = 0;
    let currentlyPulling = false;
    let currentlyRefreshing = false;

    const handleTouchStart = (e) => {
      // Only trigger at the top of the page
      if (window.scrollY > 0) return;
      
      touchStartY = e.touches[0].clientY;
      currentlyPulling = true;
      setIsPulling(true);
    };

    const handleTouchMove = (e) => {
      if (!currentlyPulling) return;
      
      touchCurrentY = e.touches[0].clientY;
      const distance = touchCurrentY - touchStartY;
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        const pull = Math.min(distance / resistance, threshold * 1.5);
        currentPullDistance = pull;
        setPullDistance(pull);
      } else {
        currentPullDistance = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (currentPullDistance >= threshold && !currentlyRefreshing) {
        currentlyRefreshing = true;
        setIsRefreshing(true);
        setPullDistance(0);
        currentPullDistance = 0;
        
        Promise.resolve(onRefresh())
          .finally(() => {
            currentlyRefreshing = false;
            setIsRefreshing(false);
            currentlyPulling = false;
            setIsPulling(false);
          });
      } else {
        currentPullDistance = 0;
        setPullDistance(0);
        currentlyPulling = false;
        setIsPulling(false);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, threshold, resistance, onRefresh]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    elementRef,
    progress: Math.min((pullDistance / threshold) * 100, 100),
  };
}

