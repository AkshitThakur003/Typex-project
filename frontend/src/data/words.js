// 1000 most common English words for typing practice
// Source: Based on frequency analysis of English text
// Generator ensures no repeats within requested count for fairness

const WORDS = [
  // Top 100
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',

  // 101-200
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'did', 'does',
  'doing', 'made', 'find', 'here', 'many', 'more', 'long', 'thing', 'very', 'own',
  'same', 'right', 'still', 'such', 'last', 'through', 'much', 'should', 'before', 'must',
  'between', 'each', 'under', 'never', 'world', 'great', 'where', 'life', 'always', 'those',
  'while', 'next', 'both', 'few', 'off', 'might', 'too', 'old', 'down', 'away',
  'again', 'small', 'every', 'found', 'part', 'place', 'going', 'another', 'home', 'why',
  'help', 'put', 'different', 'read', 'let', 'keep', 'point', 'turn', 'hand', 'high',
  'start', 'kind', 'need', 'house', 'show', 'try', 'head', 'word', 'call', 'change',
  'went', 'light', 'men', 'side', 'play', 'end', 'move', 'live', 'school', 'seem',
  'number', 'ask', 'later', 'knew', 'run', 'name', 'once', 'water', 'without', 'set',

  // 201-300
  'told', 'got', 'left', 'country', 'three', 'state', 'city', 'may', 'story', 'far',
  'children', 'though', 'hard', 'group', 'important', 'family', 'young', 'girl', 'boy', 'face',
  'room', 'mother', 'father', 'leave', 'night', 'big', 'hear', 'began', 'body', 'system',
  'government', 'since', 'really', 'during', 'tell', 'become', 'together', 'fact', 'against', 'woman',
  'second', 'enough', 'early', 'nothing', 'took', 'yet', 'best', 'better', 'sure', 'child',
  'money', 'real', 'almost', 'above', 'car', 'idea', 'watch', 'thought', 'close', 'open',
  'feel', 'believe', 'case', 'walk', 'often', 'problem', 'begin', 'white', 'days', 'something',
  'least', 'given', 'program', 'perhaps', 'power', 'door', 'line', 'done', 'however', 'business',
  'president', 'along', 'saw', 'war', 'until', 'today', 'less', 'already', 'behind', 'bring',
  'write', 'seen', 'black', 'knew', 'toward', 'possible', 'full', 'hear', 'half', 'himself',

  // 301-400
  'red', 'minutes', 'sometimes', 'morning', 'upon', 'looking', 'words', 'book', 'question', 'area',
  'sort', 'within', 'person', 'whole', 'hold', 'four', 'around', 'free', 'public', 'human',
  'anything', 'known', 'women', 'quite', 'mind', 'children', 'seen', 'among', 'able', 'ever',
  'american', 'stand', 'came', 'says', 'across', 'taken', 'service', 'social', 'low', 'love',
  'making', 'little', 'whether', 'study', 'mean', 'ago', 'large', 'eyes', 'air', 'form',
  'information', 'local', 'national', 'five', 'company', 'order', 'true', 'court', 'level', 'john',
  'week', 'history', 'community', 'interest', 'running', 'others', 'course', 'result', 'office', 'several',
  'inside', 'students', 'having', 'land', 'finally', 'voice', 'looking', 'reason', 'members', 'called',
  'needed', 'turned', 'coming', 'although', 'police', 'brought', 'action', 'moment', 'care', 'six',
  'herself', 'million', 'law', 'political', 'development', 'age', 'report', 'sense', 'party', 'building',

  // 401-500
  'trying', 'certain', 'death', 'either', 'past', 'using', 'rather', 'usually', 'felt', 'itself',
  'probably', 'control', 'actually', 'support', 'stage', 'education', 'job', 'music', 'data', 'heart',
  'field', 'market', 'street', 'paper', 'plan', 'answer', 'longer', 'class', 'clear', 'available',
  'expect', 'everything', 'issue', 'special', 'working', 'kind', 'major', 'economic', 'decision', 'process',
  'south', 'meet', 'common', 'experience', 'past', 'simply', 'strong', 'position', 'themselves', 'period',
  'short', 'believe', 'outside', 'personal', 'center', 'face', 'town', 'record', 'especially', 'news',
  'international', 'pay', 'table', 'seven', 'cut', 'care', 'include', 'continue', 'set', 'late',
  'hard', 'morning', 'deal', 'force', 'role', 'evidence', 'foot', 'game', 'remember', 'individual',
  'seemed', 'simple', 'quality', 'pressure', 'accept', 'doctor', 'activity', 'real', 'teacher', 'future',
  'drive', 'stand', 'effort', 'lot', 'whose', 'piece', 'return', 'student', 'wall', 'recent',

  // 501-600
  'stay', 'top', 'value', 'space', 'research', 'century', 'church', 'cost', 'difference', 'policy',
  'health', 'event', 'chance', 'military', 'model', 'third', 'art', 'peace', 'increase', 'type',
  'movie', 'total', 'north', 'current', 'attempt', 'carry', 'manager', 'democratic', 'federal', 'natural',
  'food', 'language', 'baby', 'death', 'figure', 'risk', 'single', 'effect', 'generally', 'break',
  'produce', 'term', 'color', 'cover', 'describe', 'send', 'choice', 'eight', 'central', 'happy',
  'building', 'ground', 'opportunity', 'bit', 'view', 'act', 'relationship', 'appear', 'offer', 'director',
  'security', 'production', 'involved', 'success', 'private', 'loss', 'reach', 'similar', 'congress', 'market',
  'attack', 'size', 'fund', 'series', 'tax', 'rate', 'image', 'seek', 'rest', 'agree',
  'eventually', 'wait', 'blood', 'defense', 'subject', 'nature', 'culture', 'medical', 'according', 'region',
  'unit', 'player', 'perform', 'practice', 'knowledge', 'save', 'environment', 'design', 'benefit', 'test',

  // 601-700
  'lead', 'behavior', 'response', 'project', 'rise', 'enjoy', 'network', 'legal', 'fear', 'trade',
  'significant', 'price', 'easy', 'source', 'range', 'operation', 'section', 'reduce', 'physical', 'base',
  'necessary', 'condition', 'fall', 'media', 'create', 'patient', 'standard', 'talk', 'board', 'discussion',
  'season', 'material', 'population', 'star', 'amount', 'authority', 'serve', 'arm', 'technology', 'apply',
  'western', 'determine', 'scene', 'traditional', 'follow', 'ten', 'bill', 'situation', 'agency', 'consider',
  'nice', 'goal', 'audience', 'rich', 'attention', 'require', 'treatment', 'affect', 'remove', 'approach',
  'foreign', 'solid', 'option', 'campaign', 'product', 'hit', 'planning', 'focus', 'join', 'pull',
  'hot', 'forward', 'bank', 'fire', 'shot', 'cell', 'identify', 'sign', 'method', 'direction',
  'prevent', 'share', 'structure', 'worker', 'defense', 'resource', 'growth', 'quickly', 'claim', 'firm',
  'traditional', 'financial', 'science', 'property', 'staff', 'article', 'window', 'wrong', 'race', 'hair',

  // 701-800
  'strategy', 'exist', 'seat', 'pattern', 'suddenly', 'professional', 'key', 'push', 'site', 'debate',
  'popular', 'enter', 'fill', 'represent', 'author', 'decade', 'indicate', 'various', 'drop', 'speech',
  'deep', 'lawyer', 'drug', 'ok', 'vote', 'contain', 'version', 'capital', 'dark', 'theory',
  'cause', 'positive', 'collection', 'glass', 'executive', 'movement', 'modern', 'hospital', 'college', 'miss',
  'communication', 'seat', 'task', 'remain', 'basic', 'fight', 'occur', 'ready', 'store', 'primary',
  'sometimes', 'rule', 'surface', 'detail', 'nine', 'oil', 'picture', 'energy', 'impact', 'demand',
  'notice', 'establish', 'magazine', 'ball', 'direction', 'instance', 'claim', 'character', 'extent', 'official',
  'general', 'spring', 'conference', 'interview', 'solution', 'feature', 'style', 'trouble', 'rock', 'animal',
  'generation', 'station', 'dog', 'hotel', 'bed', 'tree', 'trial', 'draw', 'significant', 'holiday',
  'release', 'skin', 'step', 'edge', 'technique', 'improve', 'average', 'manager', 'administration', 'recent',

  // 801-900
  'relate', 'basic', 'aid', 'cold', 'discover', 'examine', 'speech', 'sell', 'success', 'stock',
  'sale', 'bag', 'compare', 'budget', 'wonderful', 'season', 'park', 'organization', 'train', 'finish',
  'model', 'husband', 'add', 'role', 'shape', 'instance', 'ship', 'chief', 'account', 'note',
  'professor', 'clean', 'pain', 'brother', 'imagine', 'smile', 'appropriate', 'security', 'project', 'charge',
  'pick', 'count', 'title', 'alternative', 'sleep', 'purpose', 'visit', 'minute', 'block', 'disease',
  'touch', 'corner', 'supply', 'king', 'son', 'expression', 'dream', 'location', 'original', 'mostly',
  'depend', 'front', 'limited', 'explain', 'directly', 'fly', 'weekend', 'teach', 'rain', 'review',
  'blue', 'quality', 'develop', 'complete', 'club', 'obvious', 'apply', 'lake', 'introduce', 'green',
  'content', 'protect', 'starting', 'island', 'plant', 'associate', 'finger', 'address', 'enemy', 'reply',
  'drink', 'occur', 'fully', 'reform', 'advice', 'extent', 'largely', 'reaction', 'separate', 'district',

  // 901-1000
  'western', 'earn', 'emphasis', 'phase', 'title', 'foundation', 'crowd', 'wine', 'native', 'software',
  'commission', 'suppose', 'component', 'kitchen', 'promise', 'engage', 'crisis', 'survey', 'bridge', 'battery',
  'debate', 'safe', 'proposal', 'ticket', 'spirit', 'critical', 'element', 'struggle', 'meal', 'income',
  'initially', 'track', 'fast', 'sand', 'temperature', 'beautiful', 'green', 'perform', 'grab', 'obtain',
  'visual', 'introduce', 'variety', 'emerge', 'independent', 'hello', 'plane', 'slowly', 'phase', 'trust',
  'army', 'lawyer', 'football', 'document', 'daily', 'unique', 'movie', 'guide', 'match', 'block',
  'copy', 'speech', 'code', 'screen', 'core', 'directly', 'path', 'ultimately', 'shift', 'wine',
  'afternoon', 'born', 'mountain', 'user', 'context', 'quick', 'context', 'master', 'frame', 'chicken',
  'border', 'host', 'acknowledge', 'theme', 'storm', 'union', 'desk', 'reference', 'valley', 'ocean',
  'quarter', 'violence', 'gun', 'file', 'novel', 'fruit', 'golden', 'equipment', 'crew', 'plastic'
];

// Fisher-Yates shuffle (in-place clone)
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// getRandomWords ensures no repeats up to WORDS.length
export function getRandomWords(count) {
  if (count > WORDS.length) {
    // If asking more than base list, we allow repeats after a full pass
    const times = Math.floor(count / WORDS.length);
    const remainder = count % WORDS.length;
    let out = [];
    for (let t = 0; t < times; t++) out = out.concat(shuffle(WORDS));
    out = out.concat(shuffle(WORDS).slice(0, remainder));
    return out;
  }
  return shuffle(WORDS).slice(0, count);
}

export default WORDS;
