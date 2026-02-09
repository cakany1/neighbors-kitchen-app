@echo off
REM Icon & Splash Asset Generation Script for Neighbors Kitchen Basel (Windows)
REM Generates all required sizes for iOS and Android from source images

echo.
echo 📱 Generating iOS and Android assets...
echo.

REM Run asset generation
npx capacitor-assets generate --assetspath capacitor.assets.json

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Asset generation complete!
  echo.
  echo Generated sizes:
  echo   iOS: Icons (20-1024px), Splash screens (all orientations)
  echo   Android: Icons (ldpi-xxxhdpi), Splash screens (all densities)
  echo.
  echo Files created:
  echo   iOS: ios/App/App/Assets.xcassets/
  echo   Android: android/app/src/main/res/
  echo.
  echo 💡 Tip: Update capacitor.assets.json if you want to use different source images
  echo 💡 Next: Run 'npm run cap:sync' to sync changes to native projects
) else (
  echo ❌ Asset generation failed
  exit /b 1
)
