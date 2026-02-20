#!/usr/bin/env node
/**
 * scripts/start-queue.mjs
 *
 * Start Queue Generator for Neighbors Kitchen.
 *
 * Reads .ACTIVE_PRIORITY_ISSUES.md, finds matching open GitHub issues labeled
 * `ai-ready`, builds deterministic parallel start groups, outputs a markdown
 * report, and applies label changes to Group 1 (ai-ready → ai-in-progress).
 *
 * Rules:
 * - Order: P0 → P1 → P2, ascending issue number within same priority
 * - touches:i18n-json must be alone (serial)
 * - Same touches:* tag cannot appear in parallel within a group
 * - P1+ issues are NOT added to Group 1 if any P0 issue was deferred
 *
 * Usage:
 *   GITHUB_TOKEN=<token> node scripts/start-queue.mjs
 *   DRY_RUN=true node scripts/start-queue.mjs   # report only, no label changes
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

/** Return all open GitHub issues (excluding pull requests) with their labels. */
async function getOpenIssues() {
  const issues = [];
  let page = 1;
  while (true) {
    const batch = await ghFetch(
      `/repos/${OWNER}/${REPO}/issues?state=open&per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    // GitHub returns PRs as issues; filter them out
    issues.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) break;
    page++;
  }
  return issues;
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

/** Replace the full label list on a GitHub issue. */
async function setIssueLabels(issueNumber, labels) {
  return ghFetch(`/repos/${OWNER}/${REPO}/issues/${issueNumber}/labels`, {
    method: 'PUT',
    body: JSON.stringify({ labels }),
  });
}

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

/**
 * Parse issue blocks from .ACTIVE_PRIORITY_ISSUES.md.
 *
 * Block start: line matching /^[🟢🟡🟣] ISSUE <N> – .* \(P\d\)/
 * Block end:   separator line of '─' chars or end-of-file
 */
function parseIssues(content) {
  const SEPARATOR = /─{10,}/g;
  const blocks = content
    .split(SEPARATOR)
    .map((b) => b.trim())
    .filter(Boolean);

  const issues = [];

  for (const block of blocks) {
    const headerMatch = block.match(
      /^([🟢🟡🟣])\s+ISSUE\s+(\d+)\s+[–-]\s+(.+?)\s*\((P\d)\)/mu,
    );
    if (!headerMatch) continue;

    const [/* fullMatch */, /* emoji */, numberStr, title, priority] = headerMatch;
    const number = parseInt(numberStr, 10);

    // All touches:* labels from the entire block (deduplicated)
    const collisionTags = [
      ...new Set(
        [...block.matchAll(/touches:([\w-]+)/g)].map((m) => `touches:${m[1]}`),
      ),
    ];

    issues.push({ number, title: title.trim(), priority, collisionTags });
  }

  return issues.sort((a, b) => a.number - b.number);
}

// ---------------------------------------------------------------------------
// Queue building
// ---------------------------------------------------------------------------

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 };

/**
 * Build a deterministic start queue from resolved issues.
 * Returns { group1, group2, skipped, conflicts }.
 */
function buildQueue(parsedIssues, githubIssueMap) {
  // Resolve each parsed issue to a GitHub issue
  const resolved = [];
  const skipped = [];

  for (const pi of parsedIssues) {
    const ghIssue = githubIssueMap.get(pi.number);
    if (!ghIssue) {
      skipped.push({ ...pi, reason: 'Not found on GitHub (no open issue matching title)' });
      continue;
    }

    const labelNames = ghIssue.labels.map((l) => l.name);

    if (!labelNames.includes('ai-ready')) {
      skipped.push({ ...pi, ghNumber: ghIssue.number, reason: 'Not labeled ai-ready' });
      continue;
    }

    if (
      labelNames.includes('ai-in-progress') ||
      labelNames.includes('ai-review') ||
      labelNames.includes('done')
    ) {
      skipped.push({
        ...pi,
        ghNumber: ghIssue.number,
        reason: 'Already ai-in-progress / ai-review / done',
      });
      continue;
    }

    resolved.push({ ...pi, ghNumber: ghIssue.number, labels: labelNames });
  }

  // Sort: priority order (P0 first), then ascending issue number
  resolved.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (pDiff !== 0) return pDiff;
    return a.number - b.number;
  });

  const group1 = [];
  const group2 = [];
  const conflicts = [];
  const usedCollisionTags = new Set();
  let hasI18nInGroup1 = false;
  // If any P0 issue is deferred, block P1+ from Group 1
  let deferredHigherPriority = false;

  for (const issue of resolved) {
    const isI18n = issue.collisionTags.includes('touches:i18n-json');

    // P1+ blocked when a P0 issue was deferred to Group 2
    if (deferredHigherPriority && (PRIORITY_ORDER[issue.priority] ?? 99) > 0) {
      group2.push({ ...issue, deferReason: 'Higher-priority (P0) issues still pending in Group 2' });
      continue;
    }

    // touches:i18n-json must be alone (serial)
    if (hasI18nInGroup1) {
      group2.push({ ...issue, deferReason: 'touches:i18n-json is already in Group 1 (serial)' });
      conflicts.push(
        `ISSUE ${issue.number}: blocked — touches:i18n-json issue already in Group 1`,
      );
      continue;
    }

    if (isI18n && group1.length > 0) {
      group2.push({
        ...issue,
        deferReason: 'touches:i18n-json must run alone (serial); Group 1 not empty',
      });
      conflicts.push(
        `ISSUE ${issue.number}: touches:i18n-json must be serial — Group 1 already has other issues`,
      );
      continue;
    }

    // Collision tag check
    const tagConflicts = issue.collisionTags.filter((t) => usedCollisionTags.has(t));
    if (tagConflicts.length > 0) {
      group2.push({ ...issue, deferReason: `Collision tag(s): ${tagConflicts.join(', ')}` });
      conflicts.push(
        `ISSUE ${issue.number}: collision — tag(s) ${tagConflicts.join(', ')} already used in Group 1`,
      );
      if ((PRIORITY_ORDER[issue.priority] ?? 99) === 0) {
        deferredHigherPriority = true;
      }
      continue;
    }

    // Safe to add to Group 1
    group1.push(issue);
    issue.collisionTags.forEach((t) => usedCollisionTags.add(t));
    if (isI18n) hasI18nInGroup1 = true;
  }

  return { group1, group2, skipped, conflicts };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function buildReport({ group1, group2, skipped, conflicts, dryRun }) {
  const lines = ['## Start Queue Generator Report', ''];

  lines.push(`### 🟢 Group 1 – Start Now (${group1.length})`);
  if (group1.length === 0) {
    lines.push('_None – all eligible issues are in conflict or unavailable._');
  } else {
    for (const i of group1) {
      const tags = i.collisionTags.length ? ` — ${i.collisionTags.join(', ')}` : ' — (no collision tags)';
      lines.push(`- ISSUE ${i.number} (#${i.ghNumber}) [${i.priority}] "${i.title}"${tags}`);
    }
  }

  lines.push('');
  lines.push(`### 🟡 Group 2 – Start Next (${group2.length})`);
  if (group2.length === 0) {
    lines.push('_None._');
  } else {
    for (const i of group2) {
      lines.push(
        `- ISSUE ${i.number} (#${i.ghNumber ?? '?'}) [${i.priority}] "${i.title}" — deferred: ${i.deferReason}`,
      );
    }
  }

  lines.push('');
  lines.push(`### ⏭️ Skipped (${skipped.length})`);
  if (skipped.length === 0) {
    lines.push('_None._');
  } else {
    for (const i of skipped) {
      lines.push(
        `- ISSUE ${i.number}${i.ghNumber ? ` (#${i.ghNumber})` : ''} [${i.priority}] "${i.title}" — ${i.reason}`,
      );
    }
  }

  lines.push('');
  lines.push(`### ⚠️ Conflicts (${conflicts.length})`);
  if (conflicts.length === 0) {
    lines.push('_None._');
  } else {
    for (const c of conflicts) {
      lines.push(`- ${c}`);
    }
  }

  lines.push('');
  lines.push('### 🏷️ Label Changes');
  if (dryRun) {
    lines.push('_[DRY RUN] No label changes applied._');
    for (const i of group1) {
      lines.push(
        `- Would set \`ai-in-progress\`, remove \`ai-ready\` on ISSUE ${i.number} (#${i.ghNumber})`,
      );
    }
  } else if (group1.length > 0) {
    lines.push('Applied:');
    for (const i of group1) {
      lines.push(
        `- ✅ Set \`ai-in-progress\`, removed \`ai-ready\` on ISSUE ${i.number} (#${i.ghNumber})`,
      );
    }
  } else {
    lines.push('_No issues in Group 1; no label changes applied._');
  }

  return ['```', ...lines, '```'].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  // 2. Parse issue blocks
  const parsedIssues = parseIssues(content);
  if (parsedIssues.length === 0) {
    console.error('❌ STOP: Parsing .ACTIVE_PRIORITY_ISSUES.md returned no issues.');
    process.exit(1);
  }
  console.log(`Parsed ${parsedIssues.length} issue(s) from .ACTIVE_PRIORITY_ISSUES.md`);

  // 3. Verify required workflow labels exist in repo (do not create)
  const repoLabels = await getRepoLabels();
  const requiredLabels = ['ai-ready', 'ai-in-progress'];
  const missingLabels = requiredLabels.filter((l) => !repoLabels.has(l));
  if (missingLabels.length > 0) {
    console.error(`❌ STOP: Required workflow labels missing in repo: ${missingLabels.join(', ')}`);
    process.exit(1);
  }

  // 4. Fetch all open GitHub issues
  const openIssues = await getOpenIssues();
  console.log(`Found ${openIssues.length} open issue(s) on GitHub`);

  // 5. Map ISSUE number (from MD) → matching GitHub issue
  //    Title pattern: "[AI TASK] <emoji> ISSUE <N> – ..."
  const githubIssueMap = new Map();
  for (const pi of parsedIssues) {
    const titlePattern = new RegExp(`\\[AI TASK\\].*ISSUE\\s+${pi.number}\\b`, 'i');
    const match = openIssues.find((gi) => titlePattern.test(gi.title));
    if (match) {
      githubIssueMap.set(pi.number, match);
    }
  }

  // Report any parsed issues not found on GitHub
  const notFound = parsedIssues.filter((pi) => !githubIssueMap.has(pi.number));
  if (notFound.length > 0) {
    console.warn(
      `⚠️  The following issues from .ACTIVE_PRIORITY_ISSUES.md have no matching open GitHub issue: ` +
        notFound.map((i) => `ISSUE ${i.number}`).join(', '),
    );
  }

  // 6. Build the start queue
  const { group1, group2, skipped, conflicts } = buildQueue(parsedIssues, githubIssueMap);

  // 7. Apply label changes to Group 1 (before outputting report so report reflects result)
  if (!DRY_RUN && group1.length > 0) {
    for (const issue of group1) {
      const newLabels = [...issue.labels.filter((l) => l !== 'ai-ready'), 'ai-in-progress'];
      try {
        await setIssueLabels(issue.ghNumber, newLabels);
        console.log(`✅ Updated labels on #${issue.ghNumber} (ISSUE ${issue.number})`);
      } catch (err) {
        console.error(`❌ Failed to update labels on #${issue.ghNumber}: ${err.message}`);
        process.exit(1);
      }
    }
  }

  // 8. Output report
  const report = buildReport({ group1, group2, skipped, conflicts, dryRun: DRY_RUN });
  console.log('\n' + report);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
