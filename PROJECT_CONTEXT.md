# Neighbors Kitchen – Project Context

## 1. Projektüberblick
React + TypeScript Web-App für nachbarschaftliches Food-Sharing.
Supabase (Auth + DB + Edge Functions).
Stripe Integration (Test/Live strikt getrennt).
i18n via react-i18next.

---

## 2. Entwicklungsmodus
- GitHub Issues + PR Workflow
- Copilot Agent Assignments
- Kanban Board (Backlog / Ready / In Progress / Review / Done)
- Minimal-Diff-Policy
- STOP-and-Report Regel bei Scope-Überschreitung
- Parallelisierung nur bei Zonen-Isolation (Frontend vs Backend)

---

## 3. Tech Stack

### Frontend
- React
- TypeScript
- react-i18next
- bun (build + lint)

### Backend
- Supabase
- Edge Functions (TypeScript)

### Payments
- Stripe (TEST strikt getrennt von LIVE)
- Keine Hardcoded Keys
- Nur import.meta.env.*

---

## 4. Environments
- PROD
- (optional) STAGING
- ENV Guards via import.meta.env.*
- Keine hardcodierten URLs
- Stripe Test vs Live strikt getrennt

---

## 5. i18n Struktur

### Namespace-Konvention
- nav.*
- auth.*
- profile.delete_account.*
- validation.*
- common.*

### Regeln
- Keine Hardcoded Strings
- Keys müssen in de.json und en.json existieren
- Keine neuen Namespaces ohne Begründung
- Keine parallelen JSON-Änderungen in mehreren Issues

---

## 6. Architektur-Regeln

- Keine Logikänderung bei i18n-Issues
- Keine Supabase-Änderung ohne explizites Issue
- Minimal Diff Only
- Keine Refactors ohne separates Issue
- STOP wenn Scope > Allowed Files

---

## 7. Datenbank
- Supabase profiles
- RLS aktiv
- Edge Functions isoliert
- Stripe Webhook getrennt behandelt

---

## 8. Merge-Strategie
- JSON-Issues seriell
- Backend + Frontend dürfen parallel laufen
- PR muss grüne Checks haben
- Smoke-Test nach jedem Merge

---

## 9. Sicherheitsregeln
- Keine Live-Stripe-Konfiguration anfassen
- Keine ENV-Keys hardcoden
- Keine DB-Queries verändern ohne Review
