/**
 * Proves the question engine adapts to the menu instead of asking the same
 * three questions everywhere — the MVP's stated success signal. No API key
 * needed: these are hand-tagged menus, exercising the scoring only.
 *
 *   npm run engine:check
 */
import { AXES, type Axis } from "../lib/tags";
import { buildResults, scoreAxis, selectQuestion } from "../lib/questions";
import type { Answer, MenuItem } from "../lib/types";

type Row = [string, string, string, string, string, string, string];

function menu(name: string, rows: Row[]): { name: string; items: MenuItem[] } {
  return {
    name,
    items: rows.map((row, index) => ({
      id: `i${index}`,
      name: row[0],
      originalDescription: null,
      price: null,
      category: null,
      tags: {
        protein: row[1],
        spice: row[2],
        format: row[3],
        familiarity: row[4],
        prep: row[5],
        richness: row[6],
      },
    })),
  };
}

// Strong protein and spice variation, several formats.
const northIndian = menu("North Indian", [
  ["Butter chicken", "chicken", "mild", "stew", "familiar", "stewed", "rich"],
  ["Chicken vindaloo", "chicken", "hot", "stew", "adventurous", "stewed", "rich"],
  ["Lamb rogan josh", "lamb", "medium", "stew", "adventurous", "stewed", "rich"],
  ["Seekh kebab", "lamb", "medium", "grill", "familiar", "grilled", "medium"],
  ["Tandoori chicken", "chicken", "mild", "grill", "familiar", "grilled", "medium"],
  ["Fish amritsari", "seafood", "medium", "grill", "adventurous", "fried", "medium"],
  ["Prawn balchao", "seafood", "hot", "stew", "adventurous", "stewed", "rich"],
  ["Chana masala", "tofu", "medium", "stew", "familiar", "stewed", "medium"],
  ["Palak paneer", "vegetable", "mild", "stew", "familiar", "stewed", "rich"],
  ["Aloo gobi", "vegetable", "mild", "stew", "familiar", "stewed", "light"],
  ["Dal tadka", "tofu", "mild", "stew", "familiar", "stewed", "medium"],
  ["Vegetable biryani", "vegetable", "medium", "rice", "familiar", "steamed", "medium"],
  ["Mutton biryani", "lamb", "medium", "rice", "adventurous", "steamed", "rich"],
  ["Kachumber salad", "vegetable", "none", "salad", "familiar", "raw", "light"],
  ["Raita", "vegetable", "none", "side", "familiar", "raw", "light"],
  ["Garlic naan", "other", "none", "pastry", "familiar", "baked", "medium"],
  ["Gulab jamun", "other", "none", "dessert", "familiar", "fried", "rich"],
  ["Masala chai", "other", "none", "drink", "familiar", "other", "light"],
]);

// Structurally different: no heat anywhere, everything raw or steamed,
// seafood-dominant. The spice axis must not be asked here.
const sushi = menu("Sushi counter", [
  ["Maguro nigiri", "seafood", "none", "shareable", "familiar", "raw", "light"],
  ["Sake nigiri", "seafood", "none", "shareable", "familiar", "raw", "light"],
  ["Hamachi nigiri", "seafood", "none", "shareable", "adventurous", "raw", "light"],
  ["Uni gunkan", "seafood", "none", "shareable", "adventurous", "raw", "medium"],
  ["Ikura gunkan", "seafood", "none", "shareable", "adventurous", "raw", "medium"],
  ["Tamago nigiri", "egg", "none", "shareable", "familiar", "steamed", "light"],
  ["California roll", "seafood", "none", "rice", "familiar", "raw", "medium"],
  ["Futomaki", "vegetable", "none", "rice", "adventurous", "raw", "medium"],
  ["Negitoro maki", "seafood", "none", "rice", "adventurous", "raw", "medium"],
  ["Chirashi bowl", "seafood", "none", "rice", "adventurous", "raw", "medium"],
  ["Unagi don", "seafood", "none", "rice", "adventurous", "grilled", "rich"],
  ["Chawanmushi", "egg", "none", "soup", "adventurous", "steamed", "light"],
  ["Miso soup", "tofu", "none", "soup", "familiar", "steamed", "light"],
  ["Edamame", "tofu", "none", "side", "familiar", "steamed", "light"],
  ["Agedashi tofu", "tofu", "none", "side", "adventurous", "fried", "medium"],
  ["Seaweed salad", "vegetable", "none", "salad", "adventurous", "raw", "light"],
]);

// Small, homogeneous menu — should not interrogate the diner at all.
const bakery = menu("Bakery counter", [
  ["Croissant", "other", "none", "pastry", "familiar", "baked", "rich"],
  ["Pain au chocolat", "other", "none", "pastry", "familiar", "baked", "rich"],
  ["Almond croissant", "other", "none", "pastry", "familiar", "baked", "rich"],
  ["Baguette", "other", "none", "pastry", "familiar", "baked", "medium"],
  ["Brioche", "other", "none", "pastry", "familiar", "baked", "rich"],
]);

function walk(items: MenuItem[]) {
  const asked: Axis[] = [];
  const answers: Answer[] = [];
  let pool = items;
  const trace: string[] = [];

  for (;;) {
    const question = selectQuestion(pool, asked);
    if (!question) break;
    // Simulate the diner taking the most popular option.
    const choice = question.options[0];
    trace.push(
      `${question.axis} [${question.options.map((o) => `${o.value}:${o.count}`).join(" ")}] → ${choice.value}`,
    );
    asked.push(question.axis);
    answers.push({ axis: question.axis, value: choice.value });
    pool = pool.filter((item) => item.tags[question.axis] === choice.value);
  }
  return { asked, answers, trace };
}

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failures += 1;
}

for (const { name, items } of [northIndian, sushi, bakery]) {
  console.log(`\n=== ${name} (${items.length} items) ===`);
  console.log("  axis scores:");
  for (const axis of AXES) {
    const scored = scoreAxis(items, axis);
    console.log(
      `    ${axis.padEnd(12)} ${scored ? scored.score.toFixed(3) : "— no signal, excluded"}`,
    );
  }
  const { answers, trace } = walk(items);
  console.log("  question path:");
  for (const line of trace) console.log(`    ${line}`);
  const results = buildResults(items, answers);
  console.log(
    `  results: ${results.items.map((i) => i.name).join(", ") || "(none)"}` +
      `${results.isApproximate ? "  [closest matches]" : ""}`,
  );
}

console.log("\n=== assertions ===");

const indianPath = walk(northIndian.items).asked;
const sushiPath = walk(sushi.items).asked;

check("M-15 spice is excluded on the sushi menu", scoreAxis(sushi.items, "spice") === null);
check("spice is available on the North Indian menu", scoreAxis(northIndian.items, "spice") !== null);
check(
  `M-7 the two menus get different question sets (${indianPath.join("+")} vs ${sushiPath.join("+")})`,
  indianPath.join("+") !== sushiPath.join("+"),
);
check("no menu is asked more than 3 questions", indianPath.length <= 3 && sushiPath.length <= 3);
check("a tiny homogeneous menu is asked nothing", walk(bakery.items).asked.length === 0);

// M-9: every reachable answer combination lands on 2–4 dishes.
let combos = 0;
let dead = 0;
for (const { items } of [northIndian, sushi]) {
  const first = selectQuestion(items, []);
  if (!first) continue;
  for (const a of [...first.options.map((o) => o.value), "any"]) {
    const poolA = a === "any" ? items : items.filter((i) => i.tags[first.axis] === a);
    const second = selectQuestion(poolA, [first.axis]);
    const secondOptions = second ? [...second.options.map((o) => o.value), "any"] : [null];
    for (const b of secondOptions) {
      const answers: Answer[] = [{ axis: first.axis, value: a }];
      if (second && b) answers.push({ axis: second.axis, value: b });
      const results = buildResults(items, answers);
      combos += 1;
      if (results.items.length < 2 || results.items.length > 4) dead += 1;
    }
  }
}
check(`M-9/M-16 all ${combos} answer combinations return 2–4 dishes (${dead} bad)`, dead === 0);

// M-10: shuffling gives different dishes without re-answering.
const shuffleAnswers: Answer[] = [{ axis: "format", value: "stew" }];
const first = buildResults(northIndian.items, shuffleAnswers, 0);
const second = buildResults(northIndian.items, shuffleAnswers, 1);
check(
  "M-10 shuffle returns a different set for the same answers",
  first.hasAlternates &&
    first.items.map((i) => i.id).join() !== second.items.map((i) => i.id).join(),
);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
