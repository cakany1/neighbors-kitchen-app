# Asset Pipeline Setup Guide — Task 41

Complete end-to-end guide for configuring app icons and splash screens.

---

## 📋 Current State

### Source Images (Already Generated)
- ✅ `src/assets/app-icon.png` (1024×1024) — Orange geometric design
- ✅ `src/assets/splash-screen.png` (1920×1080) — Branded splash screen

### Configuration Files (Already Created)
- ✅ `capacitor.assets.json` — Asset generation config
- ✅ `scripts/generate-assets.sh` — macOS/Linux generation script
- ✅ `scripts/generate-assets.bat` — Windows generation script

### Dependencies
- ✅ `@capacitor/assets` — Asset generation tool installed

---

## 🔧 Setup Instructions

### Step 1: Add NPM Scripts to package.json

**File:** `package.json`

Since package.json is read-only in Lovable, follow these steps:

1. **Export to GitHub:**
   - Settings → Connectors → GitHub → Connect/Authorize
   - Click "Export to GitHub"

2. **Edit Locally:**
   ```bash
   git clone <your-repo-url>
   cd share-kitchen-basel
   ```

3. **Add Scripts:**

   Open `package.json` and add these to the `"scripts"` section:

   ```json
   {
     "scripts": {
       "assets:generate": "npx capacitor-assets generate --assetspath capacitor.assets.json",
       "assets:clean": "rm -rf ios/App/App/Assets.xcassets android/app/src/main/res/drawable* android/app/src/main/res/mipmap*",
       "assets:regen": "npm run assets:clean && npm run assets:generate"
     }
   }
   ```

4. **Commit & Push:**
   ```bash
   git add package.json
   git commit -m "Add asset generation NPM scripts"
   git push
   ```

5. **Sync in Lovable:**
   - Settings → GitHub → Sync (pull latest changes)

### Step 2: Verify Source Images

**Current Setup:**

| File | Path | Size | Format |
|------|------|------|--------|
| App Icon | `src/assets/app-icon.png` | 1024×1024 | PNG |
| Splash Screen | `src/assets/splash-screen.png` | 1920×1080 | PNG |

**Alternative:** If you want to use a `resources/` folder instead:

1. Create folder structure:
   ```bash
   mkdir -p resources
   cp src/assets/app-icon.png resources/icon.png
   cp src/assets/splash-screen.png resources/splash.png
   ```

2. Update `capacitor.assets.json`:
   ```json
   {
     "ios": {
       "icon": "resources/icon.png",
       "splash": "resources/splash.png"
     },
     "android": {
       "icon": "resources/icon.png",
       "splash": "resources/splash.png"
     }
   }
   ```

### Step 3: Verify Configuration

**File:** `capacitor.assets.json` ✓

```json
{
  "ios": {
    "icon": "src/assets/app-icon.png",
    "splash": "src/assets/splash-screen.png"
  },
  "android": {
    "icon": "src/assets/app-icon.png",
    "splash": "src/assets/splash-screen.png"
  },
  "iconBackgroundColor": "#FFFFFF",
  "splashBackgroundColor": "#FFFFFF",
  "splashForegroundColor": "#F77B1C"
}
```

---

## 🚀 Running the Asset Pipeline

### Option A: Using NPM Scripts (Recommended)

After adding scripts to package.json:

```bash
# Generate all icons and splash screens
npm run assets:generate

# Clean generated assets (destructive)
npm run assets:clean

# Clean + regenerate
npm run assets:regen
```

### Option B: Using Shell Scripts Directly

**macOS/Linux:**
```bash
bash scripts/generate-assets.sh
```

**Windows (Git Bash/WSL):**
```bash
bash scripts/generate-assets.sh
```

**Windows (Command Prompt):**
```cmd
scripts\generate-assets.bat
```

### Option C: Direct Command

```bash
npx capacitor-assets generate --assetspath capacitor.assets.json
```

---

## ✅ Manual Test Steps

### Test 1: Generate Assets

```bash
# Step 1a: Generate
npm run assets:generate

# Expected output:
# ✅ Asset generation complete!
# Generated sizes:
#   iOS: Icons (20-1024px), Splash screens (all orientations)
#   Android: Icons (ldpi-xxxhdpi), Splash screens (all densities)
```

### Test 2: Verify Files Were Created

**iOS Assets:**
```bash
# Check if AppIcon.appiconset was created
ls -la ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Expected: 17+ icon files (.png images)
# Sizes: 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 83.5x83.5, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024
```

**Android Assets:**
```bash
# Check if drawable folders exist
ls -la android/app/src/main/res/ | grep drawable

# Expected:
# drawable-land-hdpi/
# drawable-land-ldpi/
# drawable-land-mdpi/
# drawable-land-xhdpi/
# drawable-land-xxhdpi/
# drawable-land-xxxhdpi/
# drawable-port-hdpi/
# drawable-port-ldpi/
# drawable-port-mdpi/
# drawable-port-xhdpi/
# drawable-port-xxhdpi/
# drawable-port-xxxhdpi/

# Check if mipmap folders exist
ls -la android/app/src/main/res/ | grep mipmap

# Expected:
# mipmap-hdpi/
# mipmap-ldpi/
# mipmap-mdpi/
# mipmap-xhdpi/
# mipmap-xxhdpi/
# mipmap-xxxhdpi/
```

### Test 3: Sync to Native Projects

```bash
# Build web assets and sync to native
npm run cap:sync

# Expected: ios/ and android/ folders updated with generated assets
```

### Test 4: Verify in Xcode (iOS)

```bash
# Open Xcode
npm run cap:ios

# In Xcode:
# 1. Select "App" project in left sidebar
# 2. Select "App" target
# 3. Go to "Build Phases" tab
# 4. Scroll to "Copy Bundle Resources"
# 5. Verify Assets.xcassets is listed
# 6. Open Assets.xcassets in main editor
# 7. Should see "AppIcon" set with all icon sizes
# 8. Should see "Splash" set with splash screens
```

**Visual Check in Xcode:**
- AppIcon set should show thumbnail of orange icon
- All icon sizes (20pt, 29pt, 40pt, etc.) should be populated
- No red warnings about missing sizes

### Test 5: Verify in Android Studio (Android)

```bash
# Open Android Studio
npm run cap:android

# In Android Studio:
# 1. Expand: app → src → main → res
# 2. Look for folders:
#    - drawable-port-* (portrait splash screens)
#    - drawable-land-* (landscape splash screens)
#    - mipmap-* (app icons)
# 3. Select any mipmap folder
# 4. Should see ic_launcher.png and ic_launcher_background.png
```

**Visual Check in Android Studio:**
- mipmap folders should show launcher icons
- drawable-port folders should show splash screens
- No missing dependencies warnings

### Test 6: Run on Simulator/Emulator

**iOS Simulator:**
```bash
npm run cap:run:ios

# Expected:
# - App launches with splash screen (displays for 2 seconds)
# - Icon shows in simulator home screen
# - No "missing image" errors
```

**Android Emulator:**
```bash
npm run cap:run:android

# Expected:
# - App launches with splash screen (displays for 2 seconds)
# - Icon shows in emulator home screen
# - No "missing image" errors
```

---

## 📂 File Structure Overview

### Generated Files (After Running `npm run assets:generate`)

```
share-kitchen-basel/
├── ios/
│   └── App/
│       └── App/
│           └── Assets.xcassets/
│               ├── AppIcon.appiconset/
│               │   ├── AppIcon-20x20@2x.png
│               │   ├── AppIcon-20x20@3x.png
│               │   ├── AppIcon-29x29@2x.png
│               │   ├── AppIcon-29x29@3x.png
│               │   ├── AppIcon-40x40@2x.png
│               │   ├── AppIcon-40x40@3x.png
│               │   ├── AppIcon-60x60@2x.png
│               │   ├── AppIcon-60x60@3x.png
│               │   ├── AppIcon-76x76@2x.png
│               │   ├── AppIcon-83.5x83.5@2x.png
│               │   ├── AppIcon-1024x1024@1x.png
│               │   └── Contents.json
│               └── Splash.imageset/
│                   ├── splash@1x.png
│                   ├── splash@2x.png
│                   ├── splash@3x.png
│                   └── Contents.json
│
└── android/
    └── app/
        └── src/
            └── main/
                └── res/
                    ├── drawable-port-ldpi/
                    │   └── splash.png (426×320)
                    ├── drawable-port-mdpi/
                    │   └── splash.png (480×320)
                    ├── drawable-port-hdpi/
                    │   └── splash.png (720×480)
                    ├── drawable-port-xhdpi/
                    │   └── splash.png (1080×720)
                    ├── drawable-port-xxhdpi/
                    │   └── splash.png (1440×960)
                    ├── drawable-port-xxxhdpi/
                    │   └── splash.png (1920×1280)
                    ├── drawable-land-ldpi/
                    │   └── splash.png (426×320)
                    ├── ... (landscape variants)
                    ├── mipmap-ldpi/
                    │   ├── ic_launcher.png (36×36)
                    │   └── ic_launcher_background.png
                    ├── mipmap-mdpi/
                    │   ├── ic_launcher.png (48×48)
                    │   └── ic_launcher_background.png
                    ├── mipmap-hdpi/
                    │   ├── ic_launcher.png (72×72)
                    │   └── ic_launcher_background.png
                    ├── mipmap-xhdpi/
                    │   ├── ic_launcher.png (96×96)
                    │   └── ic_launcher_background.png
                    ├── mipmap-xxhdpi/
                    │   ├── ic_launcher.png (144×144)
                    │   └── ic_launcher_background.png
                    └── mipmap-xxxhdpi/
                        ├── ic_launcher.png (192×192)
                        └── ic_launcher_background.png
```

---

## 📋 Complete Checklist

- [ ] **Step 1:** Added NPM scripts to package.json via GitHub
- [ ] **Step 2:** Verified source images exist:
  - [ ] `src/assets/app-icon.png` (1024×1024)
  - [ ] `src/assets/splash-screen.png` (1920×1080)
- [ ] **Step 3:** Verified `capacitor.assets.json` configuration
- [ ] **Test 1:** Ran `npm run assets:generate` successfully
- [ ] **Test 2:** Verified iOS AppIcon and Splash in `ios/App/App/Assets.xcassets/`
- [ ] **Test 3:** Verified Android drawable and mipmap folders created
- [ ] **Test 4:** Ran `npm run cap:sync` without errors
- [ ] **Test 5:** Opened Xcode and verified AppIcon set is populated
- [ ] **Test 6:** Opened Android Studio and verified mipmap icons exist
- [ ] **Test 7:** Tested on iOS simulator — splash and icon display correctly
- [ ] **Test 8:** Tested on Android emulator — splash and icon display correctly

---

## 🔄 Regenerating Assets

When you update the source images, always regenerate:

```bash
# Option 1: Full regenerate
npm run assets:regen

# Option 2: Manual steps
npm run assets:clean      # Remove old generated files
npm run assets:generate   # Generate new ones
npm run cap:sync          # Sync to native projects
```

---

## 🆘 Troubleshooting

### "Command not found: capacitor-assets"
```bash
npm install --save-dev @capacitor/assets
npm run assets:generate
```

### "No such file: src/assets/app-icon.png"
- Verify file exists: `ls -la src/assets/app-icon.png`
- If missing, regenerate: check `docs/ICON_SPLASH_CONFIG.md`

### "Generated files not appearing in Xcode"
1. In Xcode, right-click project → "Refresh"
2. Or close and reopen Xcode
3. Clean build folder: Cmd+Shift+K

### "Android icons don't appear on home screen"
1. Verify mipmap folders have ic_launcher.png files
2. Clean Android project: `./gradlew clean` (in android folder)
3. Rebuild: `npm run cap:run:android`

---

## 📚 Related Documentation

- [ICON_SPLASH_CONFIG.md](./ICON_SPLASH_CONFIG.md) — Detailed configuration reference
- [MOBILE_BUILD.md](./MOBILE_BUILD.md) — Build for stores
- [STORE_READINESS_CHECKLIST.md](./STORE_READINESS_CHECKLIST.md) — Pre-release checklist
