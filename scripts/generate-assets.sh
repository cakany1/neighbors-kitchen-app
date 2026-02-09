#!/bin/bash

# Icon & Splash Asset Generation Script for Neighbors Kitchen Basel
# Generates all required sizes for iOS and Android from source images

echo "📱 Generating iOS and Android assets..."

# Check if capacitor-assets is installed
if ! npx capacitor-assets --version > /dev/null 2>&1; then
  echo "❌ capacitor-assets not found. Installing..."
  npm install --save-dev @capacitor/assets
fi

# Run asset generation
npx capacitor-assets generate --assetspath capacitor.assets.json

echo "✅ Asset generation complete!"
echo ""
echo "Generated sizes:"
echo "  iOS: Icons (20-1024px), Splash screens (all orientations)"
echo "  Android: Icons (ldpi-xxxhdpi), Splash screens (all densities)"
echo ""
echo "Files created:"
echo "  iOS: ios/App/App/Assets.xcassets/"
echo "  Android: android/app/src/main/res/"
echo ""
echo "💡 Tip: Update capacitor.assets.json if you want to use different source images"
echo "💡 Next: Run 'npm run cap:sync' to sync changes to native projects"
