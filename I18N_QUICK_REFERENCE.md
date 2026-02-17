# i18n Audit Quick Reference

This is a condensed view of the most common hardcoded strings found in the codebase. See `I18N_AUDIT_REPORT.md` for the complete list.

## Quick Stats
- **224 hardcoded strings** across **34 files**
- **46 German strings** (21%) | **178 English strings** (79%)
- Most common: JSX text content (164 strings, 73%)

---

## Sample Findings by Category

### 🔴 High Priority - User-Facing UI

| File | Line | String | Suggested Key |
|------|------|--------|---------------|
| `Payment.tsx` | 97 | "Pay What You Want" | `pages.payment.pay_what_you_want` |
| `Admin.tsx` | 956 | "Access Denied" | `pages.admin.access_denied` |
| `OAuthCallback.tsx` | 154 | "Anmeldung fehlgeschlagen" | `pages.oauthcallback.anmeldung_fehlgeschlagen` |
| `FeedbackDialog.tsx` | 67 | "Send Feedback" | `components.feedbackdialog.send_feedback` |

### 🟡 Medium Priority - Form Placeholders

| File | Line | String | Suggested Key |
|------|------|--------|---------------|
| `FeedbackDialog.tsx` | 86 | "Describe the issue or suggestion in detail..." | `components.feedbackdialog.placeholder_describe_issue` |
| `AdminMessageDialog.tsx` | - | "Benutzer suchen..." | `components.admin_message_dialog.placeholder_search_users` |

### 🟢 Lower Priority - Accessibility

| File | Line | String | Type | Suggested Key |
|------|------|--------|------|---------------|
| `ui/sidebar.tsx` | 252 | "Toggle Sidebar" | aria-label | `ui.sidebar.aria_toggle_sidebar` |
| `ui/pagination.tsx` | 50 | "Go to previous page" | aria-label | `ui.pagination.aria_go_to_previous` |
| `ui/pagination.tsx` | 58 | "Go to next page" | aria-label | `ui.pagination.aria_go_to_next` |

---

## Top 10 Files by String Count

| Rank | File | Strings | Primary Language |
|------|------|---------|------------------|
| 1 | `Privacy.tsx` | 45 | German 🇩🇪 |
| 2 | `Admin.tsx` | 36 | Mixed 🌐 |
| 3 | `Trust.tsx` | 29 | German 🇩🇪 |
| 4 | `AdminHealth.tsx` | 14 | German 🇩🇪 |
| 5 | `Impressum.tsx` | 11 | German 🇩🇪 |
| 6 | `AdminUserProfileDialog.tsx` | 10 | German 🇩🇪 |
| 7 | `AdminReleaseChecklist.tsx` | 7 | English 🇬🇧 |
| 8 | `AdminMessageDialog.tsx` | 6 | German 🇩🇪 |
| 9 | `ui/pagination.tsx` | 5 | English 🇬🇧 |
| 10 | `ui/sidebar.tsx` | 5 | English 🇬🇧 |

---

## Common String Patterns

### Loading States (German)
- "Lade Daten..." → `loading_data`
- "Lade Historie..." → `loading_history`
- "Lade Benutzer..." → `loading_users`
- "Loading..." → `loading`
- "Läuft..." → `running`

### Error/Empty States (German)
- "Keine Benutzer gefunden" → `no_users_found`
- "Fehlende Angaben" → `missing_information`
- "Anmeldung fehlgeschlagen" → `login_failed`
- "Access Denied" → `access_denied`

### Admin Interface (Mixed)
- "Admin Dashboard" → `admin_dashboard`
- "Aktuelle Administratoren" → `current_administrators`
- "User Feedback" → `user_feedback`
- "Pending Verifications" → `pending_verifications`

### UI Components (English)
- "Toggle Sidebar" → `toggle_sidebar`
- "Previous" / "Next" → `previous` / `next`
- "More pages" → `more_pages`
- "Send Feedback" → `send_feedback`

---

## Implementation Example

### Before (Hardcoded)
```tsx
// src/pages/Payment.tsx:97
<h1 className="text-2xl font-bold">Pay What You Want</h1>

// src/pages/Admin.tsx:956
<div>Access Denied</div>
```

### After (i18n)
```tsx
import { useTranslation } from 'react-i18next';

function Payment() {
  const { t } = useTranslation();
  return (
    <h1 className="text-2xl font-bold">
      {t('pages.payment.pay_what_you_want')}
    </h1>
  );
}

function Admin() {
  const { t } = useTranslation();
  return <div>{t('pages.admin.access_denied')}</div>;
}
```

### Translation Files
```json
// src/i18n/locales/en.json
{
  "pages": {
    "payment": {
      "pay_what_you_want": "Pay What You Want"
    },
    "admin": {
      "access_denied": "Access Denied"
    }
  }
}

// src/i18n/locales/de.json
{
  "pages": {
    "payment": {
      "pay_what_you_want": "Zahle was du willst"
    },
    "admin": {
      "access_denied": "Zugriff verweigert"
    }
  }
}
```

---

## Next Steps

1. **Review** the full audit report (`I18N_AUDIT_REPORT.md`)
2. **Prioritize** which strings to internationalize first (see summary)
3. **Add** translation keys to `en.json` and `de.json`
4. **Refactor** components to use `t()` function
5. **Test** language switching
6. **Deploy** incrementally

---

**Full Documentation:**
- 📊 **Detailed Report:** `I18N_AUDIT_REPORT.md` (568 lines, all findings)
- 📋 **Executive Summary:** `I18N_AUDIT_SUMMARY.md` (strategy & recommendations)
- 🚀 **This Document:** Quick reference for common patterns

**Last Updated:** February 17, 2026
