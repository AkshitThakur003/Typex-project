const EASY = [
  'The quick brown fox jumps over the lazy dog.',
  'Typing is a useful skill for every developer.',
];
const MEDIUM = [
  'Practice makes perfect, especially when you focus on accuracy and rhythm.',
  'Consistency and deliberate practice lead to measurable improvement.',
];
const HARD = [
  'Sphinx of black quartz, judge my vow; pack my box with five dozen liquor jugs.',
  'Grumpy wizards make toxic brew for the evil Queen and Jack in blazing fury.',
];

function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function getTextByDifficulty(diff='easy') {
  const d = String(diff || 'easy').toLowerCase();
  if (d === 'hard') return pickRandom(HARD);
  if (d === 'medium') return pickRandom(MEDIUM);
  return pickRandom(EASY);
}

module.exports = { getTextByDifficulty };
