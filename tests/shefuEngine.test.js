const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getLocalTimeParts,
  getHourBranchNumber,
  getYearBranchNumber,
  flipTrigramLine,
  calculateHexagram,
  normalizeAnswer,
  isGuessCorrect
} = require('../utils/shefuEngine');

test('local time extraction respects IANA timezone boundaries', () => {
  // 2026-01-01 00:30 UTC is still 2025-12-31 in Los Angeles.
  const parts = getLocalTimeParts('America/Los_Angeles', Date.UTC(2026, 0, 1, 0, 30));
  assert.deepEqual(
    { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour },
    { year: 2025, month: 12, day: 31, hour: 16 }
  );
});

test('earthly branch hour boundaries include Zi across midnight', () => {
  assert.equal(getHourBranchNumber(23), 1);
  assert.equal(getHourBranchNumber(0), 1);
  assert.equal(getHourBranchNumber(1), 2);
  assert.equal(getHourBranchNumber(2), 2);
  assert.equal(getHourBranchNumber(3), 3);
});

test('changing a line also works for the all-yin trigram', () => {
  assert.equal(flipTrigramLine(8, 1), 4);
});

test('lunar year maps to its earthly branch number', () => {
  assert.equal(getYearBranchNumber(2024), 5); // Chen
  assert.equal(getYearBranchNumber(2026), 7); // Wu
});

test('canonical time-calculation example produces expected trigrams and moving line', () => {
  // Chen year (5), lunar month 12, lunar day 17, Shen hour (9).
  // Upper: 34 mod 8 = 2; lower: 43 mod 8 = 3; moving line: 43 mod 6 = 1.
  const result = calculateHexagram({ year: 2024, month: 12, day: 17 }, 16);
  assert.equal(result.yearBranch, 5);
  assert.equal(result.hourBranch, 9);
  assert.equal(result.upperIndex, 2);
  assert.equal(result.lowerIndex, 3);
  assert.equal(result.movingLine, 1);
  assert.equal(result.changedLowerIndex, 7);
});

test('zero remainders map to trigram 8 and moving line 6', () => {
  // Year branch 5 + month 1 + day 2 = 8; hour branch 1 gives total 9.
  const result = calculateHexagram({ year: 2024, month: 1, day: 2 }, 23);
  assert.equal(result.upperIndex, 8);
  assert.equal(result.lowerIndex, 1);
  assert.equal(result.movingLine, 3);

  // Pick a date whose total is divisible by 6 to exercise the line fallback.
  const lineSix = calculateHexagram({ year: 2024, month: 1, day: 5 }, 23);
  assert.equal(lineSix.movingLine, 6);
});

test('guess normalization remains unchanged', () => {
  assert.equal(normalizeAnswer('  Modern  Times '), 'modern times');
  assert.equal(isGuessCorrect('  MODERN   TIMES ', 'Modern Times'), true);
});
