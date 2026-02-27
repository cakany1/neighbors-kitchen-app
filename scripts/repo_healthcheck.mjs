import fs from "node:fs";

const token = process.env.GITHUB_TOKEN;
const repoFull = process.env.GITHUB_REPOSITORY;
const apiBase = process.env.GITHUB_API_URL || "https://api.github.com";
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!token || !repoFull) {
  console.error("Missing GITHUB_TOKEN or GITHUB_REPOSITORY");
  process.exit(1);
}

const [owner, repo] = repoFull.split("/");

async function gh(path, params = {}) {
  const url = new URL(`${apiBase}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "repo-healthcheck",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} ${res.statusText} for ${url} :: ${txt}`);
  }
  return res.json();
}

async function paginate(path, params = {}) {
  const out = [];
  let page = 1;
  while (true) {
    const chunk = await gh(path, { ...params, per_page: 100, page });
    out.push(...chunk);
    if (!Array.isArray(chunk) || chunk.length < 100) break;
    page++;
  }
  return out;
}

function extractIssueNo(title) {
  const m = title.match(/\bISSUE\s+(\d+)\b/i);
  return m ? Number(m[1]) : null;
}

function daysAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function parseActivePriorityIssues() {
  const p = ".ACTIVE_PRIORITY_ISSUES.md";
  if (!fs.existsSync(p)) return { numbers: new Set(), raw: "" };
  const raw = fs.readFileSync(p, "utf8");
  const nums = new Set();
  for (const m of raw.matchAll(/\bISSUE\s+(\d+)\b/gi)) nums.add(Number(m[1]));
  for (const m of raw.matchAll(/#(\d+)\b/g)) nums.add(Number(m[1]));
  return { numbers: nums, raw };
}

const { numbers: activeSet } = parseActivePriorityIssues();

const prs = await paginate(`/repos/${owner}/${repo}/pulls`, { state: "open" });
const issuesAll = await paginate(`/repos/${owner}/${repo}/issues`, { state: "open" });
// filter out PRs from /issues endpoint
const issues = issuesAll.filter((i) => !i.pull_request);

const prNoIssue = [];
const prByIssue = new Map();
const stalePRs = [];

for (const pr of prs) {
  const n = extractIssueNo(pr.title);
  if (!n) prNoIssue.push(pr);
  else {
    if (!prByIssue.has(n)) prByIssue.set(n, []);
    prByIssue.get(n).push(pr);
  }
  if (daysAgo(pr.updated_at) >= 14) stalePRs.push(pr);
}

const duplicates = [...prByIssue.entries()].filter(([, arr]) => arr.length > 1);

const openIssueNums = new Set(issues.map((i) => i.number));
const activeMissingAsOpenIssue = [...activeSet].filter((n) => !openIssueNums.has(n));
const openIssuesNotInActive = issues
  .filter((i) => !activeSet.has(i.number))
  .slice(0, 25);

function mdLink(text, url) {
  return `[${text}](${url})`;
}

let report = `# Repo Healthcheck

## Snapshot
- Open PRs: **${prs.length}**
- Open Issues (non-PR): **${issues.length}**
- PRs without ISSUE number in title: **${prNoIssue.length}**
- Duplicate ISSUE PR groups: **${duplicates.length}**
- Stale PRs (>=14 days since update): **${stalePRs.length}**

## PRs without ISSUE number (top 20)
${prNoIssue.slice(0, 20).map((p) => `- ${mdLink(`#${p.number}`, p.html_url)} — ${p.title}`).join("\n") || "- none"}

## Duplicate ISSUE groups
${duplicates
  .map(([n, arr]) => {
    const lines = arr.map((p) => `  - ${mdLink(`#${p.number}`, p.html_url)} — ${p.title}`);
    return `- ISSUE ${n}\n${lines.join("\n")}`;
  })
  .join("\n") || "- none"}

## Stale PRs (top 20)
${stalePRs
  .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
  .slice(0, 20)
  .map((p) => `- ${mdLink(`#${p.number}`, p.html_url)} — ${p.title} (updated ${daysAgo(p.updated_at)}d ago)`)
  .join("\n") || "- none"}

## Backlog Alignment (.ACTIVE_PRIORITY_ISSUES.md)
- Active issues not currently open on GitHub: **${activeMissingAsOpenIssue.length}**
${activeMissingAsOpenIssue.slice(0, 30).map((n) => `- ISSUE ${n}`).join("\n") || "- none"}

### Open issues not in ACTIVE_PRIORITY (top 25)
${openIssuesNotInActive.map((i) => `- ${mdLink(`#${i.number}`, i.html_url)} — ${i.title}`).join("\n") || "- none"}

`;

fs.writeFileSync("repo-healthcheck-report.md", report, "utf8");

if (summaryPath) {
  fs.appendFileSync(summaryPath, report, "utf8");
}

console.log("Healthcheck report written to repo-healthcheck-report.md");
