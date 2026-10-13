/**
 * Global Shefu — local-time Meihua-style clue engine.
 *
 * This module implements one explicit time-based convention:
 *   year = earthly-branch number of the lunar year (Zi=1 ... Hai=12)
 *   month/day = lunar month/day numbers
 *   hour = local earthly-branch hour (Zi=1 ... Hai=12)
 *   upper trigram = (year + month + day) mod 8, with 0 => 8
 *   lower trigram = (year + month + day + hour) mod 8, with 0 => 8
 *   moving line = (year + month + day + hour) mod 6, with 0 => 6
 *
 * Each generateModernClue() call reads Date.now() afresh. The caller must
 * supply the player's IANA timezone (e.g. Asia/Singapore).
 *
 * This is a documented implementation convention, not a claim that all
 * Meihua Yishu schools use identical calendrical or interpretive rules.
 */

const TRAITS = {
  1: {
    material: 'metal or a rigid engineered composite',
    texture: 'smooth, solid, and durable',
    form: 'structured or circular',
    context: 'often carried for utility or precision'
  },
  2: {
    material: 'plastic, soft metal, or a refined composite',
    texture: 'lightweight with polished edges',
    form: 'compact and portable',
    context: 'associated with everyday personal interaction'
  },
  3: {
    material: 'glass, electronic components, or a glossy finish',
    texture: 'sleek, reflective, or light-emitting',
    form: 'flat or electronic-device shaped',
    context: 'related to optics, energy, or modern technology'
  },
  4: {
    material: 'wood, complex plastics, or mechanical parts',
    texture: 'textured, dynamic, or structural',
    form: 'elongated or mechanically shaped',
    context: 'related to motion, sound, or physical function'
  },
  5: {
    material: 'paper, fabric, organic material, or thin sheets',
    texture: 'flexible, light, or fibrous',
    form: 'flat, folded, or linear',
    context: 'often used for reading, writing, or covering'
  },
  6: {
    material: 'flexible plastic or a dark, fluid-resistant material',
    texture: 'smooth, cool-looking, or moisture-resistant',
    form: 'hollow, sealed, or designed to hold contents',
    context: 'associated with storage, hydration, or containment'
  },
  7: {
    material: 'stone, dense ceramic, or thick rigid plastic',
    texture: 'firm, matte, or sturdy',
    form: 'blocky, stable, or compact',
    context: 'designed to remain stationary or protect contents'
  },
  8: {
    material: 'cloth, leather, soft rubber, or natural fabric',
    texture: 'soft, flexible, or cloth-like',
    form: 'malleable, pouch-like, or open-ended',
    context: 'used for holding, carrying, or wrapping other items'
  }
};

// Three-line bit patterns, with bit 0 representing the bottom line.
// Numeric order is the conventional Early-Heaven trigram numbering:
// 1 Qian, 2 Dui, 3 Li, 4 Zhen, 5 Xun, 6 Kan, 7 Gen, 8 Kun.
const TRIGRAM_BITS = {
  1: 0b111,
  2: 0b011,
  3: 0b101,
  4: 0b001,
  5: 0b110,
  6: 0b010,
  7: 0b100,
  8: 0b000
};

const BITS_TO_TRIGRAM = Object.fromEntries(
  Object.entries(TRIGRAM_BITS).map(([number, bits]) => [bits, Number(number)])
);

const BRANCH_NAMES = [
  'Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si',
  'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'
];

function normalizeMod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getHourBranchNumber(hour) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError('hour must be an integer from 0 to 23');
  }
  // Zi hour spans 23:00–00:59; the remaining branches span two hours each.
  return Math.floor(((hour + 1) % 24) / 2) + 1;
}

function getLocalTimeParts(timeZone, timestamp = Date.now()) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) {
    throw new TypeError('A player IANA timezone is required.');
  }

  // Validate the IANA timezone before formatting.
  try {
    new Intl.DateTimeFormat('en', { timeZone });
  } catch {
    throw new RangeError(`Invalid IANA timezone: ${timeZone}`);
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(timestamp));

  const values = Object.fromEntries(
    parts
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

function getLunarDate(localTime) {
  // Lazy load keeps pure formula tests runnable without installing dependencies.
  const { Solar } = require('lunar-javascript');
  const solar = Solar.fromYmdHms(
    localTime.year,
    localTime.month,
    localTime.day,
    localTime.hour,
    localTime.minute,
    localTime.second
  );
  const lunar = solar.getLunar();

  // The library reports leap months as negative month numbers. This engine
  // treats a leap month as its corresponding numbered lunar month.
  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),
    day: lunar.getDay()
  };
}

function getYearBranchNumber(lunarYear) {
  if (!Number.isInteger(lunarYear)) {
    throw new TypeError('lunarYear must be an integer');
  }
  // Year 4 CE is treated as a Zi year for this conventional cycle mapping.
  return normalizeMod(lunarYear - 4, 12) + 1;
}

function flipTrigramLine(trigramNumber, lineNumber) {
  if (!(trigramNumber in TRIGRAM_BITS) || !Number.isInteger(lineNumber) || lineNumber < 1 || lineNumber > 3) {
    throw new RangeError('Invalid trigram number or line number');
  }
  const changedBits = TRIGRAM_BITS[trigramNumber] ^ (1 << (lineNumber - 1));
  return BITS_TO_TRIGRAM[changedBits];
}

function calculateHexagram(lunarDate, hour) {
  if (!lunarDate || !Number.isInteger(lunarDate.year) ||
      !Number.isInteger(lunarDate.month) || lunarDate.month < 1 || lunarDate.month > 12 ||
      !Number.isInteger(lunarDate.day) || lunarDate.day < 1 || lunarDate.day > 30) {
    throw new TypeError('lunarDate must contain a valid lunar year, month, and day');
  }

  const yearBranch = getYearBranchNumber(lunarDate.year);
  const hourBranch = getHourBranchNumber(hour);
  const dateSum = yearBranch + lunarDate.month + lunarDate.day;
  const totalSum = dateSum + hourBranch;

  const upperIndex = normalizeMod(dateSum, 8) || 8;
  const lowerIndex = normalizeMod(totalSum, 8) || 8;
  const movingLine = normalizeMod(totalSum, 6) || 6;

  let changedUpperIndex = upperIndex;
  let changedLowerIndex = lowerIndex;

  if (movingLine <= 3) {
    changedLowerIndex = flipTrigramLine(lowerIndex, movingLine);
  } else {
    changedUpperIndex = flipTrigramLine(upperIndex, movingLine - 3);
  }

  return {
    yearBranch,
    hourBranch,
    upperIndex,
    lowerIndex,
    movingLine,
    changedUpperIndex,
    changedLowerIndex
  };
}

function generateModernClue({ timeZone, clueNumber = 1 }) {
  if (!Number.isInteger(clueNumber) || clueNumber < 1 || clueNumber > 4) {
    throw new RangeError('clueNumber must be an integer from 1 to 4');
  }

  // Deliberately read the clock anew for each clue request.
  const timestamp = Date.now();
  const localTime = getLocalTimeParts(timeZone, timestamp);
  const lunarDate = getLunarDate(localTime);
  const hexagram = calculateHexagram(lunarDate, localTime.hour);

  const upperTrait = TRAITS[hexagram.upperIndex];
  const lowerTrait = TRAITS[hexagram.lowerIndex];
  const changedTrait = TRAITS[
    hexagram.movingLine <= 3
      ? hexagram.changedLowerIndex
      : hexagram.changedUpperIndex
  ];

  const clues = [
    `The object may be made from ${upperTrait.material}.`,
    `Its surface or feel may be ${lowerTrait.texture}.`,
    `Its form may be ${changedTrait.form}.`,
    `It may be ${changedTrait.context}.`
  ];

  return {
    clueNumber,
    clue: clues[clueNumber - 1],
    timestamp,
    timeZone,
    localTime,
    // Keep this metadata server-side; do not return it from the public API.
    metadata: {
      lunarDate,
      yearBranchNumber: hexagram.yearBranch,
      hourBranch: BRANCH_NAMES[hexagram.hourBranch - 1],
      upperIndex: hexagram.upperIndex,
      lowerIndex: hexagram.lowerIndex,
      movingLine: hexagram.movingLine,
      changedUpperIndex: hexagram.changedUpperIndex,
      changedLowerIndex: hexagram.changedLowerIndex
    }
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

module.exports = {
  generateModernClue,
  getLocalTimeParts,
  getHourBranchNumber,
  getYearBranchNumber,
  flipTrigramLine,
  calculateHexagram,
  normalizeAnswer,
  isGuessCorrect
};
