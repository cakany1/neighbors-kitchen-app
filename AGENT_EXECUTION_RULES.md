# AGENT EXECUTION RULES – Neighbors Kitchen

This document defines mandatory execution constraints for AI agents (GitHub Copilot, etc.).

If any instruction conflicts with this document, this document takes priority.

---

## 1. General Principles

- Minimal Diff Only
- No Refactoring unless explicitly requested
- No Architectural Changes
- No Dependency Changes unless explicitly requested
- Do not move files
- Do not rename files
- Do not introduce new patterns
- Preserve existing structure

If scope exceeds allowed files → STOP and report instead of implementing.

---

## 2. File Scope Enforcement

An Issue always defines:

- Allowed files
- Forbidden areas

The agent MUST:

- Modify ONLY allowed files
- Not touch unrelated files
- Not “improve” surrounding code
- Not reformat entire files
- Not fix unrelated lint warnings

If more than 20% of a file would change → STOP and report.

---

## 3. i18n Rules

- No hardcoded user-facing strings
- All new keys must exist in BOTH de.json and en.json
- No new namespaces unless explicitly requested
- Do not rename existing keys
- Do not restructure JSON hierarchy

Parallel JSON modification in multiple Issues is forbidden.

---

## 4. Backend / Supabase Rules

- Do not change DB queries unless explicitly requested
- Do not change RLS policies
- Do not change environment variable usage
- Do not touch Stripe LIVE configuration
- Test and Live keys must remain separated
- Edge Function changes must preserve runtime behavior

If fixing types requires behavioral changes → STOP and report.

---

## 5. Auth Safety Rules

- Do not modify authentication flow
- Do not modify redirect behavior
- Do not change logout behavior
- Do not alter Supabase auth calls

Unless explicitly defined in the Issue.

---

## 6. STOP Conditions

The agent must STOP and report instead of implementing if:

- More files than allowed are required
- A refactor seems necessary
- A logic change is required
- A DB schema change is required
- Environment variables would need modification
- JSON structure would need restructuring

The response must list:
- Why it stopped
- Which files would be affected
- What structural change is required

---

## 7. Build Requirements

After implementation:

- bun run build must pass
- bun run lint must pass
- No new warnings introduced
- Only minimal diff should be present

---

## 8. Parallel Execution Rules

Frontend and Backend changes may run in parallel ONLY if:

- They do not modify the same files
- They do not modify translation JSON in parallel
- They do not modify shared utility files

JSON modifications must be executed serially.

---

END OF RULES
