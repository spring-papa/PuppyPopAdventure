export type MultiplicationQuestion = {
  id: string;
  dan: number;
  multiplier: number;
  answer: number;
};

const DAN_VALUES = [2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLIERS = [2, 3, 4, 5, 6, 7, 8, 9];

export const GATE_QUESTION_COUNT = 5;

export function createGateQuestions(stageId: number, count = GATE_QUESTION_COUNT) {
  const allQuestions = DAN_VALUES.flatMap((dan) =>
    MULTIPLIERS.map((multiplier) => ({
      id: `${stageId}-${dan}x${multiplier}`,
      dan,
      multiplier,
      answer: dan * multiplier,
    })),
  );
  return shuffleWithSeed(allQuestions, stageId * 97 + Date.now()).slice(0, count);
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const next = [...items];
  let value = seed || 1;

  for (let index = next.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) % 4294967296;
    const swapIndex = value % (index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}
