## Pull Request Description

<!-- Brief description of the changes -->

### Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration change
- [ ] ♻️ Refactoring (no functional changes)
- [ ] 🧪 Test update

### Changes Made
<!-- List the key changes made in this PR -->
- 

### Testing Done
<!-- Describe testing performed -->
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript typecheck passes (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Unit tests pass (`npm test`)
- [ ] Manual testing on staging environment
- [ ] Edge function smoke tests (if applicable)

### Database Changes
<!-- If this PR includes database migrations -->
- [ ] No database changes
- [ ] Migration file(s) added
- [ ] Tested migration on staging
- [ ] RLS policies verified

### Security Checklist
<!-- For security-sensitive changes -->
- [ ] No secrets in code
- [ ] Authentication/authorization verified
- [ ] Input validation implemented
- [ ] Rate limiting considered
- [ ] CORS configured properly

### Screenshots/Videos
<!-- Add screenshots for UI changes -->

### Related Issues
<!-- Link related issues: Fixes #123, Closes #456 -->

### Deployment Notes
<!-- Any special steps needed for deployment -->

### Reviewer Checklist
- [ ] Code follows project conventions
- [ ] No console.log with sensitive data
- [ ] Error handling is appropriate
- [ ] Tests cover new functionality

## Linked Issue
Closes #<ISSUE_NUMBER>

## Change Summary (max 3 bullets)
- 
- 
- 

## Gates (must be true before merge)
- [ ] CI is green (bun run build + bun run lint)
- [ ] Minimal diff (no refactors)
- [ ] Scope matches issue (no extra files)
- [ ] i18n JSON serialization rule respected (if touches:i18n-json)

---

## Structured Review Prompt (paste as a PR comment if not already posted)
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
1	Scope & Issue Alignment	<Confirm PR addresses ONLY current issue; list any out-of-scope changes. If found: STOP AND REPORT>
2	Modified Files	<List exact file paths (added/modified/deleted) + 1-sentence purpose per file>
3	Risk Assessment	<List max 3 regression risks; for each: where it could manifest + how to manually verify>
4	i18n / JSON Check	<State whether i18n JSON changed. If yes: list files + keys; if no: "No i18n JSON changes">
5	Backend Impact	<Confirm Supabase/Stripe untouched or list exact changes; if none: "No backend changes">
6	Build & Lint Gates	<Provide bun run build PASS/FAIL + bun run lint PASS/FAIL + CI status (green/red) + Actions run link. If any gate fails: STOP AND REPORT>
7	Manual Smoke Test	<List exact manual test steps performed; expected vs actual; if not executed: STOP AND REPORT>
8	Minimal Diff	<Confirm minimal diff; no refactors; no unrelated changes>
9	Merge Decision	<APPROVE FOR MERGE / STOP AND REPORT: <blocking reason>>

Final Recommendation
APPROVE FOR MERGE / STOP AND REPORT
(Optional max 3 ⚠️ conditions)

UI SELF-CHECK (Required)
- Provide a short checklist (5–10 steps) I can do in 3–5 minutes.
- Must include expected outcome per step.
- If auth is required, explicitly state: "Requires authenticated user".
