import { AXES, NULL_VALUES, ORDINAL_AXES, type Axis } from "./tags";
import type { Answer, MenuItem, Question, QuestionOption } from "./types";

/** Most tap targets we'll put on one question screen, before "No preference". */
const MAX_OPTIONS = 4;
export const RESULT_COUNT = 4;
/**
 * A question only earns its tap if the menu is meaningfully bigger than the
 * results screen. Asking someone to narrow five dishes down to four is a tap
 * that buys nothing.
 */
const MIN_ITEMS_TO_ASK = RESULT_COUNT + 2;
/** An axis has to describe most of the menu to be worth a question. */
const MIN_COVERAGE = 0.55;
/**
 * Shannon entropy floor, in bits. An 85/15 split scores ~0.61 and is rejected;
 * 80/20 scores ~0.72 and passes. This is what keeps a spice question off a
 * sushi menu (all items tagged "none" → one distinct value → 0 bits). [M-15]
 */
const MIN_ENTROPY = 0.65;
export const MAX_QUESTIONS = 3;

const isSignal = (axis: Axis, value: string) =>
  !(NULL_VALUES[axis] ?? []).includes(value);

function distribution(items: MenuItem[], axis: Axis): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = item.tags[axis];
    if (!value || !isSignal(axis, value)) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function entropy(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return -weights
    .filter((w) => w > 0)
    .reduce((sum, w) => {
      const p = w / total;
      return sum + p * Math.log2(p);
    }, 0);
}

/**
 * How much this axis would actually split *this* menu. Returns null when the
 * axis carries no real signal, which is how axes get excluded rather than
 * asked-and-useless.
 */
export function scoreAxis(
  items: MenuItem[],
  axis: Axis,
): { score: number; options: QuestionOption[] } | null {
  const counts = distribution(items, axis);
  if (counts.size < 2) return null;

  const ranked = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const tagged = ranked.reduce((sum, o) => sum + o.count, 0);
  const coverage = tagged / items.length;
  if (coverage < MIN_COVERAGE) return null;

  const options = ranked.slice(0, MAX_OPTIONS);
  if (options.length < 2) return null;
  // All-singleton buckets are noise, not a useful split.
  if (options[0].count < 2) return null;

  // Items outside the shown options still exist; they're only reachable via
  // "No preference", so they count as one lump when measuring the split.
  const rest = items.length - options.reduce((sum, o) => sum + o.count, 0);
  const h = entropy([...options.map((o) => o.count), rest]);
  if (h < MIN_ENTROPY) return null;

  return { score: h * coverage, options };
}

/**
 * Pick the next question by re-scoring every unasked axis against the dishes
 * still in play. Because it re-scores after each answer, the second question
 * adapts to what the first one left behind. [M-7]
 */
export function selectQuestion(
  items: MenuItem[],
  asked: Axis[],
): Question | null {
  if (items.length < MIN_ITEMS_TO_ASK) return null;
  if (asked.length >= MAX_QUESTIONS) return null;

  let best: { axis: Axis; score: number; options: QuestionOption[] } | null = null;
  for (const axis of AXES) {
    if (asked.includes(axis)) continue;
    const scored = scoreAxis(items, axis);
    if (!scored) continue;
    if (!best || scored.score > best.score) {
      best = { axis, score: scored.score, options: scored.options };
    }
  }
  return best ? { axis: best.axis, options: best.options } : null;
}

/** Strict filter, used to decide what the *next* question should be about. */
export function filterByAnswer(items: MenuItem[], answer: Answer): MenuItem[] {
  if (answer.value === "any") return items;
  return items.filter((item) => item.tags[answer.axis] === answer.value);
}

export function applyAnswers(items: MenuItem[], answers: Answer[]): MenuItem[] {
  return answers.reduce(filterByAnswer, items);
}

/** 1 for an exact hit; partial credit for a near miss on an ordinal axis. */
function matchScore(item: MenuItem, answer: Answer): number {
  const actual = item.tags[answer.axis];
  if (actual === answer.value) return 1;
  const scale = ORDINAL_AXES[answer.axis];
  if (!scale) return 0;
  const a = scale.indexOf(actual);
  const b = scale.indexOf(answer.value);
  if (a < 0 || b < 0) return 0;
  const distance = Math.abs(a - b);
  if (distance === 1) return 0.5;
  if (distance === 2) return 0.15;
  return 0;
}

export type RankedItem = { item: MenuItem; score: number; exact: boolean };

/**
 * Rank the whole menu against the answers rather than filtering it down, so
 * there is never a dead end — a combination nothing satisfies exactly still
 * produces the closest available dishes. [M-16]
 */
export function rankItems(items: MenuItem[], answers: Answer[]): RankedItem[] {
  const active = answers.filter((a) => a.value !== "any");
  const max = active.length;
  return items
    .map((item, index) => {
      const score = active.reduce((sum, a) => sum + matchScore(item, a), 0);
      return { item, score, exact: max === 0 || score === max, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, score, exact }) => ({ item, score, exact }));
}

export type ResultSet = {
  items: MenuItem[];
  /** True when we fell back to closest matches instead of exact ones. */
  isApproximate: boolean;
  /** True when "Show me others" has somewhere else to go. */
  hasAlternates: boolean;
};

/**
 * Turn answers into 2–4 dishes. `page` advances through equally-good
 * alternates for the same answers, wrapping — that's "Shuffle". [M-9, M-10]
 */
export function buildResults(
  items: MenuItem[],
  answers: Answer[],
  page = 0,
): ResultSet {
  const ranked = rankItems(items, answers);
  if (ranked.length === 0) {
    return { items: [], isApproximate: false, hasAlternates: false };
  }

  const exactCount = ranked.filter((r) => r.exact).length;
  const isApproximate =
    answers.some((a) => a.value !== "any") && exactCount < 2;

  // Alternates come from the same neighbourhood, not the whole menu.
  const pool = ranked.slice(0, Math.min(ranked.length, RESULT_COUNT * 4));
  const pages = Math.max(1, Math.ceil(pool.length / RESULT_COUNT));
  const start = (((page % pages) + pages) % pages) * RESULT_COUNT;
  let window = pool.slice(start, start + RESULT_COUNT);
  // Never show a lone straggler on the last page.
  if (window.length < 2) window = pool.slice(0, RESULT_COUNT);

  return {
    items: window.map((r) => r.item),
    isApproximate,
    hasAlternates: pool.length > RESULT_COUNT,
  };
}

/**
 * How many questions this menu is likely to support, used only to draw the
 * right number of progress dots. Walks the most-likely branch (the largest
 * option) rather than every branch — an estimate, not a promise.
 */
export function estimateQuestionCount(items: MenuItem[], asked: Axis[]): number {
  let pool = items;
  let path = [...asked];
  let count = asked.length;

  while (count < MAX_QUESTIONS) {
    const question = selectQuestion(pool, path);
    if (!question) break;
    count += 1;
    path = [...path, question.axis];
    pool = filterByAnswer(pool, {
      axis: question.axis,
      value: question.options[0].value,
    });
  }
  return Math.max(count, asked.length);
}
