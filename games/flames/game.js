/**
 * FLAMES Game Engine
 * The classic Indian school relationship prediction game.
 *
 * Rules:
 * 1. Take two names, convert to lowercase, remove spaces.
 * 2. Cancel out common letters (one-for-one matching).
 * 3. Count the total remaining (uncancelled) letters.
 * 4. Cycle through F-L-A-M-E-S using that count, eliminating the landed-on
 *    letter each round. Repeat until one letter remains.
 */

export const FLAMES_LETTERS = ["F", "L", "A", "M", "E", "S"];

export const FLAMES_MEANINGS = {
  F: "Friends",
  L: "Love",
  A: "Affection",
  M: "Marriage",
  E: "Enemies",
  S: "Siblings",
};

export const FLAMES_EMOJIS = {
  F: "\u{1F91D}",
  L: "\u2764\uFE0F",
  A: "\u{1F970}",
  M: "\u{1F492}",
  E: "\u{1F525}",
  S: "\u{1F46F}",
};

/**
 * Cancel common letters between two names.
 * Returns arrays of { char, cancelled } for each name and the remaining count.
 */
export function cancelCommonLetters(name1, name2) {
  const a = name1.toLowerCase().replace(/\s+/g, "").split("");
  const b = name2.toLowerCase().replace(/\s+/g, "").split("");

  const usedA = new Array(a.length).fill(false);
  const usedB = new Array(b.length).fill(false);

  // For each letter in a, find a matching uncancelled letter in b
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (!usedB[j] && a[i] === b[j]) {
        usedA[i] = true;
        usedB[j] = true;
        break;
      }
    }
  }

  const lettersA = a.map((ch, i) => ({ char: ch, cancelled: usedA[i] }));
  const lettersB = b.map((ch, i) => ({ char: ch, cancelled: usedB[i] }));

  const remainingCount =
    usedA.filter((x) => !x).length + usedB.filter((x) => !x).length;

  return { lettersA, lettersB, remainingCount };
}

/**
 * Run the FLAMES elimination and return every step.
 *
 * Each step: { letters (current ring), index (where count landed), eliminated }
 * The final step has only one letter left — that's the result.
 */
export function eliminateFlames(remainingCount) {
  let ring = [...FLAMES_LETTERS];
  const steps = [];
  let startIndex = 0;

  while (ring.length > 1) {
    // Count through the ring (1-based counting)
    const landIndex = (startIndex + remainingCount - 1) % ring.length;
    const eliminated = ring[landIndex];

    steps.push({
      letters: [...ring],
      countFrom: startIndex,
      landIndex,
      eliminated,
    });

    ring.splice(landIndex, 1);

    // Next round starts from the position after the eliminated letter
    // Since we spliced, landIndex now points to the next element (or wraps)
    startIndex = landIndex % ring.length;
  }

  return { resultLetter: ring[0], steps };
}

/**
 * Main entry point — calculate the FLAMES result for two names.
 */
export function calculateFlames(name1, name2) {
  const { lettersA, lettersB, remainingCount } = cancelCommonLetters(
    name1,
    name2,
  );

  if (remainingCount === 0) {
    // Edge case: identical names — remaining count is 0
    return {
      letter: "L",
      result: FLAMES_MEANINGS["L"],
      emoji: FLAMES_EMOJIS["L"],
      remainingCount: 0,
      lettersA,
      lettersB,
      steps: [],
    };
  }

  const { resultLetter, steps } = eliminateFlames(remainingCount);

  return {
    letter: resultLetter,
    result: FLAMES_MEANINGS[resultLetter],
    emoji: FLAMES_EMOJIS[resultLetter],
    remainingCount,
    lettersA,
    lettersB,
    steps,
  };
}
