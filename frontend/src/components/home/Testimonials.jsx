import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, Star, TrendingUp } from 'lucide-react';
import { Avatar } from '../common';

// Register ScrollTrigger if available
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai, Maharashtra',
    emoji: '👩',
    quote: "I've improved my typing speed from 35 to 68 WPM in just two months! The multiplayer races make practice so much fun. My friends and I compete every evening.",
    wpm: 68,
    rating: 5
  },
  {
    id: 2,
    name: 'Arjun Patel',
    location: 'Ahmedabad, Gujarat',
    emoji: '👨',
    quote: "Best typing platform I've used. The real-time races are addictive, and I love how I can challenge my college friends. The leaderboard keeps me motivated!",
    wpm: 82,
    rating: 5
  },
  {
    id: 3,
    name: 'Kavya Reddy',
    location: 'Hyderabad, Telangana',
    emoji: '👧',
    quote: "As a developer, typing speed matters a lot. TypeX helped me go from 45 to 95 WPM. The practice mode with quotes is perfect for learning while typing.",
    wpm: 95,
    rating: 5
  },
  {
    id: 4,
    name: 'Rohan Kumar',
    location: 'Delhi, NCR',
    emoji: '👦',
    quote: "The multiplayer feature is amazing! I race with my team every day during lunch break. It's become our daily ritual. Highly recommend!",
    wpm: 72,
    rating: 5
  },
  {
    id: 5,
    name: 'Ananya Singh',
    location: 'Bangalore, Karnataka',
    emoji: '👩',
    quote: "I was struggling with typing speed for my job. TypeX's practice mode with different difficulty levels helped me improve gradually. Now I'm confident!",
    wpm: 58,
    rating: 5
  },
  {
    id: 6,
    name: 'Vikram Mehta',
    location: 'Pune, Maharashtra',
    emoji: '👨',
    quote: "The competitive aspect is what keeps me coming back. Racing against real players worldwide is thrilling. My best is 105 WPM and I'm still improving!",
    wpm: 105,
    rating: 5
  }
];

// Shuffle testimonials for authenticity
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Shuffle and duplicate for seamless loop
const shuffledTestimonials = shuffleArray(testimonials);
const duplicatedTestimonials = [...shuffledTestimonials, ...shuffledTestimonials];

export default function Testimonials() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const animationRef = useRef(null);
  const cardRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and handle resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic animation setup with responsive card width calculation
  useEffect(() => {
    if (!trackRef.current || !containerRef.current) return;

    const track = trackRef.current;
    const container = containerRef.current;
    
    // Kill existing animation if any
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Function to calculate card width dynamically
    const calculateCardWidth = () => {
      if (cardRef.current) {
        const card = cardRef.current;
        const computedStyle = window.getComputedStyle(card);
        const width = card.offsetWidth;
        const gap = parseInt(computedStyle.getPropertyValue('gap') || '24') || 24;
        return width + gap;
      }
      // Fallback to viewport-based calculation
      const viewportWidth = window.innerWidth;
      if (viewportWidth < 640) {
        // Mobile: ~85vw minus padding
        return Math.min(viewportWidth * 0.85 + 24, 340);
      } else if (viewportWidth < 768) {
        // Small tablet
        return 360 + 24;
      } else {
        // Desktop
        return 380 + 24;
      }
    };

    // Get actual card width
    const cardWidth = calculateCardWidth();
    const totalWidth = cardWidth * duplicatedTestimonials.length;
    
    // Create infinite scroll animation
    const animation = gsap.to(track, {
      x: -totalWidth / 2, // Move by half (since we duplicated)
      duration: isMobile ? 50 : 40, // Slower on mobile
      ease: 'none',
      repeat: -1,
      onRepeat: () => {
        // Reset position seamlessly
        gsap.set(track, { x: 0 });
      }
    });

    animationRef.current = animation;

    // Pause on hover (desktop only)
    const handleMouseEnter = () => {
      if (!isMobile) animation.pause();
    };
    const handleMouseLeave = () => {
      if (!isMobile) animation.resume();
    };
    
    // Touch handling for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      if (isMobile) {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
        animation.pause();
      }
    };

    const handleTouchMove = (e) => {
      if (isMobile && isDragging) {
        touchEndX = e.touches[0].clientX;
        const diff = touchEndX - touchStartX;
        const currentX = gsap.getProperty(track, 'x') || 0;
        gsap.set(track, { x: currentX + diff * 0.5 });
        touchStartX = touchEndX;
      }
    };

    const handleTouchEnd = () => {
      if (isMobile) {
        isDragging = false;
        animation.resume();
      }
    };
    
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    // Handle window resize
    const handleResize = () => {
      const newCardWidth = calculateCardWidth();
      const newTotalWidth = newCardWidth * duplicatedTestimonials.length;
      animation.kill();
      const newAnimation = gsap.to(track, {
        x: -newTotalWidth / 2,
        duration: window.innerWidth < 768 ? 50 : 40,
        ease: 'none',
        repeat: -1,
        onRepeat: () => {
          gsap.set(track, { x: 0 });
        }
      });
      animationRef.current = newAnimation;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) animationRef.current.kill();
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  return (
    <div className="w-full py-12 sm:py-16 md:py-24 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6"
      >
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            What Our Community Says
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto px-2">
            Join thousands of typists improving their skills and having fun racing together
          </p>
        </motion.div>

        {/* Moving Testimonials Container */}
        <div className="relative">
          {/* Gradient overlays for smooth fade effect - responsive widths */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent pointer-events-none z-10" />
          
          <div 
            ref={containerRef}
            className="relative overflow-hidden"
          >
            <div 
              ref={trackRef}
              className="flex gap-4 sm:gap-5 md:gap-6 will-change-transform"
              style={{ width: 'fit-content' }}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <motion.div
                  key={`${testimonial.id}-${index}`}
                  ref={index === 0 ? cardRef : null}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex-shrink-0 w-[calc(100vw-3rem)] max-w-[340px] sm:w-[360px] sm:max-w-none md:w-[380px] bg-slate-900/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-800 shadow-xl sm:shadow-2xl p-4 sm:p-5 md:p-6 lg:p-8 hover:border-emerald-500/30 hover:shadow-emerald-500/20 hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors flex-shrink-0">
                      <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1 sm:mb-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed mb-4 sm:mb-5 md:mb-6 line-clamp-4">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-800 gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Avatar name={testimonial.name} size={isMobile ? 40 : 48} emoji={testimonial.emoji} />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate">{testimonial.name}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400 truncate">{testimonial.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap">{testimonial.wpm} WPM</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
