# Mobile Store Readiness Checklist

Use this checklist to verify your project is ready for iOS App Store and Google Play Store submission.

---

## ✅ Configuration Verification

### Capacitor Config (`capacitor.config.ts`)

- [ ] **appId**: `app.lovable.625e9f2209024c99a696890f601a3230` ✓
- [ ] **appName**: `Neighbors Kitchen` ✓
- [ ] **webDir**: `dist` ✓
- [ ] **Build output**: `npm run build` creates `dist/index.html` ✓
- [ ] **Server block**: Commented out for production builds ✓
- [ ] **iOS scheme**: `neighbors-kitchen` ✓
- [ ] **Splash Screen**: `launchShowDuration: 2000` ✓
- [ ] **StatusBar**: Brand color `#F77B1C` ✓

### Verify Config Works

```bash
# Should output no errors
npx cap doctor

# Should show full config
npx cap config
```

---

## ✅ NPM Scripts Setup

### Add to `package.json` "scripts" section

Required scripts (from `docs/CAPACITOR_SETUP.md`):
- [ ] `build`: vite build
- [ ] `cap:sync`: npm run build && npx cap sync
- [ ] `cap:ios`: npm run cap:sync && npx cap open ios
- [ ] `cap:android`: npm run cap:sync && npx cap open android
- [ ] `cap:run:ios`: npm run cap:sync && npx cap run ios
- [ ] `cap:run:android`: npm run cap:sync && npx cap run android
- [ ] `cap:clean`: rm -rf ios android && npx cap add ios && npx cap add android

### Verify Scripts Work

```bash
# Test build
npm run build
# Expected: Creates dist/ folder with index.html

# Test sync (will create/update ios/ and android/)
npm run cap:sync
# Expected: No errors, native folders populated

# Test Xcode open (Mac only)
npm run cap:ios
# Expected: Xcode opens

# Test Android Studio open
npm run cap:android
# Expected: Android Studio opens
```

---

## ✅ Native Platforms Setup

### iOS (Mac Only)

- [ ] Created: `ios/` folder via `npx cap add ios`
- [ ] Xcode project opens: `npx cap open ios`
- [ ] Bundle ID set correctly in Xcode
- [ ] Team signing configured
- [ ] Associated Domains added (for deep links)
- [ ] Pod dependencies installed: `cd ios/App && pod install`

### Android (All Platforms)

- [ ] Created: `android/` folder via `npx cap add android`
- [ ] Android Studio opens: `npx cap open android`
- [ ] Package name: `app.lovable.625e9f2209024c99a696890f601a3230`
- [ ] Build gradle configured for release
- [ ] AndroidManifest.xml includes intent-filters for deep links

---

## ✅ Assets & Branding

### App Icons

- [ ] Source icon created: `src/assets/app-icon.png` (1024×1024) ✓
- [ ] Generated all sizes: `npm run cap:icons`
- [ ] iOS icons: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- [ ] Android icons: `android/app/src/main/res/mipmap-*/`
- [ ] Icons tested on both platforms

### Splash Screens

- [ ] Source splash created: `src/assets/splash-screen.png` (1920×1080) ✓
- [ ] Generated all sizes: `npm run cap:icons`
- [ ] iOS splash: `ios/App/App/Assets.xcassets/Splash.imageset/`
- [ ] Android splash: `android/app/src/main/res/drawable-*/`
- [ ] Splash tested on simulator/emulator

### Manifest Files

- [ ] `public/manifest.json` updated ✓
- [ ] `capacitor.assets.json` configured ✓

---

## ✅ Authentication & Deep Links

### Deep Links Configuration

- [ ] `public/.well-known/apple-app-site-association` created ✓
- [ ] `public/.well-known/assetlinks.json` created ✓
- [ ] Updated with correct Team ID (Apple)
- [ ] Updated with SHA256 fingerprint (Android)
- [ ] `src/utils/deepLinkHandler.ts` integrated in App.tsx ✓

### Auth Flow Testing

```bash
# Test email verification link
# Device: xcrun simctl openurl booted "https://share-kitchen-basel.lovable.app/verify-email"

# Test password reset link  
# Device: xcrun simctl openurl booted "https://share-kitchen-basel.lovable.app/login?type=recovery"

# Test OAuth callback
# Device: Use Google login in app
```

---

## ✅ Production Build Preparation

### Before Release Build

- [ ] Edit `capacitor.config.ts`: Comment out `server` block
- [ ] Run `npm run build` → verify `dist/index.html` exists
- [ ] Run `npm run cap:sync` → verify ios/ and android/ updated
- [ ] Test on iOS simulator: `npm run cap:run:ios`
- [ ] Test on Android emulator: `npm run cap:run:android`

### Android Release Build

```bash
# 1. Run scripts
npm run cap:android

# 2. In Android Studio:
# - Build → Generate Signed Bundle / APK
# - Select Android App Bundle
# - Create or select .jks keystore
# - Output: android/app/release/app-release.aab

# 3. Upload to Google Play Console
```

- [ ] AAB generated: `android/app/release/app-release.aab`
- [ ] Keystore backed up securely
- [ ] Version code incremented
- [ ] Uploaded to Google Play Console

### iOS App Store Build

```bash
# 1. Run scripts
npm run cap:ios

# 2. In Xcode:
# - Select "Any iOS Device (arm64)" device
# - Product → Archive
# - Distribute App → App Store Connect
# - Follow upload wizard

# 3. Wait for review on App Store Connect
```

- [ ] Archived successfully in Xcode
- [ ] Certificates valid and up-to-date
- [ ] Version and build numbers updated
- [ ] Uploaded to App Store Connect

---

## ✅ Store Metadata

### App Store Requirements

#### iOS App Store Connect
- [ ] App name: "Neighbors Kitchen Basel"
- [ ] Privacy policy URL: www.neighbors-kitchen.ch/privacy
- [ ] Support URL configured
- [ ] Screenshots (6-10) added
- [ ] Preview video (optional)
- [ ] Keywords: food, sharing, neighbors, Basel
- [ ] Category: Food & Drink or Social
- [ ] Content rating completed
- [ ] Age restriction set

#### Google Play Console
- [ ] App name: "Neighbors Kitchen Basel"
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Screenshots (2-8) added
- [ ] Feature graphic (1024×500) added
- [ ] Icon (512×512) added
- [ ] Privacy policy URL
- [ ] Permissions justified
- [ ] Content rating completed
- [ ] Target audience selected

---

## ✅ Security & Compliance

- [ ] Privacy policy published and linked
- [ ] Terms of service published
- [ ] Data handling documented
- [ ] No hardcoded API keys or secrets
- [ ] `.env` configured with build secrets
- [ ] Firebase/Analytics (if used) configured
- [ ] Crash reporting configured
- [ ] GDPR/CCPA compliance reviewed

---

## ✅ Final QA

### Device Testing

- [ ] Tested on iOS physical device (not just simulator)
- [ ] Tested on Android physical device (not just emulator)
- [ ] App icons display correctly on home screen
- [ ] Splash screen shows for 2 seconds
- [ ] Deep links work (verification email, password reset)
- [ ] Authentication flows complete
- [ ] Core features work end-to-end

### Build Verification

```bash
# Run before submission
npx cap doctor

# Should show no critical issues
```

- [ ] `npm run build` succeeds
- [ ] `npm run cap:sync` completes without warnings
- [ ] `npx cap doctor` shows all green

---

## 📋 Deployment Timeline

| Step | Platform | Time | Notes |
|------|----------|------|-------|
| Build + archive | iOS | 5 min | From `npm run cap:ios` to Xcode archive |
| Initial review | iOS | 24-48h | After submission to App Store |
| Build AAB | Android | 5 min | From Android Studio Build menu |
| Initial review | Android | 1-3h | After submission to Play Store |
| Subsequent builds | Both | 10 min | Full process |

---

## 📚 Reference Documents

- [MOBILE_BUILD.md](./MOBILE_BUILD.md) — Detailed build instructions
- [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) — NPM scripts setup
- [DEEP_LINKS.md](./DEEP_LINKS.md) — Deep link configuration
- [ICON_SPLASH_CONFIG.md](./ICON_SPLASH_CONFIG.md) — Icon/splash generation

---

## 🆘 Troubleshooting

**Scripts not found?**
- Add scripts to `package.json` (see CAPACITOR_SETUP.md)
- Run `npm install`

**Native platform issues?**
- Run `npm run cap:clean` to reset
- Then `npm run cap:sync` to rebuild

**Build fails?**
- Check `npx cap doctor` output
- Verify Node.js 18+ installed
- Ensure Xcode/Android Studio updated

**Deep links not working?**
- Verify AASA/assetlinks.json served with correct content-type
- Check Team ID and SHA256 in config
- Wait 24-48h for Apple's CDN cache

---

## ✅ Sign-Off

- [ ] All checklist items completed
- [ ] Ready for App Store submission
- [ ] Ready for Google Play submission
- [ ] Team notified of launch timeline
