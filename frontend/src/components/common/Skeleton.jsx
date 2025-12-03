// ============================================
// Loading Skeleton Components
// Replaces simple spinners with content-aware placeholders
// ============================================

import { motion as m } from 'framer-motion';

// Base skeleton with shimmer animation
export function Skeleton({ className = '', animate = true }) {
  return (
    <div 
      className={`relative overflow-hidden bg-slate-800/50 rounded ${className}`}
    >
      {animate && (
        <m.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-700/30 to-transparent"
          animate={{ translateX: ['100%', '-100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };
  
  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

// Card skeleton
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-slate-900/70 border border-slate-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

// Stats card skeleton
export function SkeletonStatCard() {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

// Leaderboard row skeleton
export function SkeletonLeaderboardRow() {
  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg">
      <Skeleton className="w-8 h-8 rounded-full" />
      <SkeletonAvatar size="sm" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

// Profile header skeleton
export function SkeletonProfileHeader() {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <SkeletonAvatar size="xl" />
        <div className="flex-1 text-center sm:text-left space-y-3">
          <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Practice area skeleton
export function SkeletonPracticeArea() {
  return (
    <div className="space-y-6">
      {/* Mode selector skeleton */}
      <div className="flex flex-wrap justify-center gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-3 w-12 mb-2" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-8 w-12 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Stats header skeleton */}
      <div className="flex justify-center gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-3 w-10 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      
      {/* Typing area skeleton */}
      <div className="bg-slate-900 p-6 rounded-lg">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-wrap gap-2">
              {Array.from({ length: 8 + Math.random() * 4 }).map((_, j) => (
                <Skeleton 
                  key={j} 
                  className="h-6" 
                  style={{ width: `${40 + Math.random() * 60}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Restart button skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

// Multiplayer lobby skeleton
export function SkeletonLobby() {
  return (
    <div className="space-y-6">
      {/* Create room form skeleton */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Join room skeleton */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Room player list skeleton
export function SkeletonPlayerList({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function SkeletonChart({ height = 256 }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
        {/* Chart area */}
        <div className="absolute left-14 right-0 top-0 bottom-8 flex items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t" 
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
        {/* X-axis labels */}
        <div className="absolute left-14 right-0 bottom-0 flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-12" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Results page skeleton
export function SkeletonResults() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* XP bar skeleton */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 rounded-lg p-4 text-center">
            <Skeleton className="h-4 w-16 mx-auto mb-2" />
            <Skeleton className="h-10 w-20 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <SkeletonChart height={320} />
      
      {/* Action buttons skeleton */}
      <div className="flex justify-center gap-6">
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

// Friends list skeleton
export function SkeletonFriendsList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
          <div className="relative">
            <SkeletonAvatar size="md" />
            <Skeleton className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic page loading skeleton
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        
        {/* Content cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        
        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Skeleton;

