import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger if available
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FeatureCard({ Icon, title, description, delay = 0 }) {
  const cardRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    if (cardRef.current && typeof window !== 'undefined' && ScrollTrigger) {
      // Enhanced card animation on scroll
      gsap.fromTo(
        cardRef.current,
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9,
          rotationX: 15
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 0.8,
          delay: delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    if (iconRef.current) {
      // Animate icon on hover
      const handleMouseEnter = () => {
        gsap.to(iconRef.current, {
          scale: 1.1,
          rotation: 5,
          duration: 0.3,
          ease: 'back.out(1.7)'
        });
      };

      const handleMouseLeave = () => {
        gsap.to(iconRef.current, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      const card = cardRef.current;
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [delay]);

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -12, scale: 1.03, rotateY: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 p-6 md:p-8 hover:border-emerald-500/30 hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group perspective-1000"
    >
      <div className="flex flex-col items-center text-center">
        <div
          ref={iconRef}
          className="w-16 h-16 md:w-20 md:h-20 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 group-hover:border-emerald-500/50 transition-all"
        >
          {Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors" />}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

