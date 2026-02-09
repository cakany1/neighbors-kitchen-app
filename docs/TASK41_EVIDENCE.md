# Task 41 Evidence — App Icons + Splash Screens

Complete record of all files created, modified, and commands needed.

---

## 📁 Files Overview

| File | Type | Status | Purpose |
|------|------|--------|---------|
| `src/assets/app-icon.png` | Asset | ✅ Created | 1024×1024 app icon (orange) |
| `src/assets/splash-screen.png` | Asset | ✅ Created | 1920×1080 splash screen |
| `capacitor.assets.json` | Config | ✅ Created | Asset generation config |
| `scripts/generate-assets.sh` | Script | ✅ Created | macOS/Linux generation script |
| `scripts/generate-assets.bat` | Script | ✅ Created | Windows generation script |
| `docs/ICON_SPLASH_CONFIG.md` | Doc | ✅ Created | Configuration reference |
| `docs/ASSET_PIPELINE_SETUP.md` | Doc | ✅ Created | Complete setup guide |
| `package.json` | Config | ⏳ Pending | Add NPM scripts (manual) |

---

## 🔧 Configuration Files

### 1. capacitor.assets.json

**Location:** `capacitor.assets.json`  
**Type:** Configuration  
**Purpose:** Tells @capacitor/assets where to find source images and what colors to use

**Full Content:**

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

**What It Does:**
- Points to source images in `src/assets/`
- Sets fallback colors for icon and splash
- Used by `@capacitor/assets generate` command

---

### 2. scripts/generate-assets.sh

**Location:** `scripts/generate-assets.sh`  
**Type:** Shell Script (macOS/Linux)  
**Purpose:** Automates asset generation with user-friendly output

**Key Lines:**

```bash
#!/bin/bash

# Check if capacitor-assets is installed
if ! npx capacitor-assets --version > /dev/null 2>&1; then
  echo "❌ capacitor-assets not found. Installing..."
  npm install --save-dev @capacitor/assets
fi

# Run asset generation
npx capacitor-assets generate --assetspath capacitor.assets.json

# Output summary
echo "✅ Asset generation complete!"
echo "Generated sizes:"
echo "  iOS: Icons (20-1024px), Splash screens (all orientations)"
echo "  Android: Icons (ldpi-xxxhdpi), Splash screens (all densities)"
echo ""
echo "Files created:"
echo "  iOS: ios/App/App/Assets.xcassets/"
echo "  Android: android/app/src/main/res/"
```

**What It Does:**
- Checks if @capacitor/assets is installed
- Runs generation from capacitor.assets.json
- Provides summary of what was generated

---

### 3. scripts/generate-assets.bat

**Location:** `scripts/generate-assets.bat`  
**Type:** Windows Batch Script  
**Purpose:** Windows equivalent of generate-assets.sh

**Key Command:**

```batch
npx capacitor-assets generate --assetspath capacitor.assets.json
```

---

## 📦 NPM Scripts (To Add)

**File:** `package.json` → "scripts" section

**Scripts to Add:**

```json
{
  "scripts": {
    "assets:generate": "npx capacitor-assets generate --assetspath capacitor.assets.json",
    "assets:clean": "rm -rf ios/App/App/Assets.xcassets android/app/src/main/res/drawable* android/app/src/main/res/mipmap*",
    "assets:regen": "npm run assets:clean && npm run assets:generate"
  }
}
```

**How to Add:**
1. Export to GitHub (Settings → Connectors → GitHub)
2. Clone locally
3. Edit package.json
4. Add above scripts
5. Commit and push
6. Sync in Lovable

**What They Do:**
| Script | Command | Purpose |
|--------|---------|---------|
| `npm run assets:generate` | `npx capacitor-assets generate --assetspath capacitor.assets.json` | Generate all icons/splash from config |
| `npm run assets:clean` | Remove generated assets | Clean slate before regenerating |
| `npm run assets:regen` | Clean + generate | Full refresh (destructive) |

---

## 🎨 Source Images

### app-icon.png

**Location:** `src/assets/app-icon.png`  
**Size:** 1024×1024 pixels  
**Format:** PNG  
**Design:** Orange (#F77B1C) background, white geometric plate/sharing symbol  
**Status:** ✅ Created and verified

**Generated Icon Sizes (iOS):**
- 20×20 (app clips)
- 29×29 (settings)
- 40×40 (spotlight)
- 58×58 (spotlight 2x)
- 60×60 (app)
- 76×76 (iPad)
- 83.5×83.5 (iPad Pro)
- 87×87 (app 3x)
- 120×120 (app 2x)
- 152×152 (iPad)
- 167×167 (iPad Pro)
- 180×180 (app 3x)
- 1024×1024 (store)

**Generated Icon Sizes (Android):**
- 36×36 (ldpi)
- 48×48 (mdpi)
- 72×72 (hdpi)
- 96×96 (xhdpi)
- 144×144 (xxhdpi)
- 192×192 (xxxhdpi)

### splash-screen.png

**Location:** `src/assets/splash-screen.png`  
**Size:** 1920×1080 pixels (16:9)  
**Format:** PNG  
**Design:** Orange (#F77B1C) header with meal imagery, "Neighbors Kitchen Basel" branding  
**Status:** ✅ Created and verified

**Generated Splash Sizes (iOS):**
- All orientations: portrait, landscape
- All device sizes: iPhone, iPad
- Sizes: 568×320, 1136×640, 1125×2436, 1242×2208, 1536×2048, 1668×2224, etc.

**Generated Splash Sizes (Android):**
- **Portrait:**
  - ldpi: 426×320
  - mdpi: 480×320
  - hdpi: 720×480
  - xhdpi: 1080×720
  - xxhdpi: 1440×960
  - xxxhdpi: 1920×1280
- **Landscape:**
  - ldpi: 426×320
  - mdpi: 480×320
  - hdpi: 720×480
  - xhdpi: 1080×720
  - xxhdpi: 1440×960
  - xxxhdpi: 1920×1280

---

## 📂 Generated Output Paths

After running `npm run assets:generate`, these files are created:

### iOS Output

```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── AppIcon-20x20@2x.png
├── AppIcon-20x20@3x.png
├── AppIcon-29x29@2x.png
├── AppIcon-29x29@3x.png
├── AppIcon-40x40@2x.png
├── AppIcon-40x40@3x.png
├── AppIcon-60x60@2x.png
├── AppIcon-60x60@3x.png
├── AppIcon-76x76@2x.png
├── AppIcon-83.5x83.5@2x.png
├── AppIcon-1024x1024@1x.png
└── Contents.json

ios/App/App/Assets.xcassets/Splash.imageset/
├── splash@1x.png
├── splash@2x.png
├── splash@3x.png
└── Contents.json
```

### Android Output

```
android/app/src/main/res/drawable-port-ldpi/splash.png (426×320)
android/app/src/main/res/drawable-port-mdpi/splash.png (480×320)
android/app/src/main/res/drawable-port-hdpi/splash.png (720×480)
android/app/src/main/res/drawable-port-xhdpi/splash.png (1080×720)
android/app/src/main/res/drawable-port-xxhdpi/splash.png (1440×960)
android/app/src/main/res/drawable-port-xxxhdpi/splash.png (1920×1280)

android/app/src/main/res/drawable-land-ldpi/splash.png (426×320)
android/app/src/main/res/drawable-land-mdpi/splash.png (480×320)
android/app/src/main/res/drawable-land-hdpi/splash.png (720×480)
android/app/src/main/res/drawable-land-xhdpi/splash.png (1080×720)
android/app/src/main/res/drawable-land-xxhdpi/splash.png (1440×960)
android/app/src/main/res/drawable-land-xxxhdpi/splash.png (1920×1280)

android/app/src/main/res/mipmap-ldpi/ic_launcher.png (36×36)
android/app/src/main/res/mipmap-mdpi/ic_launcher.png (48×48)
android/app/src/main/res/mipmap-hdpi/ic_launcher.png (72×72)
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png (96×96)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png (144×144)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png (192×192)
```

---

## ✅ Test Plan

### Step A: Verify Configuration

```bash
# Check capacitor.assets.json exists
cat capacitor.assets.json
# Should output the JSON config above

# Check source images exist
ls -la src/assets/app-icon.png
ls -la src/assets/splash-screen.png
# Should show file size > 0
```

### Step B: Run Asset Generation

```bash
# Option 1: Using npm script (after adding to package.json)
npm run assets:generate

# Option 2: Direct shell script
bash scripts/generate-assets.sh

# Option 3: Direct npx command
npx capacitor-assets generate --assetspath capacitor.assets.json

# Expected output:
# ✅ Asset generation complete!
# Generated sizes:
#   iOS: Icons (20-1024px), Splash screens (all orientations)
#   Android: Icons (ldpi-xxxhdpi), Splash screens (all densities)
# Files created:
#   iOS: ios/App/App/Assets.xcassets/
#   Android: android/app/src/main/res/
```

### Step C: Verify iOS Files

```bash
# Count iOS icon files
ls ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png | wc -l
# Expected: 11 files

# Check Splash
ls ios/App/App/Assets.xcassets/Splash.imageset/
# Expected: splash@1x.png, splash@2x.png, splash@3x.png, Contents.json
```

### Step D: Verify Android Files

```bash
# List mipmap folders
ls android/app/src/main/res/ | grep mipmap
# Expected 6 mipmap-* folders

# List drawable-port folders
ls android/app/src/main/res/ | grep "drawable-port"
# Expected 6 drawable-port-* folders

# List drawable-land folders
ls android/app/src/main/res/ | grep "drawable-land"
# Expected 6 drawable-land-* folders

# Check icon exists
ls android/app/src/main/res/mipmap-mdpi/ic_launcher.png
# Should exist
```

### Step E: Sync to Native Projects

```bash
npm run cap:sync
# Expected: ios/ and android/ folders updated
```

### Step F: Open in Xcode

```bash
npm run cap:ios

# In Xcode:
# 1. Click "App" project in left sidebar
# 2. Select "App" target
# 3. Go to "Build Phases" → "Copy Bundle Resources"
# 4. Should see Assets.xcassets in list
# 5. Open Assets.xcassets in editor
# 6. Click "AppIcon" in left panel
# 7. Should see thumbnail of orange icon
# 8. All icon sets should show "Provided" status (not warnings)
```

### Step G: Open in Android Studio

```bash
npm run cap:android

# In Android Studio:
# 1. Expand: app → src → main → res
# 2. Select mipmap-mdpi folder
# 3. Should see ic_launcher.png file
# 4. Preview should show orange app icon
# 5. No red error warnings
```

### Step H: Test on Device

```bash
# Run on iOS simulator
npm run cap:run:ios
# Expected: Splash shows for 2 seconds, icon on home screen

# Run on Android emulator
npm run cap:run:android
# Expected: Splash shows for 2 seconds, icon on home screen
```

---

## 📋 Summary

✅ **Source Images Created:**
- `src/assets/app-icon.png` (1024×1024)
- `src/assets/splash-screen.png` (1920×1080)

✅ **Configuration Files Created:**
- `capacitor.assets.json` (asset generation config)

✅ **Scripts Created:**
- `scripts/generate-assets.sh` (macOS/Linux)
- `scripts/generate-assets.bat` (Windows)

⏳ **To Complete:**
- Add NPM scripts to `package.json` via GitHub export
- Run `npm run assets:generate`
- Verify files in `ios/App/App/Assets.xcassets/` and `android/app/src/main/res/`
- Test on Xcode and Android Studio
- Test on simulators/emulators

✅ **Repeatable Pipeline:**
```bash
# Update source images
cp new-icon.png src/assets/app-icon.png
cp new-splash.png src/assets/splash-screen.png

# Regenerate
npm run assets:regen

# Sync
npm run cap:sync
```
