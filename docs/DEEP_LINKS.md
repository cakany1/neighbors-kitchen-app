# Deep Links Configuration — Neighbors Kitchen Basel

This guide covers setting up Universal Links (iOS) and App Links (Android) for authentication flows.

## Overview

Deep links allow the app to handle URLs like:
- `https://share-kitchen-basel.lovable.app/verify-email#access_token=...`
- `https://share-kitchen-basel.lovable.app/login?type=recovery&token=...`
- `https://www.neighbors-kitchen.ch/meal/abc123`

When users click these links on mobile, the installed app opens directly instead of the browser.

---

## iOS Universal Links

### Step 1: Configure Associated Domains in Xcode

1. Open project in Xcode: `npx cap open ios`
2. Select your app target → **Signing & Capabilities**
3. Click **+ Capability** → Add **Associated Domains**
4. Add domains:
   ```
   applinks:share-kitchen-basel.lovable.app
   applinks:www.neighbors-kitchen.ch
   ```

### Step 2: Update apple-app-site-association

Edit `public/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["YOUR_TEAM_ID.app.lovable.625e9f2209024c99a696890f601a3230"],
        "components": [
          { "/": "/verify-email*" },
          { "/": "/login*" },
          { "/": "/auth/callback*" },
          { "/": "/meal/*" },
          { "/": "/chef/*" }
        ]
      }
    ]
  }
}
```

**Find your Team ID:**
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to Membership → Team ID

### Step 3: Verify Configuration

Test that the AASA file is accessible:
```bash
curl -I https://share-kitchen-basel.lovable.app/.well-known/apple-app-site-association
# Should return 200 OK with application/json content-type
```

---

## Android App Links

### Step 1: Get SHA256 Fingerprint

**Debug keystore** (for development):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Release keystore** (for production):
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

Copy the SHA256 fingerprint (looks like: `14:6D:E9:...`).

### Step 2: Update assetlinks.json

Edit `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.lovable.625e9f2209024c99a696890f601a3230",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:..." // Your actual fingerprint
      ]
    }
  }
]
```

### Step 3: Configure AndroidManifest.xml

After `npx cap add android`, edit `android/app/src/main/AndroidManifest.xml`:

Add inside the `<activity>` tag (after existing intent-filters):

```xml
<!-- Deep Links for Auth Flows -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" 
          android:host="share-kitchen-basel.lovable.app" />
</intent-filter>

<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" 
          android:host="www.neighbors-kitchen.ch" />
</intent-filter>

<!-- Custom URL Scheme Fallback -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="neighbors-kitchen" />
</intent-filter>
```

### Step 4: Verify Configuration

Test that assetlinks.json is accessible:
```bash
curl https://share-kitchen-basel.lovable.app/.well-known/assetlinks.json
```

Use Google's verification tool:
https://developers.google.com/digital-asset-links/tools/generator

---

## Code Integration

### Initialize in App.tsx

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initDeepLinkListener } from '@/utils/deepLinkHandler';

function App() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Initialize deep link handler for native apps
    const cleanup = initDeepLinkListener(navigate);
    return cleanup;
  }, [navigate]);
  
  // ... rest of app
}
```

### Auth Redirects

Use the helper for auth operations:

```tsx
import { buildAuthRedirectUrl } from '@/utils/deepLinkHandler';

// Email verification
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: buildAuthRedirectUrl('/verify-email')
  }
});

// Password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: buildAuthRedirectUrl('/login')
});
```

---

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted "https://share-kitchen-basel.lovable.app/verify-email"
```

### Android Emulator

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://share-kitchen-basel.lovable.app/verify-email"
```

### Physical Device

1. Send yourself an email with the verification/reset link
2. Open email on device with app installed
3. Tap link → App should open and handle the flow

---

## Supported Deep Link Paths

| Path | Purpose |
|------|---------|
| `/verify-email` | Email verification callback |
| `/login?type=recovery` | Password reset callback |
| `/auth/callback` | OAuth callback (Google) |
| `/meal/:id` | Direct link to meal |
| `/chef/:id` | Direct link to chef profile |
| `/feed` | Main feed |

---

## Troubleshooting

### iOS: Links open in Safari instead of app

1. Ensure Associated Domains capability is added
2. Verify Team ID in AASA file matches your account
3. Check AASA is served with `application/json` content-type
4. Wait 24-48 hours for Apple's CDN to cache

### Android: Links not verified

1. Verify SHA256 fingerprint is correct
2. Check assetlinks.json is accessible (no redirects)
3. Ensure `android:autoVerify="true"` is set
4. Clear app's "Open by default" settings and retry

### Auth tokens not working

1. Check URL hash vs query params parsing
2. Verify Supabase redirect URLs are configured
3. Check token expiration (usually 1 hour for email links)

---

## Checklist

### Before Release

- [ ] Replace `TEAM_ID` in apple-app-site-association
- [ ] Replace `YOUR_SHA256_FINGERPRINT_HERE` in assetlinks.json
- [ ] Add Associated Domains in Xcode
- [ ] Add intent-filters in AndroidManifest.xml
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Verify Supabase redirect URLs include production domain
