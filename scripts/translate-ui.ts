/**
 * Generates the app's own UI strings in every shipped language, once, at build
 * time — see lib/translations/README.md for why.
 *
 *   npm run copy:translate         regenerate every language
 *   npm run copy:translate -- es   regenerate one
 *   npm run copy:check             fail if English copy drifted from the files
 *
 * This translates nothing from any menu. Menu content is translated at runtime
 * in lib/anthropic.ts, per photo, and always will be.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod";
import { LANGUAGES, translatableCopy } from "../lib/copy";

const OUT_DIR = join(import.meta.dirname, "..", "lib", "translations");

/** Fingerprint of the English source, stamped into every generated file. */
function sourceHash(): string {
  const source = translatableCopy();
  const canonical = Object.keys(source)
    .sort()
    .map((key) => `${key}=${source[key]}`)
    .join("|");
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

type Generated = {
  _sourceHash: string;
  _language: string;
  strings: Record<string, string>;
};

const filePath = (code: string) => join(OUT_DIR, `${code}.json`);

function read(code: string): Generated | null {
  try {
    return JSON.parse(readFileSync(filePath(code), "utf8"));
  } catch {
    return null;
  }
}

const Schema = z.object({
  strings: z.array(z.object({ key: z.string(), text: z.string() })),
});

const SYSTEM = `You translate the interface strings of a phone app that helps a diner who cannot read a restaurant's menu.

These are buttons, headings, questions, and answer labels — not menu content. Rules:
- Return every key you are given, unchanged, with its text translated.
- Keep each string short enough to sit on a small button on a phone.
- Plain, direct, warm. Not formal, not marketing.
- Preserve punctuation such as "2-3" and any trailing units.
- Answer labels like "Beef" or "Grilled" are food categories a diner picks from, not dish names. Translate them as the everyday word a diner would use when choosing.
- The questions are asked one at a time and answered with a single tap. Keep them conversational.`;

async function translate(client: Anthropic, englishName: string) {
  const source = translatableCopy();
  const response = await client.messages.parse({
    model: process.env.MENYUKA_MODEL ?? "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(Schema) },
    messages: [
      {
        role: "user",
        content: `Target language: ${englishName}\n\n${JSON.stringify(
          Object.entries(source).map(([key, text]) => ({ key, text })),
        )}`,
      },
    ],
  });

  if (!response.parsed_output) throw new Error("no parsed output");
  const strings = Object.fromEntries(
    response.parsed_output.strings.map((entry) => [entry.key, entry.text.trim()]),
  );

  const missing = Object.keys(source).filter((key) => !strings[key]);
  if (missing.length > 0) {
    throw new Error(`missing ${missing.length} keys: ${missing.slice(0, 5).join(", ")}`);
  }
  return strings;
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const only = args.filter((a) => !a.startsWith("--"));
  const hash = sourceHash();

  if (check) {
    let stale = 0;
    for (const language of LANGUAGES) {
      const file = read(language.code);
      if (!file) {
        console.log(`  MISSING  ${language.code}  (${language.english})`);
        stale += 1;
      } else if (file._sourceHash !== hash) {
        console.log(`  STALE    ${language.code}  (${language.english})`);
        stale += 1;
      }
    }
    if (stale > 0) {
      console.log(
        `\n${stale} language file(s) out of date with lib/copy.ts (${hash}).\n` +
          `Run: npm run copy:translate\n`,
      );
      process.exit(1);
    }
    console.log(`All ${LANGUAGES.length} language files match lib/copy.ts (${hash}).`);
    return;
  }

  const targets = LANGUAGES.filter((l) => only.length === 0 || only.includes(l.code));
  if (targets.length === 0) {
    console.log(`No language matched: ${only.join(", ")}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  // English is the source — no API call. Written out anyway so the loader has
  // no special case.
  for (const language of targets.filter((l) => l.code === "en")) {
    const payload: Generated = {
      _sourceHash: hash,
      _language: language.english,
      strings: translatableCopy(),
    };
    writeFileSync(filePath(language.code), JSON.stringify(payload, null, 2) + "\n");
    console.log(`  en  source, no call`);
  }

  const client = new Anthropic();
  const remaining = targets.filter((l) => l.code !== "en");
  const results = await Promise.allSettled(
    remaining.map(async (language) => {
      const started = Date.now();
      const strings = await translate(client, language.english);
      const payload: Generated = {
        _sourceHash: hash,
        _language: language.english,
        strings,
      };
      writeFileSync(filePath(language.code), JSON.stringify(payload, null, 2) + "\n");
      return { language, seconds: ((Date.now() - started) / 1000).toFixed(1) };
    }),
  );

  let failed = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const { language, seconds } = result.value;
      console.log(`  ${language.code.padEnd(3)} ${language.english.padEnd(20)} ${seconds}s`);
    } else {
      failed += 1;
      console.log(`  ${remaining[index].code.padEnd(3)} FAILED - ${result.reason}`);
    }
  });

  console.log(
    failed === 0
      ? `\nWrote ${targets.length} language file(s) at source hash ${hash}.\n`
      : `\n${failed} language(s) failed - rerun with just those codes.\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

void main();
