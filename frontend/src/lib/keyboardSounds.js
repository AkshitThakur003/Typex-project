// Keyboard sound utility for TypeX
// Uses Web Audio API to generate keyboard sounds without external files

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const SOUND_PROFILES = {
  mechanical: {
    frequency: 800,
    duration: 0.05,
    type: 'square',
    gain: 0.08,
  },
  membrane: {
    frequency: 400,
    duration: 0.03,
    type: 'sine',
    gain: 0.06,
  },
  typewriter: {
    frequency: 1200,
    duration: 0.08,
    type: 'sawtooth',
    gain: 0.05,
  },
  soft: {
    frequency: 300,
    duration: 0.02,
    type: 'sine',
    gain: 0.04,
  },
  clicky: {
    frequency: 1500,
    duration: 0.04,
    type: 'square',
    gain: 0.07,
  },
};

export const SOUND_OPTIONS = [
  { key: 'off', label: 'Off' },
  { key: 'mechanical', label: 'Mechanical' },
  { key: 'membrane', label: 'Membrane' },
  { key: 'typewriter', label: 'Typewriter' },
  { key: 'soft', label: 'Soft' },
  { key: 'clicky', label: 'Clicky' },
];

let lastPlayTime = 0;
const MIN_INTERVAL = 20; // Minimum ms between sounds to prevent audio glitches

export function playKeySound(soundType = 'mechanical', volume = 0.5) {
  if (!audioContext || soundType === 'off' || !SOUND_PROFILES[soundType]) return;
  
  // Throttle rapid key presses
  const now = Date.now();
  if (now - lastPlayTime < MIN_INTERVAL) return;
  lastPlayTime = now;

  // Resume audio context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const profile = SOUND_PROFILES[soundType];
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(profile.frequency + Math.random() * 100 - 50, audioContext.currentTime);
  
  const finalGain = profile.gain * volume;
  gainNode.gain.setValueAtTime(finalGain, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + profile.duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + profile.duration);
}

export function playErrorSound(volume = 0.5) {
  if (!audioContext) return;
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.05 * volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

