#!/usr/bin/env node
/**
 * scripts/issue-generator.mjs
 *
 * Parses .ACTIVE_PRIORITY_ISSUES.md and creates missing GitHub Issues.
 *
 * Rules:
 * - No duplicates: skip if issue title already exists (open or closed)
 * - Apply labels: P*, area:*, touches:* (if present), ai-ready
 * - Output a single markdown code-block report: Created / Skipped / Errors
 * - STOP AND REPORT if parsing fails or required labels are missing
 *
 * Usage:
 *   GITHUB_TOKEN=<token> node scripts/issue-generator.mjs
 *   DRY_RUN=true node scripts/issue-generator.mjs   # list only, no creation
 */

import { readFileSync } from 'node:fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'cakany1/neighbors-kitchen-app';
const [OWNER, REPO] = GITHUB_REPOSITORY.split('/');
const DRY_RUN = process.env.DRY_RUN === 'true';

const BASE_URL = 'https://api.github.com';

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

async function ghFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

/** Return all existing issue titles (open + closed). */
async function getExistingTitles() {
  const titles = new Set();
  let page = 1;
  while (true) {
    const batch = await ghFetch(
      `/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    batch.forEach((i) => titles.add(i.title));
    if (batch.length < 100) break;
    page++;
  }
  return titles;
}

/** Return all label names that exist in the repo. */
async function getRepoLabels() {
  const names = new Set();
  let page = 1;
  while (true) {
    const batch = await ghFetch(
      `/repos/${OWNER}/${REPO}/labels?per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    batch.forEach((l) => names.add(l.name));
    if (batch.length < 100) break;
    page++;
  }
  return names;
}

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

/**
 * Parse issue blocks from .ACTIVE_PRIORITY_ISSUES.md.
 *
 * Each block is delimited by the separator line of '─' characters.
 * Header format: <emoji> ISSUE <N> – <title> (<priority>)
 */
function parseIssues(content) {
  const SEPARATOR = /─{10,}/g;
  const blocks = content
    .split(SEPARATOR)
    .map((b) => b.trim())
    .filter(Boolean);

  const issues = [];

  for (const block of blocks) {
    // Match: 🟢 ISSUE 26 – Enforce Email Verification Before Login (P0)
    const headerMatch = block.match(
      /^([🟢🟡🟣])\s+ISSUE\s+(\d+)\s+[–-]\s+(.+?)\s*\((P\d)\)/mu,
    );
    if (!headerMatch) continue;

    const [fullMatch, emoji, numberStr, title, priority] = headerMatch;
    const number = parseInt(numberStr, 10);

    // Area label (from "## Labels" section)
    const areaMatch = block.match(/^Area:\s*(area:\S+)/m);
    const area = areaMatch ? areaMatch[1].trimEnd() : null;

    // All touches:* labels from the entire block (deduplicated)
    const touches = [
      ...new Set(
        [...block.matchAll(/touches:([\w-]+)/g)].map(
          (m) => `touches:${m[1]}`,
        ),
      ),
    ];

    // Body = everything in the block after the title line
    const afterTitle = block.slice(headerMatch.index + fullMatch.length).trimStart();

    issues.push({ number, title: title.trim(), emoji, priority, area, touches, afterTitle });
  }

  return issues.sort((a, b) => a.number - b.number);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Build the canonical GitHub issue title for a parsed issue. */
function issueTitle({ emoji, number, title, priority }) {
  return `[AI TASK] ${emoji} ISSUE ${number} – ${title} (${priority})`;
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ STOP: GITHUB_TOKEN is not set.');
    process.exit(1);
  }

  // 1. Read .ACTIVE_PRIORITY_ISSUES.md
  let content;
  try {
    content = readFileSync('.ACTIVE_PRIORITY_ISSUES.md', 'utf-8');
  } catch {
    console.error('❌ STOP: Could not read .ACTIVE_PRIORITY_ISSUES.md');
    process.exit(1);
  }

  const parsedIssues = parseIssues(content);
  if (parsedIssues.length === 0) {
    console.error('❌ STOP: Parsing .ACTIVE_PRIORITY_ISSUES.md returned no issues.');
    process.exit(1);
  }
  console.log(`Parsed ${parsedIssues.length} issue(s) from .ACTIVE_PRIORITY_ISSUES.md`);

  // 2. Check required labels exist
  const repoLabels = await getRepoLabels();
  const requiredBase = ['ai-ready'];
  const missing = requiredBase.filter((l) => !repoLabels.has(l));
  if (missing.length > 0) {
    console.error(`❌ STOP: Required labels missing in repo: ${missing.join(', ')}`);
    process.exit(1);
  }

  // 3. Get existing issue titles
  const existingTitles = await getExistingTitles();
  console.log(`Found ${existingTitles.size} existing issue(s) on GitHub`);

  // 4. Process each parsed issue
  const created = [];
  const skipped = [];
  const errors = [];

  for (const issue of parsedIssues) {
    const fullTitle = issueTitle(issue);

    if (existingTitles.has(fullTitle)) {
      skipped.push(fullTitle);
      console.log(`⏭️  Skipped (exists): ${fullTitle}`);
      continue;
    }

    // Build label list; silently drop labels that don't exist in repo
    const candidates = [issue.priority, 'ai-ready', issue.area, ...issue.touches].filter(Boolean);
    const labels = candidates.filter((l) => {
      if (!repoLabels.has(l)) {
        console.warn(`⚠️  Label "${l}" not found in repo — skipping for "${fullTitle}"`);
        return false;
      }
      return true;
    });

    const body = `${issueTitle(issue)}\n\n${issue.afterTitle}`;

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would create: "${fullTitle}"\n  Labels: ${labels.join(', ')}`);
      created.push(`${fullTitle} [DRY RUN]`);
      continue;
    }

    try {
      const newIssue = await ghFetch(`/repos/${OWNER}/${REPO}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title: fullTitle, body, labels }),
      });
      const ref = `#${newIssue.number} ${fullTitle}`;
      created.push(ref);
      console.log(`✅ Created: ${ref}`);
    } catch (err) {
      errors.push(`${fullTitle}: ${err.message}`);
      console.error(`❌ Error creating "${fullTitle}": ${err.message}`);
    }
  }

  // 5. Output markdown report
  const report = [
    '```',
    '## Issue Generator Report',
    '',
    `### ✅ Created (${created.length})`,
    ...created.map((t) => `- ${t}`),
    '',
    `### ⏭️ Skipped – already exists (${skipped.length})`,
    ...skipped.map((t) => `- ${t}`),
    ...(errors.length > 0
      ? ['', `### ❌ Errors (${errors.length})`, ...errors.map((t) => `- ${t}`)]
      : []),
    '```',
  ].join('\n');

  console.log('\n' + report);

  if (errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
