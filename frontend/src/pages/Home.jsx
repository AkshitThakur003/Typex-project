import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Zap, Trophy, Target } from "lucide-react";
import KeyboardMockup from "./KeyboardMockup";
import FeatureCard from "../components/home/FeatureCard";
import { Skeleton } from "../components/common";

// Lazy load heavy components for better performance
const MockTypingPreview = lazy(() => import("../components/home/MockTypingPreview"));
const RaceRoomPreview = lazy(() => import("../components/home/RaceRoomPreview"));
const Testimonials = lazy(() => import("../components/home/Testimonials"));

// Import GSAP and ScrollTrigger (static import for consistency with other components)
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger if available
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Loading fallback for lazy components
const SectionSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto p-8">
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

export default function Home() {
  const heroRef = useRef(null);
  const parallaxRef = useRef(null);
  const sectionsRef = useRef([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference (accessibility)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Setup GSAP animations only if user doesn't prefer reduced motion
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion || !ScrollTrigger) return;
    if (!parallaxRef.current || !heroRef.current) return;

    // Simplified parallax effect (less CPU intensive)
    gsap.to(parallaxRef.current, {
      y: -40,
      opacity: 0.85,
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 2, // Higher value = smoother but less responsive
      }
    });

    // Simplified background parallax
    const bgElements = heroRef.current.querySelectorAll('.bg-parallax');
    bgElements.forEach((el, index) => {
      gsap.to(el, {
        y: -60 * (index + 1),
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        }
      });
    });

    // Simplified section animations (reduced complexity)
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      if (index === 0) return;

      gsap.fromTo(
        section,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none none" // Don't reverse for better performance
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [prefersReducedMotion]);

  const features = [
    {
      Icon: Zap,
      title: "Real-time Racing",
      description: "Jump into races with players from around the world. Every keystroke syncs instantly, so you're always racing in real-time, not against lag."
    },
    {
      Icon: Trophy,
      title: "Compete & Improve",
      description: "Watch your WPM climb as you practice. Challenge friends, beat your personal best, and see your name rise on the leaderboard."
    },
    {
      Icon: Target,
      title: "Practice Your Way",
      description: "Choose your style—timed tests, word counts, or inspiring quotes. Track accuracy, spot mistakes, and get better every day."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 pt-20 pb-16 overflow-hidden"
      >
        {/* Animated background elements with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bg-parallax absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="bg-parallax absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div ref={parallaxRef} className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 text-transparent bg-clip-text"
          >
            TypeX
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            Where typing meets competition. Race friends, beat your best, and watch your speed soar.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            No signup needed to practice. Jump in and start typing right away.
          </motion.p>

          {/* Keyboard Typing Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 sm:mt-16 md:mt-20"
          >
            <KeyboardMockup />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-slate-600 rounded-full flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-slate-400 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Mock Typing Preview Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-slate-950/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Watch how smooth and responsive our typing interface feels. Real-time feedback, live stats, and zero distractions.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<SectionSkeleton />}>
              <MockTypingPreview />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Race Room Preview Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-950/50 to-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Race With Friends
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Create a room, invite your friends, and race together. Watch everyone's progress in real-time as you type.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<SectionSkeleton />}>
              <RaceRoomPreview />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Built for typists who want to get better, compete fairly, and have fun doing it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                Icon={feature.Icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.15}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <Suspense fallback={<SectionSkeleton />}>
          <Testimonials />
        </Suspense>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 text-center text-slate-500 text-sm border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="mb-4">© {new Date().getFullYear()} TypeX. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6 text-slate-400">
            <Link to="/about" className="hover:text-orange-400 transition-colors">
              About
            </Link>
            <a 
              href="https://github.com/AkshitThakur003" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-orange-400 transition-colors"
            >
              GitHub
            </a>
            <a 
              href="mailto:akshitthakur2003@gmail.com" 
              className="hover:text-orange-400 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
