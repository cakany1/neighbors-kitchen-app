# Capacitor NPM Scripts Setup

Since `package.json` cannot be modified directly, you must manually add these scripts to your project.

## Scripts to Add

Add these entries to the `"scripts"` section in `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "cap:sync": "npm run build && npx cap sync",
    "cap:ios": "npm run cap:sync && npx cap open ios",
    "cap:android": "npm run cap:sync && npx cap open android",
    "cap:run:ios": "npm run cap:sync && npx cap run ios",
    "cap:run:android": "npm run cap:sync && npx cap run android",
    "cap:clean": "rm -rf ios android && npx cap add ios && npx cap add android"
  }
}
```

## Script Descriptions

| Script | Purpose | Platforms |
|--------|---------|-----------|
| `npm run build` | Build web assets to `dist/` | All |
| `npm run cap:sync` | Build + sync to native projects | All |
| `npm run cap:ios` | Sync + open Xcode IDE | Mac only |
| `npm run cap:android` | Sync + open Android Studio | All |
| `npm run cap:run:ios` | Build + run on iOS simulator/device | Mac only |
| `npm run cap:run:android` | Build + run on Android emulator/device | All |
| `npm run cap:clean` | Remove native folders + re-add | All |

## Installation Steps

1. **Edit `package.json`:**
   ```bash
   # Open your package.json file in your code editor
   nano package.json
   # or
   code package.json
   ```

2. **Find the `"scripts"` section** (usually near the top)

3. **Add or merge the scripts above**

4. **Save and verify:**
   ```bash
   npm run cap:sync
   ```

## Verification

After adding scripts, test that they work:

```bash
# Should complete without errors
npm run cap:sync

# Should open Xcode (Mac only)
npm run cap:ios

# Should open Android Studio
npm run cap:android
```

## Troubleshooting

### "npm: command not found"
- Install Node.js from [nodejs.org](https://nodejs.org)
- Restart your terminal

### "cap:sync not found"
- Verify scripts were added to `package.json`
- Run `npm install` to ensure dependencies are installed

### "Cannot find module '@capacitor/cli'"
- Run `npm install --save-dev @capacitor/cli`

## For Windows Users

The scripts use Unix-style commands. For Windows compatibility:
- Use Git Bash instead of Command Prompt
- Or use WSL (Windows Subsystem for Linux)
- Or replace commands with Windows equivalents (use backslash paths)
