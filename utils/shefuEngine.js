/**
 * Global Shefu V1 clue engine.
 * The secret answer stays on the server.
 * Clues are based on lightweight keyword classification + a deterministic
 * answer/time signature, so the same room can progressively reveal clues.
 */

const TRAITS = {
  electronics: {
    material: ['metal, plastic, or glass'],
    texture: ['smooth and manufactured'],
    form: ['compact and structured'],
    context: ['used for a practical or electronic function']
  },
  paper: {
    material: ['paper or a thin sheet material'],
    texture: ['light and relatively smooth'],
    form: ['flat, folded, or rectangular'],
    context: ['used for reading, writing, recording, or covering']
  },
  fabric: {
    material: ['fabric or a soft flexible material'],
    texture: ['soft or flexible'],
    form: ['foldable, flat, or malleable'],
    context: ['used for wearing, carrying, covering, or cleaning']
  },
  container: {
    material: ['plastic, metal, glass, or another container material'],
    texture: ['smooth or hard on its outer surface'],
    form: ['hollow, closed, or open-ended'],
    context: ['used to hold, store, or carry something']
  },
  tool: {
    material: ['metal, plastic, or a dense composite'],
    texture: ['firm and durable'],
    form: ['structured, elongated, or purpose-built'],
    context: ['used to perform a physical task']
  },
  natural: {
    material: ['wood, stone, plant, or another natural material'],
    texture: ['irregular, matte, or naturally textured'],
    form: ['organic or irregular'],
    context: ['associated with the natural world']
  },
  wearable: {
    material: ['fabric, leather, plastic, or metal'],
    texture: ['soft, smooth, or flexible'],
    form: ['shaped to fit a person or be worn'],
    context: ['normally carried on or close to the body']
  },
  generic: {
    material: ['a manufactured or naturally occurring material'],
    texture: ['fairly smooth or solid'],
    form: ['compact or clearly structured'],
    context: ['used for an everyday practical purpose']
  }
};

const KEYWORDS = {
  electronics: ['airpod', 'iphone', 'phone', 'mobile', 'laptop', 'computer', 'tablet', 'ipad', 'camera', 'keyboard', 'mouse', 'charger', 'headphone', 'earbud', 'watch', 'remote', 'speaker', 'electronic', 'usb'],
  paper: ['paper', 'book', 'notebook', 'letter', 'card', 'document', 'receipt', 'newspaper', 'magazine', 'photo'],
  fabric: ['cloth', 'towel', 'shirt', 'jacket', 'sock', 'blanket', 'scarf', 'bag', 'fabric', 'curtain'],
  container: ['bottle', 'cup', 'mug', 'box', 'jar', 'container', 'case', 'basket', 'bowl', 'can'],
  tool: ['hammer', 'screwdriver', 'knife', 'scissors', 'tool', 'wrench', 'pen', 'pencil', 'ruler', 'brush'],
  natural: ['stone', 'rock', 'leaf', 'flower', 'wood', 'branch', 'shell', 'fruit', 'seed', 'plant'],
  wearable: ['shoe', 'hat', 'watch', 'ring', 'glasses', 'clothes', 'dress', 'pants', 'belt']
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function classifyAnswer(answer) {
  const normalized = answer.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((word) => normalized.includes(word))) return category;
  }
  return 'generic';
}

function generateModernClue({ answer, roomId, createdAt, clueNumber = 1 }) {
  const category = classifyAnswer(answer);
  const trait = TRAITS[category];
  const signature = hashString(`${answer}|${roomId}|${createdAt}`);
  const index = Math.max(0, clueNumber - 1);
  const pick = (items, salt) => items[(signature + salt + index * 17) % items.length];

  const clues = [
    `The object is likely made from ${pick(trait.material, 3)}.`,
    `Its surface or feel is ${pick(trait.texture, 11)}.`,
    `Its form is likely ${pick(trait.form, 23)}.`,
    `It is ${pick(trait.context, 37)}.`
  ];

  return {
    clueNumber,
    category,
    clue: clues[Math.min(index, clues.length - 1)]
  };
}

function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[“”‘’'"`]/g, '')
    .replace(/\s+/g, ' ');
}

function isGuessCorrect(guess, answer) {
  return normalizeAnswer(guess) === normalizeAnswer(answer);
}

module.exports = { generateModernClue, normalizeAnswer, isGuessCorrect };
