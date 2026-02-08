# 🧪 Neighbors Kitchen - Testplan

**Version:** 1.0  
**Erstellt:** 2026-01-19  
**Status:** In Bearbeitung

---

## 📋 Übersicht

Dieser Testplan dokumentiert alle Features der App und deren Teststatus.

### Legende
- ✅ Getestet & Funktioniert
- ⏳ Test ausstehend
- ❌ Fehler gefunden
- 🔧 In Entwicklung
- ⚠️ Teilweise funktionierend

---

## 1. 🔐 Authentifizierung & Registrierung

| Feature | Status | Notizen |
|---------|--------|---------|
| E-Mail Registrierung | ⏳ | Signup-Flow mit Profil-Trigger |
| E-Mail Login | ⏳ | Standard-Login |
| Logout | ⏳ | Session-Clearing |
| Passwort vergessen | ⏳ | Reset-Flow |
| Auto-Confirm E-Mail | ⏳ | Sollte aktiviert sein |
| Session-Persistenz | ⏳ | Nach Browser-Refresh |

### Registrierungs-Felder
| Feld | Pflicht | Status |
|------|---------|--------|
| Vorname / Nachname | ✓ | ⏳ |
| E-Mail | ✓ | ⏳ |
| Passwort | ✓ | ⏳ |
| Telefonnummer | ✓ | ⏳ |
| Adresse (Strasse, Stadt, PLZ) | ✓ | ⏳ |
| Profilfoto | Optional | ⏳ |
| Geschlecht | ✓ | ⏳ |
| Sichtbarkeitsmodus | ✓ | ⏳ |
| Sprachen | Optional | ⏳ |

---

## 2. 👤 Profil-Management

| Feature | Status | Notizen |
|---------|--------|---------|
| Profil anzeigen | ⏳ | |
| Profil bearbeiten | ⏳ | |
| Profilfoto hochladen | ⏳ | Storage Bucket "avatars" |
| Nickname ändern | ⏳ | |
| Adresse ändern | ⏳ | Mit Geocoding |
| Telefon ändern | ⏳ | |
| Sprachen ändern | ⏳ | Multi-Select Chips |
| IBAN für Auszahlung | ⏳ | |
| Urlaubsmodus | ⏳ | vacation_mode Toggle |

---

## 3. 🪪 ID-Verifizierung (NEU)

| Feature | Status | Notizen |
|---------|--------|---------|
| Upload-Dialog öffnen | ⏳ | Button "🪪 Jetzt verifizieren" |
| Bild hochladen | ⏳ | Max 5MB, nur Bilder |
| Privater Bucket | ⏳ | "id-documents" Bucket |
| Bestätigungs-Checkbox | ⏳ | Pflicht vor Absenden |
| Status "pending" setzen | ⏳ | Nach Upload |
| Admin: ID anzeigen | ⏳ | Signed URL (60s) |
| Admin: Genehmigen | ⏳ | Setzt id_verified=true |
| Admin: Ablehnen | ⏳ | Setzt status="rejected" |
| Auto-Löschung nach Genehmigung | ⏳ | Trigger-Funktion |

### Test-Schritte:
1. [ ] Als User einloggen
2. [ ] Profil → "Jetzt verifizieren" klicken
3. [ ] Testbild hochladen
4. [ ] Checkbox setzen → Absenden
5. [ ] Status prüfen: "Überprüfung läuft..."
6. [ ] Als Admin einloggen → /admin
7. [ ] Tab "Verifications" → ID-Dokument anzeigen
8. [ ] Genehmigen klicken
9. [ ] Prüfen: User hat jetzt ✓ Badge
10. [ ] Prüfen: ID-Dokument wurde gelöscht

---

## 4. 🍽️ Meal-Erstellung (Chef Mode)

| Feature | Status | Notizen |
|---------|--------|---------|
| Formular öffnen | ⏳ | /add-meal Route |
| Titel eingeben | ⏳ | Pflichtfeld |
| Beschreibung | ⏳ | Optional |
| Foto hochladen | ⏳ | Oder Stockfoto |
| Stockfoto-Badge | ⏳ | "📷 Symbolbild" |
| Portionen wählen | ⏳ | Counter |
| Abholzeit-Fenster | ⏳ | Start/Ende |
| Exchange-Mode | ⏳ | Online/Barter/PWYW |
| Preis (CHF 7-50) | ⏳ | Mit Validierung |
| Allergene taggen | ⏳ | Auto-Detection |
| Tags hinzufügen | ⏳ | Kategorien |
| Women-Only Toggle | ⏳ | Sichtbarkeit |
| Speichern | ⏳ | Mit Geocoding |

---

## 5. 📋 Feed & Discovery

| Feature | Status | Notizen |
|---------|--------|---------|
| Feed laden | ⏳ | Mit RLS-Filterung |
| Gast-Modus (Demo-Meals) | ⏳ | Ohne Login |
| Distanz-Filter | ⏳ | Basierend auf User-Standort |
| Distanz-Anzeige | ⏳ | "📍 1.2 km" |
| Meal-Karten | ⏳ | Ohne Preisanzeige! |
| Surprise-Badge | ⏳ | Zentriert, nur 1x 🎁 |
| PWYW-Badge | ⏳ | Zentriert |
| Tags anzeigen | ⏳ | Badges |
| Blockierte User ausblenden | ⏳ | Bidirektional |
| Women-Only Filterung | ⏳ | Visibility-Mode |

---

## 6. 🗺️ Karten-Ansicht

| Feature | Status | Notizen |
|---------|--------|---------|
| Karte laden | ⏳ | Leaflet + OSM |
| Fuzzy-Circles | ⏳ | ~200m Radius |
| Meal-Marker | ⏳ | Klickbar |
| Eigener Standort | ⏳ | Blue Dot |
| Zoom/Pan | ⏳ | Touch-Support |

---

## 7. 📄 Meal-Detail

| Feature | Status | Notizen |
|---------|--------|---------|
| Detail-Seite laden | ⏳ | /meal/:id |
| Bild anzeigen | ⏳ | Mit Stockfoto-Badge |
| Chef-Info | ⏳ | Name, Badges |
| Allergene-Warnung | ⏳ | Safety Alert |
| PWYW-Sektion | ⏳ | Mit Min/Suggested |
| Barter-Sektion | ⏳ | Gift-Badge |
| Abholzeit anzeigen | ⏳ | 24h Format |
| Portionen-Auswahl | ⏳ | Für Couples |
| "Chef fragen" Button | ⏳ | Chat öffnen |
| "Jetzt reservieren" | ⏳ | Booking-Flow |
| Fuzzy-Map | ⏳ | Vor Buchung |

---

## 8. 📅 Buchungs-System

| Feature | Status | Notizen |
|---------|--------|---------|
| Buchung erstellen | ⏳ | RPC book_meal |
| Profil-Gating | ⏳ | Adresse+Telefon nötig |
| Foto-Gating | ⏳ | Für Transaktionen |
| Status: pending | ⏳ | Nach Buchung |
| Status: confirmed | ⏳ | Chef bestätigt |
| Status: completed | ⏳ | Nach Abholung |
| Status: cancelled | ⏳ | Storniert |
| 15-Min Stornofrist | ⏳ | Grace Period |
| Inventory-Update | ⏳ | available_portions |
| Adress-Reveal | ⏳ | Nur nach Confirm |

---

## 9. 💬 Chat-System

| Feature | Status | Notizen |
|---------|--------|---------|
| Chat öffnen | ⏳ | ChatModal |
| Nachrichten senden | ⏳ | Realtime |
| Nachrichten empfangen | ⏳ | Subscription |
| Gelesen-Status | ⏳ | is_read |
| Übersetzen-Button | 🔧 | Mock-Implementierung |
| Pre-Booking Chat | ⏳ | "inquiry" Status |
| Blockierte User | ⏳ | Nachricht blockiert |

---

## 10. 💳 Zahlung (Stripe)

| Feature | Status | Notizen |
|---------|--------|---------|
| Stripe Integration | 🔧 | NICHT IMPLEMENTIERT |
| PaymentIntent erstellen | 🔧 | Edge Function nötig |
| Payment Element | 🔧 | UI-Komponente |
| Apple Pay / Google Pay | 🔧 | Wallet-Support |
| Mindestbetrag CHF 7 | ⏳ | Validierung |
| Plattform-Gebühr CHF 2 | 🔧 | In Berechnung |

---

## 11. 💰 Chef-Wallet & Auszahlung

| Feature | Status | Notizen |
|---------|--------|---------|
| Wallet-Balance anzeigen | ⏳ | Im Profil |
| payout_status Tracking | ⏳ | DB-Feld |
| "Auszahlung beantragen" | ⏳ | Min. CHF 10 |
| Admin: Auszahlungen Tab | ⏳ | Liste pending |
| Admin: Als bezahlt markieren | ⏳ | Status → paid |

---

## 12. ⭐ Karma-System

| Feature | Status | Notizen |
|---------|--------|---------|
| Start-Karma 100 | ⏳ | Bei Registrierung |
| +20 für Chef | ⏳ | Bei completed |
| +5 für Gast | ⏳ | Bei completed |
| Karma anzeigen | ⏳ | Im Profil |
| Level-Badges | ⏳ | "Food Saver" etc. |

---

## 13. 🛡️ Sicherheit & Moderation

| Feature | Status | Notizen |
|---------|--------|---------|
| User blockieren | ⏳ | BlockUserDialog |
| User melden | ⏳ | ReportDialog |
| Admin: Reports Tab | ⏳ | Review-Queue |
| RLS-Policies | ⏳ | Alle Tabellen |
| Sensitive Daten geschützt | ⏳ | phone, address |

---

## 14. 🌐 Internationalisierung

| Feature | Status | Notizen |
|---------|--------|---------|
| Deutsch (DE) | ⏳ | Standard |
| Englisch (EN) | ⏳ | Übersetzt |
| Sprache wechseln | ⏳ | LanguageSwitcher |
| Meal-Übersetzung | ⏳ | title_en, description_en |
| Legal-Seiten nur DE | ⏳ | Mit EN-Disclaimer |

---

## 15. 📱 PWA & Mobile

| Feature | Status | Notizen |
|---------|--------|---------|
| Manifest.json | ⏳ | Konfiguriert |
| Service Worker | ⏳ | vite-plugin-pwa |
| Install-Prompt | ⏳ | Bedingt (nicht auf /) |
| Offline-Support | ⏳ | Basis-Caching |
| Responsive Design | ⏳ | Mobile-First |

---

## 16. 🎭 Playwright E2E Tests

| Test Suite | Status | Notizen |
|------------|--------|---------|
| navigation.spec.ts | ⏳ | Homepage, Story, Trust, FAQ, Contact |
| auth.spec.ts | ⏳ | Login, Signup, Validation |
| feed.spec.ts | ⏳ | Feed & Map Loading |
| story-journey.spec.ts | ⏳ | Story → Partnerships Navigation |
| mobile.spec.ts | ⏳ | Mobile UX Tests |

### E2E Test-Befehle:
```bash
# Tests lokal ausführen
npx playwright test

# Mit UI
npx playwright test --ui

# Einzelne Suite
npx playwright test e2e/navigation.spec.ts

# Mobile Tests
npx playwright test e2e/mobile.spec.ts
```

---

## 16. ⚖️ Legal & Compliance

| Feature | Status | Notizen |
|---------|--------|---------|
| Impressum | ⏳ | /impressum |
| AGB | ⏳ | /agb |
| Cookie-Banner | ⏳ | GDPR/DSG |
| Datenschutz-Hinweise | ⏳ | In Formularen |

---

## 17. 🔧 Admin-Dashboard

| Feature | Status | Notizen |
|---------|--------|---------|
| Zugang prüfen | ⏳ | has_role('admin') |
| Tab: Verifications | ⏳ | Pending Queue |
| Tab: Users | ⏳ | User-Liste |
| Tab: Analytics | ⏳ | Statistiken |
| Tab: Feedback | ⏳ | App-Feedback |
| Tab: Payouts | ⏳ | Auszahlungen |
| Tab: Utilities | ⏳ | AI-Bildgenerierung |
| User löschen | ⏳ | Mit Bestätigung |

---

## 📝 Test-Protokoll

### Session 1: [DATUM]
| Test | Ergebnis | Bug-ID |
|------|----------|--------|
| ... | ... | ... |

---

## 🐛 Bekannte Bugs

| ID | Beschreibung | Priorität | Status |
|----|--------------|-----------|--------|
| BUG-001 | Stripe nicht implementiert | Hoch | 🔧 Offen |
| BUG-002 | TranslateButton ist Mock | Mittel | 🔧 Offen |

---

## 📊 Test-Fortschritt

```
Gesamt Features: ~80
Getestet: 0
Ausstehend: 80
Fehler: 0
```

**Fortschritt: 0%**

---

*Zuletzt aktualisiert: 2026-01-19*
