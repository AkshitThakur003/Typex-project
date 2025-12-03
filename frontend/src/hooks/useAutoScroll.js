import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-scrolling a container to bottom when new items are added.
 * Respects user scroll position - won't auto-scroll if user has scrolled up.
 * 
 * @param {Array} dependencies - Array of dependencies that trigger scroll (e.g., messages array)
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether auto-scroll is enabled (default: true)
 * @param {number} options.threshold - Pixels from bottom to consider "at bottom" (default: 100)
 * @returns {Object} { scrollRef, scrollToBottom }
 */
export function useAutoScroll(dependencies = [], { enabled = true, threshold = 100 } = {}) {
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const isUserScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Check if user has manually scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // If user scrolled up significantly, mark as user-scrolled
    if (scrollTop < lastScrollTopRef.current - 10) {
      isUserScrolledRef.current = true;
    }
    
    // If user scrolls back to bottom, reset the flag
    if (distanceFromBottom <= threshold) {
      isUserScrolledRef.current = false;
    }
    
    lastScrollTopRef.current = scrollTop;
  };

  // Auto-scroll when dependencies change (new messages)
  useEffect(() => {
    if (!enabled || !scrollRef.current || !endRef.current) return;
    
    // Only auto-scroll if user hasn't manually scrolled up
    if (!isUserScrolledRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, dependencies);

  // Manual scroll to bottom function
  const scrollToBottom = (behavior = 'smooth') => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior, block: 'end' });
      isUserScrolledRef.current = false;
    }
  };

  // Attach scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return { scrollRef, endRef, scrollToBottom };
}

