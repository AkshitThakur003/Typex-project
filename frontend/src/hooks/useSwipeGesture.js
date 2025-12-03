import { useRef, useState, useEffect } from 'react';

/**
 * Hook for detecting swipe gestures on mobile
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {Function} options.onSwipeUp - Callback for up swipe
 * @param {Function} options.onSwipeDown - Callback for down swipe
 * @param {number} options.minSwipeDistance - Minimum distance in pixels (default: 50)
 * @param {number} options.maxSwipeTime - Maximum time in ms (default: 300)
 * @returns {Object} - Touch handlers and swipe state
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance: minDistance = 50,
  maxSwipeTime = 300,
}) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const minSwipeDistance = minDistance || 50;

  const onTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = {
      clientX: e.targetTouches[0].clientX,
      clientY: e.targetTouches[0].clientY,
    };
  };

  const onTouchMove = (e) => {
    touchEnd.current = {
      clientX: e.targetTouches[0].clientX,
      clientY: e.targetTouches[0].clientY,
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distanceX = touchStart.current.clientX - touchEnd.current.clientX;
    const distanceY = touchStart.current.clientY - touchEnd.current.clientY;
    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);
    
    // Determine if horizontal or vertical swipe
    if (absX > absY) {
      // Horizontal swipe
      if (absX > minSwipeDistance) {
        if (distanceX > 0 && onSwipeLeft) {
          onSwipeLeft();
          setSwipeDirection('left');
        } else if (distanceX < 0 && onSwipeRight) {
          onSwipeRight();
          setSwipeDirection('right');
        }
      }
    } else {
      // Vertical swipe
      if (absY > minSwipeDistance) {
        if (distanceY > 0 && onSwipeUp) {
          onSwipeUp();
          setSwipeDirection('up');
        } else if (distanceY < 0 && onSwipeDown) {
          onSwipeDown();
          setSwipeDirection('down');
        }
      }
    }
    
    // Reset after a short delay
    setTimeout(() => {
      touchStart.current = null;
      touchEnd.current = null;
      setSwipeDirection(null);
    }, 100);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
  };
}

/**
 * Hook for swipe-to-go-back navigation
 */
export function useSwipeBack(onBack) {
  return useSwipeGesture({
    onSwipeRight: onBack,
    minSwipeDistance: 100,
  });
}

