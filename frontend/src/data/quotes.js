// Famous quotes and sentences for quote mode practice
// Each quote is a complete sentence or paragraph for typing practice

export const QUOTES = [
  "The quick brown fox jumps over the lazy dog.",
  "Practice makes perfect, especially when you focus on accuracy and rhythm.",
  "Typing speed comes from consistent practice and proper technique.",
  "The only way to do great work is to love what you do.",
  "Innovation distinguishes between a leader and a follower.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "It is during our darkest moments that we must focus to see the light.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Don't let yesterday take up too much of today.",
  "You learn more from failure than from success. Don't let it stop you. Failure builds character.",
  "If you are working on something exciting that you really care about, you don't have to be pushed. The vision pulls you.",
  "People who are crazy enough to think they can change the world, are the ones who do.",
  "We may encounter many defeats but we must not be defeated.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall.",
  "In the end, we will remember not the words of our enemies, but the silence of our friends.",
  "Life is what happens to you while you're busy making other plans.",
  "The way to get started is to quit talking and begin doing.",
  "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
  "It is during our darkest moments that we must focus to see the light.",
  "Whoever is happy will make others happy too.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "In the middle of difficulty lies opportunity.",
  "I would rather die of passion than of boredom.",
  "A person who never made a mistake never tried anything new.",
  "The person who says it cannot be done should not interrupt the person who is doing it.",
  "The way to get started is to quit talking and begin doing.",
  "The secret of getting ahead is getting started.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You miss 100 percent of the shots you don't take.",
  "Whether you think you can or you think you can't, you're right.",
  "The two most important days in your life are the day you are born and the day you find out why.",
  "Go confidently in the direction of your dreams. Live the life you have imagined.",
  "The person who has confidence gains the confidence of others.",
  "The only impossible journey is the one you never begin.",
  "In this life we cannot do great things. We can only do small things with great love.",
  "Only a life lived for others is a life worthwhile.",
  "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate.",
  "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.",
  "Life is what happens to you while you're busy making other plans.",
];

// Fisher-Yates shuffle
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Get random quote(s)
export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// Get multiple random quotes (shuffled)
export function getRandomQuotes(count = 1) {
  return shuffle(QUOTES).slice(0, Math.min(count, QUOTES.length));
}

export default QUOTES;

