# Store Compliance Checklist - TASK 46

## Compliance Implementation Evidence

### ✅ 1. In-App Delete Account Flow (Apple/Google Requirement)
- **Location**: Settings > Profile Page (Danger Zone section)
- **Implementation**:
  - Users navigate to `/profile` 
  - Scroll to "Account Management - Danger Zone" section
  - Click "Delete Account" button
  - Confirm with "DELETE" prompt
  - All user data automatically deleted via cascade triggers
  - User logged out and redirected to homepage
- **File**: `src/pages/Profile.tsx` (lines 1959-1996)
- **Screenshot**: Delete button visible in settings

### ✅ 2. Privacy Policy & Support Links (Required by Both Stores)
- **Location**: Profile Settings - "Compliance & Legal" section
- **Implementation**:
  - Component: `src/components/ComplianceLinks.tsx`
  - Two prominent buttons:
    - **Privacy Policy** → `/privacy` (internal route)
    - **Contact Support** → `mailto:support@share-kitchen-basel.ch` (email)
  - Also available in footer for web version
  - Fully localized (DE/EN)
- **File**: `src/components/ComplianceLinks.tsx`
- **Screenshot**: Links visible in profile settings

### ✅ 3. App Versioning (CFBundleShortVersionString / versionCode)
- **Version**: `1.1.0` (semantic versioning)
- **Configuration Files**:
  - `capacitor.config.ts`: `appVersion: '1.1.0'`
  - `src/components/AppVersionBadge.tsx`: Displays version badge
  - `package.json`: Referenced version matches

- **Version Increment Strategy**:
  1. Update `appVersion` in `capacitor.config.ts`
  2. Update corresponding iOS `CFBundleShortVersionString` after running `npx cap sync ios`
  3. Update Android `versionCode` in `android/app/build.gradle` after running `npx cap sync android`
  4. Increment for each app store release

- **Current Display**:
  - Profile Settings → Compliance & Legal → "App Version v1.1.0" badge
  - Visible to users for debugging/verification

- **File**: `capacitor.config.ts` (line 14)

## Testing Evidence

### Screenshot 1: Compliance & Legal Section
- Profile page scrolled to show compliance section
- Shows Privacy Policy and Contact Support buttons
- App version badge displayed

### Screenshot 2: Account Deletion Section
- Danger Zone section with delete button
- Clear warnings about data deletion
- Confirmation prompt required

### Screenshot 3: Delete Account Confirmation
- "DELETE" confirmation prompt ensures user intent
- All associated data removed via CASCADE triggers
- User logged out and redirected

## Store Requirements Met

| Requirement | Status | Evidence |
|---|---|---|
| In-app account deletion | ✅ | Profile > Danger Zone > Delete Account |
| Privacy Policy accessible | ✅ | Profile > Compliance & Legal > Privacy Policy |
| Support contact info | ✅ | Profile > Compliance & Legal > Contact Support |
| App versioning | ✅ | capacitor.config.ts v1.1.0 |
| Version displayed to users | ✅ | Profile > Compliance & Legal > App Version |
| EU compliance (GDPR) | ✅ | Full data deletion on account removal |
| International (DE/EN) | ✅ | All compliance text localized |

## Next Steps for Store Submission

1. **Before Building for iOS**:
   - Run `npm run build`
   - Run `npx cap sync ios`
   - Check `ios/App/App/Info.plist` for CFBundleShortVersionString
   - Increment version in Xcode if needed

2. **Before Building for Android**:
   - Run `npm run build`
   - Run `npx cap sync android`
   - Check `android/app/build.gradle` for versionCode
   - Increment versionCode in Android Studio if needed

3. **Store Submissions**:
   - Apple App Store: Review Privacy Policy link availability
   - Google Play: Verify account deletion flow in compliance section
   - Both: Confirm app version is correctly incremented

## Files Modified

- `src/pages/Profile.tsx` - Added compliance section and imported components
- `src/components/ComplianceLinks.tsx` - New component for privacy/support links
- `src/components/AppVersionBadge.tsx` - New component for version display
- `capacitor.config.ts` - Updated with appVersion
- `src/i18n/locales/en.json` - Added compliance translation keys
- `src/i18n/locales/de.json` - Added compliance translation keys
