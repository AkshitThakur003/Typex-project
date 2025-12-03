// Shared avatar emoji mapping - single source of truth
export const AVATAR_EMOJI = {
  'emoji-rocket': '🚀',
  'emoji-lightning': '⚡',
  'emoji-keyboard': '⌨️',
  'emoji-fire': '🔥',
  'emoji-star': '⭐',
  'emoji-wave': '🌊',
  'emoji-sparkles': '✨',
  'emoji-owl': '🦉',
};

// Avatar options with labels (for settings/dropdowns)
export const AVATAR_OPTIONS = {
  'emoji-rocket': '🚀 Rocket',
  'emoji-lightning': '⚡ Lightning',
  'emoji-keyboard': '⌨️ Keyboard',
  'emoji-fire': '🔥 Fire',
  'emoji-star': '⭐ Star',
  'emoji-wave': '🌊 Wave',
  'emoji-sparkles': '✨ Sparkles',
  'emoji-owl': '🦉 Owl',
};

// Get emoji from avatar choice key
export function getAvatarEmoji(avatarChoice) {
  return AVATAR_EMOJI[avatarChoice] || null;
}

// Get avatar display (emoji or initial) for a user object
export function getAvatarDisplay(user) {
  if (!user) return { type: 'initial', value: 'U' };
  
  // Priority: avatarUrl > avatarChoice emoji > initials
  if (user.avatarUrl || user.preferences?.avatarUrl) {
    return { type: 'image', value: user.avatarUrl || user.preferences?.avatarUrl };
  }
  
  const avatarChoice = user.avatarChoice || user.preferences?.avatarChoice;
  if (avatarChoice && AVATAR_EMOJI[avatarChoice]) {
    return { type: 'emoji', value: AVATAR_EMOJI[avatarChoice] };
  }
  
  // Fallback to initials
  const initial = (user.username || user.name || 'U').slice(0, 1).toUpperCase();
  return { type: 'initial', value: initial };
}

