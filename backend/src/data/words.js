// Simple words list and helpers for generating custom-length texts
// This mirrors the frontend words list but is scoped to the backend.

const WORDS = [
  'the','be','to','of','and','a','in','that','have','I','it','for','not','on','with','he','as','you','do','at',
  'this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their',
  'what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know',
  'take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its',
  'over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these',
  'give','day','most','us','is','are','was','were','had','did','has','been','more','many','few','each','own','same','place','great',
  'long','small','large','high','low','old','young','early','late','within','without','between','under','around','across','through','during',
  'before','after','above','below','near','far','right','left','still','never','always','often','sometimes','together','against','toward','upon',
  'study','learn','world','family','friend','school','home','house','city','country','state','story','music','movie','game','food','water','air','fire',
  'earth','space','light','dark','sound','voice','mind','heart','hand','eye','face','head','foot','road','street','car','train','plane','ship','boat',
  'river','mountain','forest','tree','leaf','flower','animal','bird','dog','cat','horse','fish','rain','snow','wind','storm','cloud','sky','sun',
  'moon','star','south','north','east','west','sea','ocean','island','beach','stone','rock','gold','silver','money','market','shop','workshop',
  'doctor','teacher','student','artist','writer','reader','player','leader','manager','worker','team','group','party','meeting','office','company','job','task','goal',
  'start','stop','begin','end','open','close','build','break','move','stand','sit','run','walk','jump','sleep','dream','think','create','design','code',
  'debug','test','deploy','update','release','version','feature','bug','issue','commit','push','pull','merge','branch','review','accept','reject','plan','report'
];

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomWords(count) {
  if (count > WORDS.length) {
    const times = Math.floor(count / WORDS.length);
    const remainder = count % WORDS.length;
    let out = [];
    for (let t = 0; t < times; t++) out = out.concat(shuffle(WORDS));
    out = out.concat(shuffle(WORDS).slice(0, remainder));
    return out;
  }
  return shuffle(WORDS).slice(0, count);
}

function makeTextFromWords(count = 25) {
  const safe = Math.max(5, Math.min(500, Number(count) || 25));
  return getRandomWords(safe).join(' ');
}

module.exports = { WORDS, getRandomWords, makeTextFromWords };
