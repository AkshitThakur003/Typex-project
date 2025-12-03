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

const CODE = [
  'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }',
  'const user = { name: "John", age: 30, email: "john@example.com" };',
  'if (response.status === 200) { console.log("Success:", response.data); } else { throw new Error("Failed"); }',
  'const numbers = [1, 2, 3, 4, 5].map(n => n * 2).filter(n => n > 5);',
  'async function fetchData(url) { const response = await fetch(url); return await response.json(); }',
  'class User { constructor(name) { this.name = name; } greet() { return `Hello, ${this.name}!`; } }',
  'const result = data.filter(item => item.active).sort((a, b) => a.date - b.date);',
  'try { await processPayment(order); } catch (error) { logger.error("Payment failed:", error); }',
];

const QUOTE = [
  'The only way to do great work is to love what you do.',
  'Innovation distinguishes between a leader and a follower.',
  'The future belongs to those who believe in the beauty of their dreams.',
  'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  'The way to get started is to quit talking and begin doing.',
  'You learn more from failure than from success. Don\'t let it stop you. Failure builds character.',
  'If you are working on something exciting that you really care about, you don\'t have to be pushed. The vision pulls you.',
  'People who are crazy enough to think they can change the world, are the ones who do.',
  'The greatest glory in living lies not in never falling, but in rising every time we fall.',
  'In the middle of difficulty lies opportunity.',
  'A person who never made a mistake never tried anything new.',
  'The secret of getting ahead is getting started.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
  'Whether you think you can or you think you can\'t, you\'re right.',
  'Go confidently in the direction of your dreams. Live the life you have imagined.',
];

function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function getTextByDifficulty(diff='easy') {
  const d = String(diff || 'easy').toLowerCase();
  if (d === 'hard') return pickRandom(HARD);
  if (d === 'medium') return pickRandom(MEDIUM);
  if (d === 'code') return pickRandom(CODE);
  if (d === 'quote') return pickRandom(QUOTE);
  return pickRandom(EASY);
}

module.exports = { getTextByDifficulty };
