# Push Notifications Setup — Neighbors Kitchen Basel

Complete guide for setting up Firebase Cloud Messaging (FCM) push notifications for iOS and Android.

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile App     │────▶│  Supabase Edge   │────▶│  Firebase FCM   │
│  (Capacitor)    │     │  Functions       │     │  + APNs         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │ Register Token        │ Store Token
        ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  device_push_   │◀────│  push_notifica-  │
│  tokens         │     │  tion_logs       │
└─────────────────┘     └──────────────────┘
```

---

## Prerequisites

1. **Firebase Project** with:
   - Firebase Cloud Messaging enabled
   - iOS app configured with APNs key
   - Android app configured

2. **Apple Developer Account** with:
   - APNs Key (p8 file) uploaded to Firebase
   - Correct bundle ID configured

3. **Capacitor Plugins**:
   - @capacitor/push-notifications (installed)

---

## Step 1: Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or use existing
3. Add iOS and Android apps

### Get FCM Server Key

1. Go to Firebase Console → Project Settings
2. Cloud Messaging tab
3. Under "Cloud Messaging API (Legacy)", copy the **Server Key**
4. Or use Firebase Admin SDK with service account

### iOS: Configure APNs

1. In Apple Developer Portal, create APNs Auth Key
2. Download the `.p8` file
3. In Firebase Console → Project Settings → Cloud Messaging
4. Under "Apple app configuration", upload the APNs key

---

## Step 2: Add FCM_SERVER_KEY Secret

Add the Firebase Server Key as a secret in Lovable Cloud:

1. Go to Project Settings → Secrets
2. Add new secret: `FCM_SERVER_KEY`
3. Paste the Server Key from Firebase

---

## Step 3: Configure Capacitor

### iOS: Add GoogleService-Info.plist

After running `npx cap add ios`:

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to `ios/App/App/`
3. In Xcode, add file to project (drag into App folder)

### Android: Add google-services.json

After running `npx cap add android`:

1. Download `google-services.json` from Firebase Console
2. Add to `android/app/`

### Enable Push Capability (iOS)

In Xcode:
1. Select project target
2. Signing & Capabilities
3. Add "Push Notifications" capability
4. Add "Background Modes" → "Remote notifications"

---

## Step 4: Initialize in App

Add to your main App component:

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { initPushNotifications, cleanupPushNotifications } from '@/services/pushNotifications';
import { toast } from 'sonner';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) return;

    const setup = async () => {
      await initPushNotifications(
        // Handle foreground notifications
        (notification) => {
          toast.info(notification.title || 'Neue Benachrichtigung', {
            description: notification.body,
          });
        },
        // Handle notification tap
        (action) => {
          const data = action.notification.data;
          if (data?.route) {
            navigate(data.route);
          }
        }
      );
    };

    setup();

    return () => {
      cleanupPushNotifications();
    };
  }, [navigate]);

  // ... rest of app
}
```

---

## Step 5: Trigger Notifications

### Booking Updates

When a booking status changes:

```typescript
import { supabase } from '@/integrations/supabase/client';

// After booking confirmation
await supabase.functions.invoke('trigger-push-notification', {
  body: {
    type: 'booking_update',
    data: {
      booking_id: booking.id,
      event: 'confirmed', // or 'cancelled', 'pickup_reminder', 'rating_reminder'
      actor_id: currentUserId, // Don't notify the person who triggered
    }
  }
});
```

### New Meal Nearby

When a new meal is created:

```typescript
// After meal creation
await supabase.functions.invoke('trigger-push-notification', {
  body: {
    type: 'new_meal_nearby',
    data: {
      meal_id: meal.id,
      chef_id: meal.chef_id,
      title: meal.title,
      fuzzy_lat: meal.fuzzy_lat,
      fuzzy_lng: meal.fuzzy_lng,
      radius_km: 10, // Notify users within 10km
    }
  }
});
```

---

## Database Schema

### device_push_tokens

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who registered token |
| token | TEXT | FCM/APNs device token |
| platform | TEXT | 'ios', 'android', or 'web' |
| device_id | TEXT | Unique device identifier |
| environment | TEXT | 'development', 'staging', 'production' |
| is_active | BOOLEAN | Whether token is valid |
| last_used_at | TIMESTAMP | Last successful push |
| created_at | TIMESTAMP | Registration time |
| updated_at | TIMESTAMP | Last update |

### push_notification_logs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Target user |
| token_id | UUID | Device token used |
| notification_type | TEXT | Type of notification |
| title | TEXT | Notification title |
| body | TEXT | Notification body |
| data | JSONB | Custom data payload |
| status | TEXT | 'pending', 'sent', 'delivered', 'failed' |
| error_message | TEXT | Error if failed |
| environment | TEXT | Environment |
| created_at | TIMESTAMP | Creation time |
| sent_at | TIMESTAMP | Send time |

---

## Environment Separation

The system supports separate environments:

- **development**: Preview/local builds
- **staging**: Pre-production testing
- **production**: Live app in stores

Tokens are automatically tagged with the correct environment based on the app's hostname.

---

## Admin Health Dashboard

The Admin Health page now shows:

- **Active Devices**: Count by platform (iOS/Android/Web)
- **By Environment**: Production vs Development tokens
- **Last Token**: Most recently registered device
- **24h Stats**: Sent vs failed notifications

---

## Testing

### Send Test Push

```bash
# Using Supabase CLI
supabase functions invoke send-push-notification --body '{
  "type": "custom",
  "user_ids": ["USER_ID_HERE"],
  "title": "Test Push",
  "body": "Dies ist eine Testbenachrichtigung",
  "data": { "route": "/feed" }
}'
```

### Verify Token Registration

1. Install app on device
2. Grant push permissions
3. Check Admin Health → Push Notifications section
4. Should show new token registered

### Test Booking Flow

1. Create a meal
2. Book as another user
3. Confirm booking as chef
4. Guest should receive push notification

---

## Troubleshooting

### "FCM_SERVER_KEY not configured"
- Add the secret in Project Settings → Secrets

### Token not registering
- Check push permission in device settings
- Verify Firebase configuration files are in place
- Check console logs for registration errors

### Push not delivered
- Verify token is active in database
- Check push_notification_logs for errors
- Verify FCM/APNs is configured correctly in Firebase

### iOS: Push not working in TestFlight/App Store
- Ensure production APNs key is used (not sandbox)
- Verify Push Notifications capability is enabled in Xcode
- Check App ID has push entitlement in Apple Developer Portal

---

## Notification Types

| Type | Trigger | Recipients |
|------|---------|------------|
| `new_meal_nearby` | New meal created | Users within radius |
| `booking_update` | Booking confirmed/cancelled | Chef and guest (except actor) |
| `pickup_reminder` | Before pickup time | Guest |
| `rating_reminder` | After pickup | Guest |
| `message` | New chat message | Recipient |
| `custom` | Manual trigger | Specified user_ids |
