# Neighbors Kitchen – Label Set

## Priority
- P0
- P1
- P2

## Area
- area:frontend
- area:backend
- area:infra
- area:docs

## Workflow
- ai-ready
- ai-in-progress
- ai-review
- blocked

## Collision / Shared Resources
- touches:i18n-json
- touches:ui-shell
- touches:routing
- touches:auth
- touches:db
- touches:stripe

## Rules
- Never run two issues in parallel if both have `touches:i18n-json`
- Prefer parallel lanes by Area (frontend vs backend vs infra/docs)
- Keep 1 PR = 1 Issue
