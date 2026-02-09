#!/bin/bash

# Setup NPM scripts for Capacitor mobile builds
# This script adds the required npm scripts to package.json

set -e

echo "📱 Setting up Capacitor npm scripts..."
echo ""

# Define the scripts to add
SCRIPTS='
    "build": "vite build",
    "cap:sync": "npm run build && npx cap sync",
    "cap:ios": "npm run cap:sync && npx cap open ios",
    "cap:android": "npm run cap:sync && npx cap open android",
    "cap:run:ios": "npm run cap:sync && npx cap run ios",
    "cap:run:android": "npm run cap:sync && npx cap run android",
    "cap:clean": "rm -rf ios android && npx cap add ios && npx cap add android"'

echo "The following scripts need to be added to package.json:"
echo ""
echo "$SCRIPTS"
echo ""
echo "MANUAL STEPS:"
echo "1. Open package.json"
echo "2. Find the \"scripts\" section"
echo "3. Replace or merge the scripts listed above"
echo "4. Save the file"
echo ""
echo "After adding scripts, verify with:"
echo "  npm run cap:sync"
echo ""
