/**
 * Everyday Wonder, Two Days to Find the Line — entry 1.
 *
 * One sentence, at most 200 characters, that makes a small everyday
 * moment strange and new. This program writes that sentence to
 * /output/entry.txt, exactly as the bounty gate requires: UTF-8 text
 * of 1 to 200 characters, not only white space.
 *
 * The sentence was chosen with a second opinion (Numes, model
 * deepseek/deepseek-v4.1-flash:free) over five candidates. It won
 * because its angle is the freshest: an escalator handrail that runs
 * half a step ahead of the hand, given a quiet, polite agency of its
 * own. Nothing in the brief's own examples (lift song, kettle click,
 * puddle sky) is reused, and no saturated cluster from earlier
 * one-liner rounds (meetings, badges, passwords, simulations, prompt
 * rewrites, toasters, vending machines) appears here.
 *
 * Run:  node main.ts            (Node 22.18+ runs TypeScript as-is)
 * Check: cat /output/entry.txt
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------

/**
 * The sentence, kept as one literal so the file the judge reads is
 * byte-identical to what was reviewed. 122 characters.
 */
const ENTRY_TEXT =
  "The escalator handrail runs half a step ahead of my hand, like it already knows where I am going and is too polite to say.";

/** Hard cap from the bounty gate: 1 to 200 characters. */
const MAX_CHARS = 200;
const MIN_CHARS = 1;

/** Where the gate looks for the entry. */
const OUTPUT_PATH = "/output/entry.txt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count characters the way the gate does: Unicode code points, so an
 * astral-plane character counts once, not twice as a UTF-16 surrogate
 * pair would. Our sentence is plain ASCII, so the count is plain.
 */
function countChars(text: string): number {
  return [...text].length;
}

/**
 * True when the text is a single sentence: exactly one sentence-final
 * punctuation mark, sitting at the very end, and no other sentence
 * terminator hiding inside.
 */
function isSingleSentence(text: string): boolean {
  const trimmed = text.trim();
  const terminators = trimmed.match(/[.!?]/g) ?? [];
  if (terminators.length !== 1) return false;
  return /[.!?]$/.test(trimmed);
}

/**
 * The gate reads one text, not a paragraph: a newline inside the entry
 * would split the sentence the judge sees, so refuse it outright.
 */
function isSingleLine(text: string): boolean {
  return !/[\r\n]/.test(text);
}

/**
 * Reject the shapes the gate rejects, before we ever write the file:
 * empty text, white space only, or anything over the 200-char cap.
 */
function validateEntry(text: string): string[] {
  const problems: string[] = [];
  if (text.trim().length === 0) {
    problems.push("entry is empty or white space only");
  }
  const n = countChars(text);
  if (n < MIN_CHARS) problems.push(`entry is ${n} characters (minimum ${MIN_CHARS})`);
  if (n > MAX_CHARS) problems.push(`entry is ${n} characters (maximum ${MAX_CHARS})`);
  if (!isSingleSentence(text)) {
    problems.push("entry is not exactly one sentence");
  }
  if (!isSingleLine(text)) {
    problems.push("entry spans more than one line");
  }
  return problems;
}

/**
 * Normalise line endings and stray surrounding space, without touching
 * a single word of the sentence itself.
 */
function normalise(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

/**
 * Write the entry, creating the output directory when it does not
 * exist yet (the sandbox starts with an empty /output).
 */
function writeEntry(text: string, outPath: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text, "utf8");
}

/**
 * Read the file back and confirm it holds exactly the sentence we
 * meant to write — byte for byte, no trailing newline added, no
 * encoding surprise.
 */
function verifyWritten(outPath: string, expected: string): string[] {
  const problems: string[] = [];
  let written: string;
  try {
    written = readFileSync(outPath, "utf8");
  } catch (err) {
    problems.push(`cannot read back ${outPath}: ${(err as Error).message}`);
    return problems;
  }
  if (written !== expected) {
    problems.push("written file differs from the entry text");
  }
  if (countChars(written) > MAX_CHARS) {
    problems.push("written file exceeds 200 characters");
  }
  return problems;
}

/**
 * One-line human summary for the run log.
 */
function describe(text: string): string {
  const words = text.trim().split(/\s+/).length;
  return `${countChars(text)} chars, ${words} words, one sentence, ends "${text.trim().slice(-1)}"`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const entry = normalise(ENTRY_TEXT);

  const problems = validateEntry(entry);
  if (problems.length > 0) {
    for (const p of problems) console.error(`invalid entry: ${p}`);
    process.exit(1);
  }

  const outPath = resolve(OUTPUT_PATH);
  writeEntry(entry, outPath);

  const verifyProblems = verifyWritten(outPath, entry);
  if (verifyProblems.length > 0) {
    for (const p of verifyProblems) console.error(`verify failed: ${p}`);
    process.exit(1);
  }

  console.log(`wrote ${outPath} (${describe(entry)})`);
  console.log(entry);
}

// Resolve __dirname for completeness when run from any directory.
void fileURLToPath(import.meta.url);

main();
