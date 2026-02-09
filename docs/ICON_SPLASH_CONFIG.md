# Icon & Splash Screen Configuration

This file drives the automated icon and splash screen generation for iOS and Android.

## Source Files
- **Icon**: `src/assets/app-icon.png` (1024x1024)
- **Splash**: `src/assets/splash-screen.png` (1920x1080)

## Configuration Options
- `iconBackgroundColor`: Fallback background for icon (white)
- `splashBackgroundColor`: Main splash background
- `splashForegroundColor`: Accent color (brand orange #F77B1C)

## How to Use

### Generate Assets (One-Time)
```bash
# macOS/Linux
bash scripts/generate-assets.sh

# Windows
scripts/generate-assets.bat

# Or directly
npm run cap:icons
```

### Update Source Images
1. Replace `src/assets/app-icon.png` (1024x1024)
2. Replace `src/assets/splash-screen.png` (1920x1080)
3. Run asset generation script
4. Commit and sync to native projects

## Generated Sizes

### iOS
```
AppIcon.appiconset/
  ├── Icon (20pt: 40x40, 58x58, 60x60)
  ├── Icon (29pt: 58x58, 87x87)
  ├── Icon (40pt: 80x80, 120x120)
  ├── Icon (60pt: 120x120, 180x180)
  ├── Icon (76pt: 76x76, 152x152)
  ├── Icon (83.5pt: 167x167)
  └── Icon (1024pt: 1024x1024)

Splash.imageset/
  ├── Splash (568x320, 1136x640, 1125x2436, etc.)
  └── Dark variant (optional)
```

### Android
```
drawable-ldpi/ (36x36)
drawable-mdpi/ (48x48)
drawable-hdpi/ (72x72)
drawable-xhdpi/ (96x96)
drawable-xxhdpi/ (144x144)
drawable-xxxhdpi/ (192x192)

drawable-port-ldpi/ (Splash)
drawable-port-mdpi/
drawable-port-hdpi/
...
drawable-land-ldpi/ (Landscape splash)
...
```

## Notes
- Icons must have sufficient contrast and padding for safe zone
- Keep brand logo/symbol in center for rounded masking
- Test on actual devices before App Store/Play Store submission
- Never edit generated files directly—regenerate from source
