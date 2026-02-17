# i18n Audit Report - Neighbors Kitchen App

**Date:** February 17, 2026
**Scope:** src/pages and src/components
**Excluded:** Translation files, test files, console logs

---

## Executive Summary

- **Total files with hardcoded strings:** 34
- **Total hardcoded strings found:** 224
  - German strings: 46
  - English strings: 178

### String Types Breakdown:

- **jsx_text:** 164
- **string_literal:** 46
- **placeholder:** 7
- **aria-label:** 4
- **alt:** 2
- **title:** 1

---

## Detailed Findings

## Pages

### 📄 src/pages/AGB.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 82 | `jsx_text` | Deklaration von Allergenen | `pages.agb.deklaration_von_allergenen` |
| 122 | `jsx_text` | 8. Änderungen | `pages.agb.8_änderungen` |

### 📄 src/pages/AddMeal.tsx

**Total strings:** 4

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 837 | `jsx_text` | Oder wähle eine individuelle Zeit: | `pages.addmeal.oder_wähle_eine_individuelle` |
| 1145 | `jsx_text` | 🥡 Behälter für Abholung | `pages.addmeal.behälter_für_abholung` |
| 1160 | `jsx_text` | 🍽️ Teller genügt | `pages.addmeal.teller_genügt` |
| 1327 | `jsx_text` | Restaurant-Referenzpreis (CHF) | `pages.addmeal.restaurantreferenzpreis_chf` |

### 📄 src/pages/Admin.tsx

**Total strings:** 36

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 943 | `jsx_text` | Loading... | `pages.admin.loading` |
| 956 | `jsx_text` | Access Denied | `pages.admin.access_denied` |
| 980 | `jsx_text` | Admin Dashboard | `pages.admin.admin_dashboard` |
| 982 | `jsx_text` | Manage verifications, analytics, and feedback | `pages.admin.manage_verifications_analytics_and` |
| 1079 | `jsx_text` | Fehlende Angaben: | `pages.admin.fehlende_angaben` |
| 1203 | `jsx_text` | Pending Verifications | `pages.admin.pending_verifications` |
| 1210 | `jsx_text` | Loading verifications... | `pages.admin.loading_verifications` |
| 1293 | `jsx_text` | Fehlende Angaben: | `pages.admin.fehlende_angaben` |
| 1505 | `jsx_text` | Lade Historie... | `pages.admin.lade_historie` |
| 1600 | `jsx_text` | Lade Benutzer... | `pages.admin.lade_benutzer` |
| 1604 | `jsx_text` | Keine Benutzer gefunden. | `pages.admin.keine_benutzer_gefunden` |
| 1676 | `jsx_text` | ⚠️ Unvollständiges Profil: | `pages.admin.unvollständiges_profil` |
| 1812 | `jsx_text` | Registered community members | `pages.admin.registered_community_members` |
| 1818 | `jsx_text` | Total Meals | `pages.admin.total_meals` |
| 1825 | `jsx_text` | Meals shared in community | `pages.admin.meals_shared_in_community` |
| 1831 | `jsx_text` | Active Bookings | `pages.admin.active_bookings` |
| 1838 | `jsx_text` | Pending or confirmed | `pages.admin.pending_or_confirmed` |
| 1856 | `jsx_text` | Unvollständige Profile | `pages.admin.unvollständige_profile` |
| 1863 | `jsx_text` | Fehlt: Avatar, Telefon oder Adresse | `pages.admin.fehlt_avatar_telefon_oder` |
| 1869 | `jsx_text` | Erinnerungen gesendet | `pages.admin.erinnerungen_gesendet` |
| 1876 | `jsx_text` | User mit mind. 1 Erinnerung | `pages.admin.user_mit_mind_1` |
| 1882 | `jsx_text` | Max. erreicht (3/3) | `pages.admin.max_erreicht_33` |
| 1889 | `jsx_text` | Keine weiteren E-Mails | `pages.admin.keine_weiteren_emails` |
| 1932 | `jsx_text` | Lade Daten... | `pages.admin.lade_daten` |
| 1947 | `jsx_text` | Letzte E-Mail | `pages.admin.letzte_email` |
| 2016 | `jsx_text` | User Feedback | `pages.admin.user_feedback` |
| 2017 | `jsx_text` | Bug reports and feature suggestions | `pages.admin.bug_reports_and_feature` |
| 2021 | `jsx_text` | Loading feedback... | `pages.admin.loading_feedback` |
| 2025 | `jsx_text` | No feedback submitted yet. | `pages.admin.no_feedback_submitted_yet` |
| 2098 | `jsx_text` | Loading payouts... | `pages.admin.loading_payouts` |
| 2180 | `jsx_text` | über | `pages.admin.über` |
| 2187 | `jsx_text` | Notiz (optional) | `pages.admin.notiz_optional` |
| 2237 | `jsx_text` | Loading history... | `pages.admin.loading_history` |
| 2310 | `jsx_text` | Loading... | `pages.admin.loading` |
| 2398 | `jsx_text` | Aktuelle Administratoren | `pages.admin.aktuelle_administratoren` |
| 2442 | `jsx_text` | Generate Pumpkin Lasagna Image | `pages.admin.generate_pumpkin_lasagna_image` |

### 📄 src/pages/AdminHealth.tsx

**Total strings:** 14

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 515 | `jsx_text` | Läuft... | `pages.adminhealth.läuft` |
| 517 | `jsx_text` | Test starten | `pages.adminhealth.test_starten` |
| 531 | `jsx_text` | QA Runs | `pages.adminhealth.qa_runs` |
| 575 | `jsx_text` | Letzte Laufzeit | `pages.adminhealth.letzte_laufzeit` |
| 587 | `jsx_text` | Zürich (eu-central-2) | `pages.adminhealth.zürich_eucentral2` |
| 657 | `jsx_text` | Nicht erreichbar | `pages.adminhealth.nicht_erreichbar` |
| 718 | `jsx_text` | Aktueller Modus | `pages.adminhealth.aktueller_modus` |
| 736 | `jsx_text` | Letzter Webhook | `pages.adminhealth.letzter_webhook` |
| 766 | `jsx_text` | Letzte 24h | `pages.adminhealth.letzte_24h` |
| 827 | `jsx_text` | Aktive Geräte | `pages.adminhealth.aktive_geräte` |
| 846 | `jsx_text` | Nach Umgebung | `pages.adminhealth.nach_umgebung` |
| 866 | `jsx_text` | Letztes Token | `pages.adminhealth.letztes_token` |
| 892 | `jsx_text` | Letzte 24h Benachrichtigungen | `pages.adminhealth.letzte_24h_benachrichtigungen` |
| 1042 | `jsx_text` | Vorherige QA-Läufe | `pages.adminhealth.vorherige_qaläufe` |

### 📄 src/pages/AdminReleaseChecklist.tsx

**Total strings:** 33

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 23 | `string_literal` | Signup works | `pages.adminreleasechecklist.signup_works` |
| 23 | `string_literal` | New user can register with email | `pages.adminreleasechecklist.new_user_can_register` |
| 24 | `string_literal` | Email verification works | `pages.adminreleasechecklist.email_verification_works` |
| 24 | `string_literal` | Verification email is sent and link works | `pages.adminreleasechecklist.verification_email_is_sent` |
| 25 | `string_literal` | Login works | `pages.adminreleasechecklist.login_works` |
| 25 | `string_literal` | Existing user can log in successfully | `pages.adminreleasechecklist.existing_user_can_log` |
| 26 | `string_literal` | Partner linking optional | `pages.adminreleasechecklist.partner_linking_optional` |
| 26 | `string_literal` | Household linking works with dual confirmation, nothing b... | `pages.adminreleasechecklist.household_linking_works_with` |
| 29 | `string_literal` | Add meal works | `pages.adminreleasechecklist.add_meal_works` |
| 29 | `string_literal` | Chef can create and publish a meal | `pages.adminreleasechecklist.chef_can_create_and` |
| 30 | `string_literal` | Delete <5 min works | `pages.adminreleasechecklist.delete_5_min_works` |
| 30 | `string_literal` | Meal deletion within 5 min has no karma penalty | `pages.adminreleasechecklist.meal_deletion_within_5` |
| 31 | `string_literal` | Delete >5 min gives -10 karma | `pages.adminreleasechecklist.delete_5_min_gives` |
| 31 | `string_literal` | Meal deletion after 5 min deducts 10 karma | `pages.adminreleasechecklist.meal_deletion_after_5` |
| 32 | `string_literal` | AI meal preview labeled | `pages.adminreleasechecklist.ai_meal_preview_labeled` |
| 32 | `string_literal` | AI-generated images show  | `pages.adminreleasechecklist.aigenerated_images_show` |
| 35 | `string_literal` | Stripe TEST visible | `pages.adminreleasechecklist.stripe_test_visible` |
| 35 | `string_literal` | Test mode indicator visible in admin, test payments work | `pages.adminreleasechecklist.test_mode_indicator_visible` |
| 36 | `string_literal` | Stripe LIVE visible | `pages.adminreleasechecklist.stripe_live_visible` |
| 36 | `string_literal` | Live mode indicator visible, real payments processed | `pages.adminreleasechecklist.live_mode_indicator_visible` |
| 39 | `string_literal` | CAPTCHA on contact works | `pages.adminreleasechecklist.captcha_on_contact_works` |
| 39 | `string_literal` | Turnstile captcha appears and validates on contact form | `pages.adminreleasechecklist.turnstile_captcha_appears_and` |
| 40 | `string_literal` | Women-only flow works | `pages.adminreleasechecklist.womenonly_flow_works` |
| 40 | `string_literal` | Women-only meals require photo verification, only visible... | `pages.adminreleasechecklist.womenonly_meals_require_photo` |
| 41 | `string_literal` | Vacation mode works | `pages.adminreleasechecklist.vacation_mode_works` |
| 41 | `string_literal` | User can enable vacation mode, meals hidden from feed | `pages.adminreleasechecklist.user_can_enable_vacation` |
| 44 | `string_literal` | Notifications behave correctly | `pages.adminreleasechecklist.notifications_behave_correctly` |
| 44 | `string_literal` | Email notifications sent for bookings, cancellations, rat... | `pages.adminreleasechecklist.email_notifications_sent_for` |
| 111 | `string_literal` | Failed to load checklist | `pages.adminreleasechecklist.failed_to_load_checklist` |
| 158 | `string_literal` | Checklist saved successfully | `pages.adminreleasechecklist.checklist_saved_successfully` |
| 164 | `string_literal` | Failed to save checklist | `pages.adminreleasechecklist.failed_to_save_checklist` |
| 196 | `jsx_text` | Release QA Checklist | `pages.adminreleasechecklist.release_qa_checklist` |
| 305 | `placeholder` | Optional notes... | `pages.adminreleasechecklist.placeholder_optional_notes` |

### 📄 src/pages/ChefProfile.tsx

**Total strings:** 3

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 112 | `jsx_text` | Chef not found | `pages.chefprofile.chef_not_found` |
| 267 | `jsx_text` | No meals shared yet | `pages.chefprofile.no_meals_shared_yet` |
| 296 | `jsx_text` | No gallery photos yet | `pages.chefprofile.no_gallery_photos_yet` |

### 📄 src/pages/Impressum.tsx

**Total strings:** 3

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 39 | `jsx_text` | Neighbors Kitchen | `pages.impressum.neighbors_kitchen` |
| 57 | `jsx_text` | Verantwortlich für den Inhalt dieser Website: | `pages.impressum.verantwortlich_für_den_inhalt` |
| 76 | `jsx_text` | Haftung für Links | `pages.impressum.haftung_für_links` |

### 📄 src/pages/Index.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 92 | `jsx_text` | Neighbors Kitchen | `pages.index.neighbors_kitchen` |

### 📄 src/pages/Install.tsx

**Total strings:** 3

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 43 | `jsx_text` | App Store | `pages.install.app_store` |
| 54 | `jsx_text` | Google Play | `pages.install.google_play` |
| 80 | `jsx_text` | 🍎 iPhone (Safari) | `pages.install.iphone_safari` |

### 📄 src/pages/NotFound.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 15 | `jsx_text` | Oops! Page not found | `pages.notfound.oops_page_not_found` |

### 📄 src/pages/OAuthCallback.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 154 | `jsx_text` | Anmeldung fehlgeschlagen | `pages.oauthcallback.anmeldung_fehlgeschlagen` |

### 📄 src/pages/Payment.tsx

**Total strings:** 5

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 97 | `jsx_text` | Pay What You Want | `pages.payment.pay_what_you_want` |
| 128 | `jsx_text` | Choose Your Amount | `pages.payment.choose_your_amount` |
| 144 | `jsx_text` | Beitrag an Koch: | `pages.payment.beitrag_an_koch` |
| 148 | `jsx_text` | Servicegebühr: | `pages.payment.servicegebühr` |
| 198 | `jsx_text` | Why pay fairly? | `pages.payment.why_pay_fairly` |

### 📄 src/pages/Privacy.tsx

**Total strings:** 45

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 14 | `string_literal` | Privacy Policy – Neighbors Kitchen | `pages.privacy.privacy_policy_neighbors_kitchen` |
| 34 | `jsx_text` | Datenschutzerklärung | `pages.privacy.datenschutzerklärung` |
| 35 | `jsx_text` | Zuletzt aktualisiert: Februar 2025 | `pages.privacy.zuletzt_aktualisiert_februar_2025` |
| 70 | `jsx_text` | Bei Anmeldung via Google OAuth: | `pages.privacy.bei_anmeldung_via_google` |
| 72 | `jsx_text` | E-Mail-Adresse (zur Account-Erstellung und Kommunikation) | `pages.privacy.emailadresse_zur_accounterstellung_und` |
| 73 | `jsx_text` | Anzeigename (für Ihr Profil) | `pages.privacy.anzeigename_für_ihr_profil` |
| 74 | `jsx_text` | Profilbild (optional, falls Sie eines bei Google hinterle... | `pages.privacy.profilbild_optional_falls_sie` |
| 77 | `jsx_text` | App-interne Daten: | `pages.privacy.appinterne_daten` |
| 79 | `jsx_text` | Benutzername / Nickname | `pages.privacy.benutzername_nickname` |
| 80 | `jsx_text` | Standort (nur als ungefähre Zone – exakte Adressen sind n... | `pages.privacy.standort_nur_als_ungefähre` |
| 81 | `jsx_text` | Angebote, die Sie erstellen | `pages.privacy.angebote_die_sie_erstellen` |
| 82 | `jsx_text` | Buchungen, die Sie tätigen | `pages.privacy.buchungen_die_sie_tätigen` |
| 83 | `jsx_text` | Nachrichten im Buchungs-Chat | `pages.privacy.nachrichten_im_buchungschat` |
| 97 | `jsx_text` | Erstellung und Verwaltung Ihres Benutzerkontos | `pages.privacy.erstellung_und_verwaltung_ihres` |
| 98 | `jsx_text` | Login-Authentifizierung | `pages.privacy.loginauthentifizierung` |
| 99 | `jsx_text` | Anzeige Ihres Namens und Profilbilds in der App | `pages.privacy.anzeige_ihres_namens_und` |
| 103 | `jsx_text` | Wir verwenden Ihre Google-Daten NICHT für: | `pages.privacy.wir_verwenden_ihre_googledaten` |
| 105 | `jsx_text` | Werbung oder Marketing | `pages.privacy.werbung_oder_marketing` |
| 106 | `jsx_text` | Tracking oder Profiling | `pages.privacy.tracking_oder_profiling` |
| 107 | `jsx_text` | Verkauf oder Weitergabe an Dritte | `pages.privacy.verkauf_oder_weitergabe_an` |
| 108 | `jsx_text` | Analyse zu kommerziellen Zwecken | `pages.privacy.analyse_zu_kommerziellen_zwecken` |
| 120 | `jsx_text` | Ihre Daten werden in einer PostgreSQL-Datenbank bei Supab... | `pages.privacy.ihre_daten_werden_in` |
| 121 | `jsx_text` | Server-Standort: Schweiz (AWS Zürich, eu-central-2). | `pages.privacy.serverstandort_schweiz_aws_zürich` |
| 122 | `jsx_text` | Ihre Daten unterliegen dem Schweizer Datenschutzgesetz (D... | `pages.privacy.ihre_daten_unterliegen_dem` |
| 123 | `jsx_text` | Bei Login via Google OAuth speichern wir keine Passwörter... | `pages.privacy.bei_login_via_google` |
| 124 | `jsx_text` | Daten werden so lange gespeichert, wie Ihr Konto aktiv ist. | `pages.privacy.daten_werden_so_lange` |
| 130 | `jsx_text` | 5. Weitergabe an Dritte | `pages.privacy.5_weitergabe_an_dritte` |
| 148 | `jsx_text` | Alle Ihre Profildaten entfernt | `pages.privacy.alle_ihre_profildaten_entfernt` |
| 149 | `jsx_text` | Ihre Angebote und Buchungshistorie anonymisiert oder gelö... | `pages.privacy.ihre_angebote_und_buchungshistorie` |
| 150 | `jsx_text` | Ihre Verbindung zu Google OAuth aufgehoben | `pages.privacy.ihre_verbindung_zu_google` |
| 180 | `jsx_text` | 8. Einhaltung der Google API Services User Data Policy | `pages.privacy.8_einhaltung_der_google` |
| 183 | `jsx_text` | Limited Use Disclosure: | `pages.privacy.limited_use_disclosure` |
| 200 | `jsx_text` | Wir verwenden Google-Nutzerdaten nur für die in dieser Ri... | `pages.privacy.wir_verwenden_googlenutzerdaten_nur` |
| 201 | `jsx_text` | Wir übertragen Google-Nutzerdaten nicht an Dritte (ausser... | `pages.privacy.wir_übertragen_googlenutzerdaten_nicht` |
| 202 | `jsx_text` | Wir verwenden Google-Nutzerdaten nicht für Werbung. | `pages.privacy.wir_verwenden_googlenutzerdaten_nicht` |
| 203 | `jsx_text` | Menschen lesen Ihre Daten nur mit Ihrer Zustimmung, aus S... | `pages.privacy.menschen_lesen_ihre_daten` |
| 217 | `jsx_text` | Row Level Security (RLS): | `pages.privacy.row_level_security_rls` |
| 217 | `jsx_text` | Jeder Nutzer kann nur auf seine eigenen Daten zugreifen. | `pages.privacy.jeder_nutzer_kann_nur` |
| 218 | `jsx_text` | Verschlüsselte Verbindung: | `pages.privacy.verschlüsselte_verbindung` |
| 218 | `jsx_text` | Alle Datenübertragungen erfolgen über HTTPS. | `pages.privacy.alle_datenübertragungen_erfolgen_über` |
| 219 | `jsx_text` | Exakte Adressen von Gastgebern werden erst nach bestätigt... | `pages.privacy.exakte_adressen_von_gastgebern` |
| 220 | `jsx_text` | Fuzzy Location: | `pages.privacy.fuzzy_location` |
| 220 | `jsx_text` | Auf Karten wird nur ein ungefährer Standortbereich angeze... | `pages.privacy.auf_karten_wird_nur` |
| 221 | `jsx_text` | Admin-Funktionen sind durch Rollen und Berechtigungen ges... | `pages.privacy.adminfunktionen_sind_durch_rollen` |
| 232 | `jsx_text` | Verantwortliche Stelle: | `pages.privacy.verantwortliche_stelle` |

### 📄 src/pages/Profile.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 145 | `jsx_text` | 0 && cleanPhone.length | `pages.profile.0_cleanphonelength` |

### 📄 src/pages/Story.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 35 | `alt` | Neighbors sharing food | `pages.story.alt_neighbors_sharing_food` |

### 📄 src/pages/Trust.tsx

**Total strings:** 16

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 14 | `string_literal` | Trust & Safety – Neighbors Kitchen | `pages.trust.trust_safety_neighbors_kitchen` |
| 34 | `jsx_text` | Trust & Safety | `pages.trust.trust_safety` |
| 66 | `jsx_text` | Exakte Adressen werden erst nach bestätigter Buchung sich... | `pages.trust.exakte_adressen_werden_erst` |
| 70 | `jsx_text` | Auf Karten wird nur ein ungefährer Standort angezeigt | `pages.trust.auf_karten_wird_nur` |
| 74 | `jsx_text` | Persönliche Daten sind durch Row Level Security geschützt | `pages.trust.persönliche_daten_sind_durch` |
| 78 | `jsx_text` | Alle Verbindungen sind verschlüsselt (HTTPS) | `pages.trust.alle_verbindungen_sind_verschlüsselt` |
| 109 | `jsx_text` | Keine Weitergabe: | `pages.trust.keine_weitergabe` |
| 114 | `jsx_text` | Datenschutzerklärung | `pages.trust.datenschutzerklärung` |
| 128 | `jsx_text` | Registrierung erforderlich für Buchungen | `pages.trust.registrierung_erforderlich_für_buchungen` |
| 132 | `jsx_text` | Optionale Verifizierung für Gastgeber | `pages.trust.optionale_verifizierung_für_gastgeber` |
| 136 | `jsx_text` | Melde-Funktion für unangemessenes Verhalten | `pages.trust.meldefunktion_für_unangemessenes_verhalten` |
| 140 | `jsx_text` | Admin-Moderation bei Konflikten | `pages.trust.adminmoderation_bei_konflikten` |
| 185 | `jsx_text` | Diskriminierende Inhalte | `pages.trust.diskriminierende_inhalte` |
| 189 | `jsx_text` | Belästigung | `pages.trust.belästigung` |
| 193 | `jsx_text` | Irreführende Angaben | `pages.trust.irreführende_angaben` |
| 197 | `jsx_text` | Gewerblicher Verkauf | `pages.trust.gewerblicher_verkauf` |

## Components

### 🧩 src/components/AdminAnalyticsDashboard.tsx

**Total strings:** 9

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 190 | `jsx_text` | Live Analytics | `components.adminanalyticsdashboard.live_analytics` |
| 207 | `jsx_text` | Aktive User | `components.adminanalyticsdashboard.aktive_user` |
| 221 | `jsx_text` | PWA Installationen | `components.adminanalyticsdashboard.pwa_installationen` |
| 235 | `jsx_text` | Ø Session-Dauer | `components.adminanalyticsdashboard.ø_sessiondauer` |
| 249 | `jsx_text` | Total Sessions | `components.adminanalyticsdashboard.total_sessions` |
| 260 | `jsx_text` | Geräte-Verteilung | `components.adminanalyticsdashboard.geräteverteilung` |
| 319 | `jsx_text` | Wo User die App verlassen | `components.adminanalyticsdashboard.wo_user_die_app` |
| 346 | `jsx_text` | Aktuelle Sessions | `components.adminanalyticsdashboard.aktuelle_sessions` |
| 347 | `jsx_text` | Die letzten 20 User-Sessions | `components.adminanalyticsdashboard.die_letzten_20_usersessions` |

### 🧩 src/components/AdminMessageDialog.tsx

**Total strings:** 3

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 127 | `jsx_text` | Empfänger | `components.adminmessagedialog.empfänger` |
| 156 | `placeholder` | User suchen... | `components.adminmessagedialog.placeholder_user_suchen` |
| 233 | `placeholder` | Deine Nachricht an die Community... | `components.adminmessagedialog.placeholder_deine_nachricht_an_die` |

### 🧩 src/components/AdminReadAuditLog.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 108 | `placeholder` | User ID... | `components.adminreadauditlog.placeholder_user_id` |
| 117 | `placeholder` | Admin ID... | `components.adminreadauditlog.placeholder_admin_id` |

### 🧩 src/components/AdminStripeStatus.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 82 | `jsx_text` | Stripe Webhook-Protokoll | `components.adminstripestatus.stripe_webhookprotokoll` |

### 🧩 src/components/AdminUserProfileDialog.tsx

**Total strings:** 10

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 84 | `jsx_text` | Nicht ausgefüllt | `components.adminuserprofiledialog.nicht_ausgefüllt` |
| 209 | `jsx_text` | Profil-Vollständigkeit | `components.adminuserprofiledialog.profilvollständigkeit` |
| 227 | `string_literal` | ID verifiziert | `components.adminuserprofiledialog.id_verifiziert` |
| 228 | `string_literal` | Tel. verifiziert | `components.adminuserprofiledialog.tel_verifiziert` |
| 265 | `string_literal` | Echter Name anzeigen | `components.adminuserprofiledialog.echter_name_anzeigen` |
| 284 | `string_literal` | Tel. verifiziert | `components.adminuserprofiledialog.tel_verifiziert` |
| 417 | `string_literal` | ID verifiziert | `components.adminuserprofiledialog.id_verifiziert` |
| 446 | `string_literal` | No-Shows | `components.adminuserprofiledialog.noshows` |
| 480 | `string_literal` | Registriert am | `components.adminuserprofiledialog.registriert_am` |
| 485 | `string_literal` | Letzte Aktualisierung | `components.adminuserprofiledialog.letzte_aktualisierung` |

### 🧩 src/components/BlockUserDialog.tsx

**Total strings:** 4

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 80 | `jsx_text` | You won't see their meals in the feed | `components.blockuserdialog.you_wont_see_their` |
| 81 | `jsx_text` | They won't be able to send you messages | `components.blockuserdialog.they_wont_be_able` |
| 82 | `jsx_text` | You won't be able to book their meals | `components.blockuserdialog.you_wont_be_able` |
| 83 | `jsx_text` | They won't see your meals either | `components.blockuserdialog.they_wont_see_your` |

### 🧩 src/components/BlockedUsersList.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 112 | `jsx_text` | Lädt... | `components.blockeduserslist.lädt` |

### 🧩 src/components/ChefBookings.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 79 | `jsx_text` | No-Show | `components.chefbookings.noshow` |

### 🧩 src/components/FeedbackDialog.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 67 | `jsx_text` | Send Feedback | `components.feedbackdialog.send_feedback` |
| 86 | `placeholder` | Describe the issue or suggestion in detail... | `components.feedbackdialog.placeholder_describe_the_issue_or` |

### 🧩 src/components/Header.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 92 | `jsx_text` | Neighbors Kitchen | `components.header.neighbors_kitchen` |

### 🧩 src/components/InstallPrompt.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 106 | `jsx_text` | App installieren | `components.installprompt.app_installieren` |
| 119 | `jsx_text` | App installieren | `components.installprompt.app_installieren` |

### 🧩 src/components/MealCard.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 148 | `alt` | AI preview | `components.mealcard.alt_ai_preview` |
| 220 | `jsx_text` | Online Payment | `components.mealcard.online_payment` |

### 🧩 src/components/ReliabilityDisplay.tsx

**Total strings:** 1

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 20 | `jsx_text` | 0 && noShows | `components.reliabilitydisplay.0_noshows` |

### 🧩 src/components/VerificationBadge.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 20 | `aria-label` | Verified User | `components.verificationbadge.aria_verified_user` |
| 20 | `string_literal` | Verified User | `components.verificationbadge.verified_user` |

### 🧩 src/components/meals/TagSelector.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 119 | `placeholder` | Weiteres Allergen... | `components.tagselector.placeholder_weiteres_allergen` |
| 128 | `jsx_text` | Tags / Kategorien | `components.tagselector.tags_kategorien` |

### 🧩 src/components/ui/carousel.tsx

**Total strings:** 2

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 189 | `jsx_text` | Previous slide | `ui.carousel.previous_slide` |
| 217 | `jsx_text` | Next slide | `ui.carousel.next_slide` |

### 🧩 src/components/ui/pagination.tsx

**Total strings:** 5

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 50 | `aria-label` | Go to previous page | `ui.pagination.aria_go_to_previous_page` |
| 50 | `string_literal` | Go to previous page | `ui.pagination.go_to_previous_page` |
| 58 | `aria-label` | Go to next page | `ui.pagination.aria_go_to_next_page` |
| 58 | `string_literal` | Go to next page | `ui.pagination.go_to_next_page` |
| 68 | `jsx_text` | More pages | `ui.pagination.more_pages` |

### 🧩 src/components/ui/sidebar.tsx

**Total strings:** 5

| Line | Type | Hardcoded String | Suggested Translation Key |
|------|------|------------------|---------------------------|
| 237 | `jsx_text` | Toggle Sidebar | `ui.sidebar.toggle_sidebar` |
| 252 | `aria-label` | Toggle Sidebar | `ui.sidebar.aria_toggle_sidebar` |
| 252 | `string_literal` | Toggle Sidebar | `ui.sidebar.toggle_sidebar` |
| 255 | `title` | Toggle Sidebar | `ui.sidebar.title_toggle_sidebar` |
| 255 | `string_literal` | Toggle Sidebar | `ui.sidebar.toggle_sidebar` |

---

## Recommendations

### Priority 1: High-Impact UI Strings
- Page titles and headings
- Button labels and call-to-action text
- Form labels and placeholders
- Error and success messages

### Priority 2: Accessibility Strings
- `aria-label` attributes
- `alt` text for images
- `title` attributes for tooltips

### Priority 3: Helper Text
- Placeholder examples
- Instructional text
- Empty state messages

### Implementation Steps

1. **Create translation keys** in `/src/i18n/locales/en.json` and `/src/i18n/locales/de.json`
2. **Import useTranslation** hook in each file: `import { useTranslation } from 'react-i18next'`
3. **Replace hardcoded strings** with `t('suggested.key')` calls
4. **Test** that all strings display correctly in both languages
5. **Verify** no regressions in functionality

### Example Refactoring

**Before:**
```tsx
placeholder="Benutzer suchen..."
```

**After:**
```tsx
const { t } = useTranslation();
// ...
placeholder={t("components.admin_message_dialog.placeholder_benutzer_suchen")}
```

**Translation files:**
```json
// en.json
{
  "components": {
    "admin_message_dialog": {
      "placeholder_benutzer_suchen": "Search users..."
    }
  }
}

// de.json
{
  "components": {
    "admin_message_dialog": {
      "placeholder_benutzer_suchen": "Benutzer suchen..."
    }
  }
}
```

---

## Notes

- This audit was performed using automated pattern matching
- Some edge cases may require manual review
- Context-dependent strings may need different translation keys
- Some technical strings (e.g., format examples like 'TT.MM.JJJJ') might be intentionally hardcoded

---

**Report generated:** 224 hardcoded strings found across 34 files.