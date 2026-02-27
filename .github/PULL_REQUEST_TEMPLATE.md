## Traceability (required)
Closes #<id>

## Parallelisierung / Abhängigkeiten (required)
Parallelisierbar: YES / NO  
Blockiert durch: #<id> / PR #<id> (falls NO)  
touches:i18n-json: YES / NO

---

## 🔍 Mandatory Technical Review

@copilot review using structured 9-criteria gate:

Generate a SINGLE COPY-PASTE MARKDOWN BLOCK for ChatGPT technical review.

STRICT RULES
- Output MUST be one single markdown code block.
- No prose before or after the block.
- Deterministic structure.
- Follow Evidence / Safe Mode: do NOT guess.
- If required information is missing, write:
  STOP AND REPORT: <minimum missing facts>
- No emojis except ✅ ❌ ⚠️ inside the table.
- Use the exact 9-criteria structure below.

FORMAT:

All 9 Review Criteria: PASSED ✅ / FAILED ❌

#	Criterion	Status	Details
1	Scope & Issue Alignment	<Confirm PR addresses ONLY the generator issue; list any out-of-scope changes. If found: STOP AND REPORT>
2	Modified Files	<List exact file paths (added/modified/deleted) + 1-sentence purpose per file>
3	Risk Assessment	<List max 3 regression risks; for each: where it could manifest + how to manually verify>
4	i18n / JSON Check	<State whether i18n JSON changed. If yes: list files + keys; if no: "No i18n JSON changes">
5	Backend Impact	<Confirm Supabase/Stripe untouched or list exact changes; if none: "No backend changes">
6	Build & Lint Gates	<Provide bun run build PASS/FAIL + bun run lint PASS/FAIL + CI status (green/red) + Actions run link. If any gate fails: STOP AND REPORT>
7	Manual Smoke Test	<Provide a CLI-based verification checklist for issue generation (5–10 steps) and state which were executed. If none executed: STOP AND REPORT>
8	Minimal Diff	<Confirm minimal diff; no refactors; no unrelated changes>
9	Merge Decision	<APPROVE FOR MERGE / STOP AND REPORT: <blocking reason>>

Final Recommendation
APPROVE FOR MERGE / STOP AND REPORT
(Optional max 3 ⚠️ conditions)

UI SELF-CHECK (Required)
- Provide a short checklist (5–10 steps) that I can do in GitHub UI in 3–5 minutes.
- Must include expected outcome per step.
- If auth is required, explicitly state: "Requires authenticated user".
- For this generator issue: checklist must include verifying created issues + labels + duplicates.
