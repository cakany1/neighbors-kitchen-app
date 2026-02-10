# Neighbors Kitchen – Supabase Schema Reference

> Auto-maintained reference. Source of truth: migrations + `src/integrations/supabase/types.ts`.

---

## Tables

### `profiles`
User profile data linked to `auth.users`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | No | – | PK, matches `auth.users.id` |
| first_name | text | No | – | |
| last_name | text | No | – | |
| nickname | text | Yes | – | |
| gender | text | Yes | – | `woman`, `man`, `diverse`, `none` |
| age | int | Yes | – | |
| phone_number | text | Yes | – | |
| phone_verified | bool | Yes | false | |
| avatar_url | text | Yes | – | |
| verification_status | enum | No | `pending` | `pending`/`approved`/`rejected` |
| partner_verification_status | enum | No | `pending` | |
| id_verified | bool | Yes | false | |
| photo_verified | bool | Yes | false | |
| partner_photo_verified | bool | Yes | false | |
| is_couple | bool | Yes | false | |
| partner_name | text | Yes | – | |
| partner_photo_url | text | Yes | – | |
| partner_gender | text | Yes | – | |
| partner_id_document_url | text | Yes | – | |
| id_document_url | text | Yes | – | |
| private_address | text | Yes | – | |
| private_city | text | Yes | – | |
| private_postal_code | text | Yes | – | |
| latitude | float8 | Yes | – | |
| longitude | float8 | Yes | – | |
| address_id | text | Yes | – | Hashed address for same-address matching |
| karma | int | No | 100 | |
| successful_pickups | int | No | 0 | |
| no_shows | int | No | 0 | |
| is_disabled | bool | No | false | Admin deactivation flag |
| vacation_mode | bool | Yes | false | |
| notification_radius | int | Yes | 1000 | Meters |
| notify_same_address_only | bool | Yes | false | |
| display_real_name | bool | Yes | true | |
| role | text | Yes | `both` | `cook`/`guest`/`both` |
| visibility_mode | text | Yes | `all` | `all`/`women_only`/`women_fli` |
| languages | text[] | Yes | `{de}` | |
| allergens | text[] | Yes | `{}` | |
| dislikes | text[] | Yes | `{}` | |
| iban | text | Yes | – | For payouts |
| referred_by | uuid | Yes | – | FK → profiles |
| referral_rewarded | bool | Yes | false | |
| rejection_reason | text | Yes | – | |
| rejection_details | text | Yes | – | |
| rejected_at | timestamptz | Yes | – | |
| rejected_by | uuid | Yes | – | |
| last_payout_at | timestamptz | Yes | – | |
| created_at | timestamptz | No | `now()` | |
| updated_at | timestamptz | No | `now()` | |

**RLS:**
| Policy | Command | Rule |
|--------|---------|------|
| Users can view own full profile | SELECT | `auth.uid() = id` |
| Authenticated users can view non-disabled | SELECT | `is_disabled = false` |
| Admins can view all profiles | SELECT | `has_role(uid, 'admin')` |
| Users can insert own profile | INSERT | `auth.uid() = id` |
| Users can update own profile | UPDATE | `auth.uid() = id` |
| Admins can update any profile | UPDATE | `has_role(uid, 'admin')` |
| DELETE | – | Not allowed |

---

### `meals`
Meal/offering listings created by cooks.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | No | `gen_random_uuid()` | PK |
| chef_id | uuid | No | – | FK → profiles |
| title | text | No | – | |
| title_en | text | Yes | – | |
| description | text | No | – | |
| description_en | text | Yes | – | |
| image_url | text | Yes | – | |
| neighborhood | text | No | – | |
| exact_address | text | No | – | Revealed after confirmed booking |
| fuzzy_lat | numeric | No | – | Approximate location |
| fuzzy_lng | numeric | No | – | |
| address_id | text | Yes | – | |
| tags | text[] | Yes | – | |
| allergens | text[] | Yes | – | |
| ingredients | text[] | Yes | `{}` | |
| pricing_minimum | numeric | No | 0 | |
| pricing_suggested | numeric | Yes | – | |
| restaurant_reference_price | numeric | Yes | – | |
| estimated_restaurant_value | numeric | Yes | – | |
| exchange_mode | text | Yes | `money` | `money`/`barter` |
| barter_requests | text[] | Yes | `{}` | |
| handover_mode | text | Yes | `pickup_box` | `pickup`/`pickup_box`/`neighbor`/`dine_in`/etc |
| container_policy | text | Yes | `either_ok` | |
| unit_type | text | Yes | `portions` | |
| available_portions | int | No | 1 | |
| max_seats | int | Yes | – | For cooking experiences |
| booked_seats | int | Yes | 0 | |
| is_cooking_experience | bool | No | false | |
| scheduled_date | timestamptz | No | – | |
| collection_window_start | time | Yes | – | |
| collection_window_end | time | Yes | – | |
| arrival_time | time | Yes | – | |
| visibility_mode | text | Yes | `all` | |
| visibility_radius | int | Yes | – | |
| women_only | bool | Yes | false | |
| is_stock_photo | bool | Yes | false | |
| is_ai_generated | bool | Yes | false | |
| ai_image_confirmed | bool | Yes | false | |
| is_demo | bool | No | false | |
| created_at | timestamptz | No | `now()` | |
| updated_at | timestamptz | No | `now()` | |

**RLS:**
| Policy | Command | Rule |
|--------|---------|------|
| Anyone can view public meals | SELECT | `visibility_mode = 'all'` |
| Users can view their own meals | SELECT | `auth.uid() = chef_id` |
| Users can view meal addresses if authorized | SELECT | `user_can_view_meal_address()` |
| Users can create their own meals | INSERT | `auth.uid() = chef_id` |
| Users can update their own meals | UPDATE | `auth.uid() = chef_id` |
| Users can delete their own meals | DELETE | `auth.uid() = chef_id` |

---

### `bookings`
Reservation records linking guests to meals.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | No | `gen_random_uuid()` | PK |
| meal_id | uuid | No | – | FK → meals |
| guest_id | uuid | No | – | FK → auth.users |
| status | text | No | `pending` | `pending`/`confirmed`/`completed`/`cancelled_by_guest`/`cancelled_by_host`/`no_show_guest`/`no_show_host` |
| payment_amount | numeric | Yes | – | |
| payout_status | text | Yes | `pending` | |
| guest_composition | text | Yes | – | |
| cancellation_reason | text | Yes | – | |
| cancelled_at | timestamptz | Yes | – | |
| no_show_marked_at | timestamptz | Yes | – | |
| no_show_marked_by | uuid | Yes | – | FK → profiles |
| chef_rated | bool | Yes | false | |
| guest_rated | bool | Yes | false | |
| created_at | timestamptz | No | `now()` | |
| updated_at | timestamptz | No | `now()` | |

**RLS:**
| Policy | Command | Rule |
|--------|---------|------|
| Users can view their own bookings | SELECT | Guest or meal chef |
| Users can create bookings | INSERT | `auth.uid() = guest_id` |
| Users can update their bookings | UPDATE | Guest or meal chef |
| DELETE | – | Not allowed |

---

### `messages`
In-app chat messages scoped to bookings.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | `gen_random_uuid()` |
| booking_id | uuid | No | FK → bookings |
| sender_id | uuid | No | – |
| message_text | text | No | – |
| original_language | text | No | – |
| is_read | bool | No | false |
| created_at | timestamptz | No | `now()` |

**RLS:** SELECT/INSERT/UPDATE/DELETE all scoped to booking participants (guest + chef).

---

### `ratings`
Post-pickup ratings between guests and chefs.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | `gen_random_uuid()` |
| booking_id | uuid | No | FK → bookings |
| rater_id | uuid | No | – |
| rated_user_id | uuid | No | – |
| stars | int | No | – |
| tags | text[] | Yes | `{}` |
| comment | text | Yes | – |
| created_at | timestamptz | No | `now()` |

**RLS:** INSERT requires rater to be booking participant. Mutual visibility after both rated, or after 14 days.

---

### `user_roles`
RBAC role assignments (separated from profiles for security).

| Column | Type | Default |
|--------|------|---------|
| id | uuid | `gen_random_uuid()` |
| user_id | uuid | FK → auth.users |
| role | enum `app_role` | – |
| created_at | timestamptz | `now()` |

**Enum `app_role`:** `admin`, `moderator`, `user`

**RLS:** Full CRUD restricted to admins. Users can SELECT own roles.

---

### `blocked_users`
User-to-user blocking.

| Column | Type |
|--------|------|
| id | uuid |
| blocker_id | uuid |
| blocked_id | uuid |
| created_at | timestamptz |

**RLS:** SELECT/INSERT/DELETE scoped to `blocker_id = auth.uid()`. No UPDATE.

---

### `reports`
User/meal abuse reports.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| reporter_id | uuid | |
| reported_user_id | uuid | Nullable |
| reported_meal_id | uuid | FK → meals, nullable |
| reason | text | |
| description | text | Nullable |
| status | text | Default `pending` |
| reviewed_at | timestamptz | |
| reviewed_by | uuid | |

**RLS:** Users INSERT own reports + SELECT own. Admins SELECT/UPDATE all.

---

### `admin_actions`
Audit log for admin operations.

| Column | Type |
|--------|------|
| id, actor_id, target_id | uuid |
| action | text |
| metadata | jsonb |
| created_at | timestamptz |

**RLS:** Admin-only INSERT (actor must be self) + SELECT.

---

### `admin_reads`
GDPR audit log for admin data access.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| admin_id | uuid | |
| target_user_id | uuid | |
| action | text | Default `view` |
| fields_accessed | text[] | |
| context | text | |
| ip_address | text | |
| user_agent | text | |
| notes | text | |
| created_at | timestamptz | |

**RLS:** Admin SELECT only. Inserts via `SECURITY DEFINER` functions.

---

### `admin_settings`
Key-value admin configuration.

**RLS:** Admin-only SELECT/INSERT/UPDATE.

---

### `analytics_events`
Client-side analytics tracking.

**RLS:** Authenticated INSERT. Admin SELECT.

---

### `contact_requests`
Public contact form submissions.

**RLS:** Public INSERT (`true`). Admin-only SELECT.

---

### `faq_requests`
User-submitted FAQ questions with admin answers.

**RLS:** Authenticated INSERT (user_id match). Admin SELECT/UPDATE. Users SELECT own.

---

### `app_feedback`
In-app feedback submissions.

**RLS:** Users INSERT/SELECT own. Admin SELECT/UPDATE all.

---

### `household_links`
Household account linking (shared benefits).

**RLS:** Requester/invitee scoped for all CRUD.

---

### `device_push_tokens`
FCM push notification tokens.

**RLS:** Users manage own tokens. Admin SELECT all.

---

### `push_notification_logs`
Push delivery audit trail.

**RLS:** Admin SELECT only. Service-role INSERT.

---

### `push_subscriptions`
Web push subscriptions (VAPID).

**RLS:** Users manage own subscriptions.

---

### `stripe_webhook_events`
Stripe webhook processing log (idempotency).

**RLS:** Admin SELECT only. Service-role INSERT.

---

### `api_rate_limits`
Endpoint rate limiting records.

**RLS:** `false` (service-role only).

---

### `profile_reminders`
Profile completion reminder tracking.

**RLS:** `false` (service-role only).

---

### `release_checks`
Admin release checklist items.

**RLS:** Admin-only full CRUD.

---

### `qa_runs`
Self-test / QA run results.

**RLS:** Admin-only full CRUD.

---

### `language_requests`
User requests for new UI languages.

**RLS:** Users INSERT own. Admin SELECT.

---

## Views

| View | Purpose |
|------|---------|
| `profiles_public` | Safe public projection of profiles (no address/IBAN/phone) |
| `meals_public` | Public meal data (no `exact_address`, no `is_demo` filter) |
| `profile_ratings` | Combined chef + guest rating aggregates per user |
| `chef_rating_summary` | Chef-role rating breakdown (stars 1-5) |
| `guest_rating_summary` | Guest-role rating breakdown |
| `user_rating_summary` | Overall rating summary with positive/negative counts |
| `admin_reads_summary` | Admin read log joined with profile names |

---

## Database Functions (Key)

| Function | Purpose | Security |
|----------|---------|----------|
| `book_meal(meal_id, guest_id)` | Atomic booking with inventory lock, time/gender validation | DEFINER, `auth.uid()` check |
| `cancel_booking(booking_id, guest_id)` | Guest cancel within 15 min | DEFINER, `auth.uid()` check |
| `cancel_booking_with_reason(...)` | Guest cancel within 60 min of pickup | DEFINER |
| `host_cancel_booking(booking_id, reason)` | Chef cancels, restores inventory | DEFINER |
| `mark_no_show(booking_id, is_guest)` | No-show after 30 min grace | DEFINER |
| `submit_rating(...)` | Rating insert with status validation | DEFINER |
| `withdraw_meal(meal_id)` | Delete within 5 min, no penalty | DEFINER |
| `delete_meal_with_karma(...)` | Delete with -10 karma after 5 min | DEFINER |
| `admin_delete_user(target_user_id)` | Cascade delete via `auth.users` | DEFINER, admin check |
| `admin_view_user_sensitive_data(...)` | GDPR-logged sensitive data access | DEFINER, admin check |
| `admin_log_user_export(...)` | Log data exports | DEFINER, admin check |
| `has_role(user_id, role)` | RBAC check without RLS recursion | DEFINER |
| `is_couple_fully_verified(user_id)` | Both partners approved? | DEFINER |
| `user_can_view_meal_address(meal, user)` | Chef or confirmed guest | DEFINER |
| `can_view_meal(visibility, gender)` | Gender-based meal filtering | IMMUTABLE |
| `generate_address_id(street, city, zip)` | Deterministic hash for same-address matching | IMMUTABLE |
| `check_meal_content()` | Profanity filter trigger on meals | DEFINER |
| `check_message_content()` | Profanity filter trigger on messages | DEFINER |
| `check_profile_content()` | Profanity filter trigger on profiles | DEFINER |
| `check_user_disabled()` | Block disabled users from actions | DEFINER |
| `prevent_self_booking()` | Block booking own meals | DEFINER |
| `validate_visibility_mode()` | Gender-based visibility rules | DEFINER |
| `validate_meal_pickup_time()` | Block past pickup times | DEFINER |
| `check_photo_verification_for_women_only_meal()` | Require verified photos for women-only | DEFINER |
| `check_couple_verification_for_meal()` | Both partners verified for couples | DEFINER |
| `check_couple_verification_for_booking()` | Couple verification on confirm | DEFINER |
| `increment_karma_on_booking_complete()` | +20 chef, +5 guest karma | DEFINER |
| `update_reliability_on_status_change()` | Track pickups/no-shows | DEFINER |
| `auto_accumulate_payout()` | Set payout status on completion | DEFINER |
| `update_booking_rating_flags()` | Set `chef_rated`/`guest_rated` | DEFINER |
| `auto_approve_partner_on_photo_verified()` | Auto-approve partner status | |
| `delete_id_document_after_approval()` | Cleanup ID docs from storage | DEFINER |
| `cleanup_rate_limits(hours)` | Purge old rate limit entries | DEFINER |

---

## Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `admin-list-users` | List all users with auth data + block stats | Admin JWT |
| `create-payment-intent` | Stripe checkout session | User JWT |
| `verify-payment` | Confirm payment status post-redirect | User JWT |
| `stripe-webhook` | Process Stripe webhook events | Stripe signature |
| `send-push-notification` | Send FCM v1 notifications | Service key |
| `trigger-push-notification` | Orchestrate booking/meal push events | Service key |
| `send-welcome-email` | Welcome email via Resend | Service key |
| `send-password-reset` | Password reset email | Service key |
| `send-admin-message` | Admin → user messaging | Admin JWT |
| `send-admin-notification` | Admin alert emails | Admin JWT |
| `send-registration-notification` | New user alert to admins | Service key |
| `send-verification-rejection` | Rejection notice email | Admin JWT |
| `send-profile-reminders` | Incomplete profile reminder emails | Service key |
| `submit-contact` | Process contact form + Turnstile | Public |
| `fetch-recipe-ingredients` | AI ingredient extraction | User JWT |
| `generate-meal-image` | AI meal image generation | User JWT |
| `translate-message` | Chat message translation | User JWT |
| `geocode-address` | Address → coordinates | User JWT |
| `get-turnstile-key` | Return Turnstile site key | Public |
| `run-self-test` | Admin health/readiness checks | Admin JWT |

---

## Enums

| Enum | Values |
|------|--------|
| `app_role` | `admin`, `moderator`, `user` |
| `verification_status` | `pending`, `approved`, `rejected` |
| `visibility_mode` | `women_only`, `women_fli`, `all` |
| `container_policy_type` | `bring_container`, `plate_ok`, `either_ok` |

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | Profile photos |
| `gallery` | Yes | Meal images |
| `id-documents` | No | Verification documents (auto-deleted after approval) |
