import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Zap, 
  Trophy, 
  Target, 
  UserCircle2, 
  Shield, 
  Activity, 
  Github, 
  Code, 
  Database,
  Lock,
  Trophy as TrophyIcon,
  Clock,
  Award,
  Network,
  Palette
} from 'lucide-react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    Icon: Zap,
    title: 'Real-time Racing',
    description: 'Race with players worldwide using Socket.io for instant synchronization. Every keystroke is tracked in real-time.',
    color: 'from-orange-500 to-amber-500',
    iconColor: 'text-orange-400'
  },
  {
    Icon: Clock,
    title: 'Practice Modes',
    description: 'Flexible practice options with timed sessions and fixed-word counts. Track your improvement over time.',
    color: 'from-orange-500 to-amber-500',
    iconColor: 'text-orange-400'
  },
  {
    Icon: Activity,
    title: 'Live WPM Tracking',
    description: 'Watch your words per minute update every second. See detailed results with timeline charts after each session.',
    color: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-400'
  },
  {
    Icon: UserCircle2,
    title: 'Avatars Everywhere',
    description: 'Express yourself with avatars across chat, leaderboards, and race results. Personalize your typing experience.',
    color: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-400'
  },
  {
    Icon: Shield,
    title: 'Anti-cheat System',
    description: 'Fair play guaranteed with intelligent anti-cheat checks. Automatic detection ensures competitive integrity.',
    color: 'from-orange-500 to-amber-500',
    iconColor: 'text-orange-400'
  },
  {
    Icon: TrophyIcon,
    title: 'Smart Leaderboards',
    description: 'Mode-aware leaderboards separate practice and multiplayer rankings. See where you stand in each category.',
    color: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-400'
  }
];

// Tech Stack Icons as SVG Components
const ReactIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="12" cy="12" rx="11" ry="4.2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="12" cy="12" rx="11" ry="4.2" stroke="currentColor" strokeWidth="1.5" fill="none" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="11" ry="4.2" stroke="currentColor" strokeWidth="1.5" fill="none" transform="rotate(120 12 12)"/>
  </svg>
);

const TailwindIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.12 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.31-.74-1.91-1.35C15.61 7.15 14.47 6 12 6zm-5 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.12 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.31-.74-1.91-1.35C10.61 13.15 9.47 12 7 12z"/>
  </svg>
);

const techStack = [
  { name: 'React + Vite', Icon: ReactIcon, color: 'text-cyan-400' },
  { name: 'TailwindCSS', Icon: TailwindIcon, color: 'text-emerald-400' },
  { name: 'Socket.io', Icon: Network, color: 'text-orange-400' },
  { name: 'Recharts', Icon: Activity, color: 'text-emerald-400' },
  { name: 'Express / MongoDB', Icon: Database, color: 'text-slate-400' },
];

export default function About() {
  const heroRef = useRef(null);
  const sectionsRef = useRef([]);
  const cardsRef = useRef([]);
  const bgElementsRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !ScrollTrigger) return;

    // Animated background elements
    if (bgElementsRef.current.length > 0) {
      bgElementsRef.current.forEach((el, index) => {
        if (el) {
          gsap.to(el, {
            x: `+=${(index % 2 === 0 ? 1 : -1) * 50}`,
            y: `+=${(index % 2 === 0 ? -1 : 1) * 30}`,
            rotation: (index % 2 === 0 ? 1 : -1) * 15,
            duration: 8 + index * 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        }
      });
    }

    // Scroll-triggered animations for cards
    cardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            scale: 0.9,
            rotationX: 15
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
              once: true
            },
            delay: index * 0.1
          }
        );
      }
    });

    // Section animations
    sectionsRef.current.forEach((section, index) => {
      if (section) {
        gsap.fromTo(
          section,
          {
            opacity: 0,
            y: 50,
            scale: 0.95
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'top 50%',
              scrub: true
            }
          }
        );

        // Animate headers
        const headers = section.querySelectorAll('h2, h3');
        headers.forEach((header) => {
          gsap.fromTo(
            header,
            {
              opacity: 0,
              y: 30,
              scale: 0.9
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'back.out(1.2)',
              scrollTrigger: {
                trigger: header,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        });
      }
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          ref={el => bgElementsRef.current[0] = el}
          className="absolute top-20 left-10 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl animate-pulse-slow"
        />
        <div 
          ref={el => bgElementsRef.current[1] = el}
          className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
        <div 
          ref={el => bgElementsRef.current[2] = el}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Hero Section */}
        <motion.header 
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16 lg:mb-20 relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-6 group cursor-pointer"
          >
            <div className="relative inline-block">
              {/* Multiple glow layers for depth */}
              <motion.div
                className="absolute -inset-8 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <motion.div
                className="absolute -inset-6 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                animate={{ 
                  scale: [1.1, 1, 1.1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />

              {/* Main glow behind text */}
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-orange-500/8 to-yellow-500/8 blur-2xl -z-10 rounded-2xl"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ 
                  opacity: 1,
                  scale: 1.05
                }}
              />
              
              {/* Hover glow effect */}
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-orange-400/0 via-yellow-400/0 to-orange-400/0 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{
                  background: [
                    "linear-gradient(to right, rgba(251, 146, 60, 0.2), rgba(253, 224, 71, 0.2), rgba(251, 146, 60, 0.2))",
                    "linear-gradient(to right, rgba(251, 146, 60, 0.3), rgba(253, 224, 71, 0.3), rgba(251, 146, 60, 0.3))",
                  ]
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Main heading with enhanced hover */}
              <motion.h1 
                className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 text-transparent bg-clip-text"
                whileHover={{ 
                  scale: 1.05,
                  textShadow: "0 0 30px rgba(251, 146, 60, 0.5), 0 0 60px rgba(253, 224, 71, 0.3)"
                }}
                transition={{ duration: 0.3 }}
              >
                About TypeX
              </motion.h1>

              {/* Animated underline glow on hover */}
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full opacity-0 group-hover:opacity-100 w-0 group-hover:w-full transition-all duration-500"
                initial={{ width: 0 }}
              />
              
              {/* Sparkle effects on hover */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full blur-sm"
                    style={{
                      left: `${20 + i * 12}%`,
                      top: `${25 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed relative z-10"
            whileHover={{
              scale: 1.02,
              textShadow: "0 0 20px rgba(148, 163, 184, 0.3)",
              transition: { duration: 0.3 }
            }}
          >
            TypeX is a fast, modern typing app for solo practice and real‑time multiplayer races. 
            It's lightweight, responsive, and fun—and now includes live WPM tracking in practice, 
            mode‑aware leaderboards, avatars, and fairness tools.
          </motion.p>
        </motion.header>

        {/* Key Features Grid */}
        <section 
          ref={el => sectionsRef.current[0] = el}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12"
          >
            Key Features
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <motion.div
                  key={index}
                  ref={el => cardsRef.current[index] = el}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 hover:border-white/20 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 mb-4"
                  >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-white/20 transition-colors`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${feature.iconColor}`} />
                    </div>
                  </motion.div>
                  
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-slate-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Tech Stack Section */}
        <section 
          ref={el => sectionsRef.current[1] = el}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 lg:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/5 to-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Code className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  Tech Stack
                </h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {techStack.map((tech, index) => {
                  const Icon = tech.Icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <div className={`${tech.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300 text-center font-medium">
                    {tech.name}
                  </span>
                </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section 
          ref={el => sectionsRef.current[2] = el}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 lg:p-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                How It Works
              </h2>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 leading-relaxed"
            >
              Start a practice session or create/join a multiplayer room. In practice, your WPM is tracked 
              every second and shown on a timeline in the results. In multiplayer, progress and WPM are 
              streamed for a live leaderboard and a results page with a winner card.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold">Privacy</h3>
                </div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  No raw keystroke content is stored. Practice results save locally or to your account; 
                  multiplayer results store final stats and timeline data.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold">Leaderboards</h3>
                </div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Tabs for Practice and Multiplayer show top scores with avatars. Your best stats are 
                  shown contextually per mode.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Contribute Section */}
        <section 
          ref={el => sectionsRef.current[3] = el}
          className="mb-12 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-emerald-500/5 backdrop-blur-md rounded-2xl border border-emerald-500/10 p-6 sm:p-8 lg:p-10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/3 to-transparent animate-shimmer" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="inline-block mb-4"
              >
                <Github className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400 mx-auto" />
              </motion.div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Contribute
              </h2>
              
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                Found a bug or want a feature? Contributions, issues and PRs are welcome. 
                See the repository for setup and contributing guidelines.
              </p>
              
              <motion.a
                href="https://github.com/AkshitThakur003/Typex-project"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </motion.a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
