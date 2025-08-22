import React from 'react';
import { usePreferences } from '../settings/PreferencesContext.jsx';

// Reusable Avatar component
// Props:
// - name: string (used for alt text and seed)
// - size: number (pixels)
// - imageUrl: optional explicit image URL
// - emoji: optional emoji to display (defaults from preferences for current user)
// - isMe: boolean to prefer current user's avatar from preferences
export default function Avatar({ name = 'User', size = 32, imageUrl, emoji, isMe = false }) {
  const { preferences } = usePreferences();
  const url = isMe && preferences?.avatarUrl ? preferences.avatarUrl : imageUrl;
  const emj = isMe && preferences?.avatarEmoji ? preferences.avatarEmoji : (emoji || '🙂');

  const dimension = `${size}px`;
  const initials = (name || 'U').slice(0, 1).toUpperCase();

  // Generate a pleasant gradient based on name hash
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = hash % 360;
  const bg = `linear-gradient(135deg, hsl(${hue} 70% 30%), hsl(${(hue + 40) % 360} 70% 20%))`;

  if (url) {
    return (
      <img
        src={url}
        alt={`${name} avatar`}
        style={{ width: dimension, height: dimension }}
        className="rounded-full object-cover border border-slate-700"
      />
    );
  }

  return (
    <div
      aria-label={`${name} avatar`}
      className="rounded-full grid place-items-center text-slate-100 border border-slate-700"
      style={{ width: dimension, height: dimension, backgroundImage: bg }}
      title={name}
    >
      <span className="text-sm md:text-base select-none" style={{ lineHeight: 1 }}>
        {emj || initials}
      </span>
    </div>
  );
}
