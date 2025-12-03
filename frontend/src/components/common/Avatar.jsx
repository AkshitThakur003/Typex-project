// Avatar component - displays user avatar with fallback
import React from 'react';

export default function Avatar({ 
  name = '', 
  imageUrl = null, 
  emoji = null,
  size = 'md',
  className = '',
  isMe = false,
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  // Priority: imageUrl > emoji > initial
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover border-2 ${isMe ? 'border-emerald-500' : 'border-slate-700'} ${className}`}
      />
    );
  }

  if (emoji) {
    return (
      <div className={`${sizeClass} rounded-full bg-slate-800 border-2 ${isMe ? 'border-emerald-500' : 'border-slate-700'} flex items-center justify-center ${className}`}>
        <span>{emoji}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 ${isMe ? 'border-emerald-400' : 'border-slate-700'} flex items-center justify-center font-bold text-white ${className}`}>
      {initial}
    </div>
  );
}

