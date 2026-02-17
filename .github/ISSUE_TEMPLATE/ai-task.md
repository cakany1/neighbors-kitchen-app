---
name: AI Task – Deterministic Execution
about: Structured task for autonomous AI agents (minimal diff, no refactor)
title: "[AI TASK] "
labels: ["ai-task"]
assignees: []
---

## Context

Project: Neighbors Kitchen  
Reference: PROJECT_CONTEXT.md (mandatory)  
Stack: React + TypeScript + Supabase + Stripe (Test Mode)  
Build must pass: `bun run build`  
Lint must pass: `bun run lint`

---

## Problem

---

## Scope

**Shared Resources / Collision Tags**
- touches:i18n-json (de/en JSON files)
- touches:ui-shell (Layout/Header/Providers)
- touches:routing
- touches:auth
- touches:db
- touches:stripe

---

## Implementation Rules

---

## Parallel Execution Rules

- If the task requires modifying translation JSON files, add label `touches:i18n-json` and DO NOT run in parallel with any other task labeled `touches:i18n-json`.
- If more than 2 additional files would be modified, STOP and report instead of implementing.
- If a required change exceeds the Allowed Files list, STOP and report instead of implementing.

---

## Labels (required on every issue)

- Priority: P0 / P1 / P2 (exactly one)
- Area: area:frontend / area:backend / area:infra / area:docs (exactly one)
- Workflow: ai-ready / ai-in-progress / ai-review / blocked (optional)
- Collision: touches:* (optional, use as needed)

