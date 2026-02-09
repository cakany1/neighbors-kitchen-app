# Mobile Build Guide — Neighbors Kitchen Basel

This guide covers building the app for iOS App Store and Google Play Store.

## Prerequisites

### All Platforms
- Node.js 18+ and npm
- Git clone of the repository
- Run `npm install` after cloning

### iOS (Mac Only)
- macOS with Xcode 15+
- Apple Developer account ($99/year)
- CocoaPods: `sudo gem install cocoapods`

### Android (Mac, Windows, or Linux)
- Android Studio (latest stable)
- Java JDK 17+
- Google Play Developer account ($25 one-time)

---

## NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "cap:sync": "npm run build && npx cap sync",
    "cap:ios": "npm run build && npx cap sync ios && npx cap open ios",
    "cap:android": "npm run build && npx cap sync android && npx cap open android",
    "cap:run:ios": "npm run build && npx cap sync ios && npx cap run ios",
    "cap:run:android": "npm run build && npx cap sync android && npx cap run android"
  }
}
```

---

## Initial Setup (One-Time)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd share-kitchen-basel
npm install

# 2. Add native platforms
npx cap add ios      # Mac only
npx cap add android  # Any OS

# 3. First sync
npm run cap:sync
```

---

## Production Build Preparation

**IMPORTANT:** Before building for the store, edit `capacitor.config.ts`:

```typescript
// REMOVE or comment out the server block for production:
// server: {
//   url: '...',
//   cleartext: true
// },
```

This ensures the app uses the bundled web assets instead of the dev server.

---

## Android Build (AAB for Google Play)

**Works on:** Mac, Windows, Linux

### Step-by-Step

```bash
# 1. Build and sync
npm run cap:android

# 2. Android Studio opens automatically
# 3. In Android Studio menu: Build → Generate Signed Bundle / APK
# 4. Select "Android App Bundle"
# 5. Create or use existing keystore (KEEP THIS SAFE!)
# 6. Select "release" build variant
# 7. Output: app/release/app-release.aab
```

### Keystore Creation (First Time)
- Android Studio will prompt you to create one
- Store the `.jks` file and passwords securely
- You'll need these for every future release

### Upload to Google Play
1. Go to [Google Play Console](https://play.google.com/console)
2. Create app → Upload AAB
3. Complete store listing, content rating, pricing

---

## iOS Build (Xcode Archive for App Store)

**Works on:** Mac only (requires Xcode)

### Step-by-Step

```bash
# 1. Build and sync
npm run cap:ios

# 2. Xcode opens automatically
# 3. Select your target device as "Any iOS Device (arm64)"
# 4. Menu: Product → Archive
# 5. When complete, Organizer window opens
# 6. Click "Distribute App" → "App Store Connect"
# 7. Follow prompts to upload
```

### Before Archiving
1. **Signing:** Select your team in Xcode → Signing & Capabilities
2. **Bundle ID:** Must match `appId` in capacitor.config.ts
3. **Version:** Update in Xcode → General → Identity

### App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app with matching Bundle ID
3. Upload build, complete metadata, submit for review

---

## Platform Comparison

| Task | Windows | Mac | Linux |
|------|---------|-----|-------|
| Android development | ✅ | ✅ | ✅ |
| Android AAB build | ✅ | ✅ | ✅ |
| iOS development | ❌ | ✅ | ❌ |
| iOS App Store build | ❌ | ✅ | ❌ |

---

## Common Commands Reference

```bash
# Development (hot-reload from Lovable preview)
npx cap run ios          # Run on iOS simulator/device
npx cap run android      # Run on Android emulator/device

# Production sync
npm run cap:sync         # Build web + sync to native projects

# Open IDEs
npx cap open ios         # Open in Xcode
npx cap open android     # Open in Android Studio

# Update native dependencies
npx cap update ios
npx cap update android
```

---

## Generate App Icons & Splash Screens

### One-Time Setup
Icons and splash screens are **auto-generated** from source images:

```bash
# Generate all iOS + Android sizes
npm run cap:icons

# Or manually
bash scripts/generate-assets.sh      # macOS/Linux
scripts/generate-assets.bat           # Windows
```

This creates:
- **iOS**: `ios/App/App/Assets.xcassets/` (AppIcon + Splash)
- **Android**: `android/app/src/main/res/` (drawable + mipmap folders)

### Source Images
Located in `src/assets/`:
- `app-icon.png` — 1024x1024 (main icon)
- `splash-screen.png` — 1920x1080 (splash screen)

See [ICON_SPLASH_CONFIG.md](./ICON_SPLASH_CONFIG.md) for details on updating these files.

## App Assets Checklist

Before store submission, verify:

### Generated Assets
- [ ] `npm run cap:icons` executed successfully
- [ ] iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/` has all sizes
- [ ] Android: `android/app/src/main/res/drawable-*/` has splash variants
- [ ] Android: `android/app/src/main/res/mipmap-*/` has icon variants

### Store Listings
- [ ] Screenshots (phone + tablet)
- [ ] Feature graphic (Android: 1024x500)
- [ ] Privacy policy URL
- [ ] App description (short + full)

---

## Troubleshooting

### "Command not found: cap"
```bash
npm install @capacitor/cli --save-dev
```

### iOS: "No signing certificate"
- Open Xcode preferences → Accounts → Add Apple ID
- Download certificates

### Android: "SDK not found"
- Open Android Studio → SDK Manager
- Install Android SDK 33+

### Build fails after Lovable changes
```bash
git pull
npm install
npm run cap:sync
```

---

## Version Bumping

### Android
Edit `android/app/build.gradle`:
```gradle
versionCode 2        // Increment for each upload
versionName "1.0.1"  // User-visible version
```

### iOS
In Xcode → General → Identity:
- Version: 1.0.1
- Build: 2

---

## Recommended Workflow

1. **Develop** in Lovable with hot-reload
2. **Test** on devices using `npx cap run`
3. **Prepare** for release (remove dev server URL)
4. **Build** AAB/Archive
5. **Submit** to stores
6. **Re-enable** dev server URL for continued development
