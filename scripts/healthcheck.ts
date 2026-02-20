/**
 * Neighbors Kitchen – Automated Self-Test Healthcheck Script
 *
 * Non-production utility. Tests core guard logic in isolation:
 *   1. Self-chat guard
 *   2. Past timeslot guard (with 15-minute grace period)
 *   3. Radius / Haversine distance logic
 *   4. Stripe test-mode isolation guard
 *
 * Run with:  bun run scripts/healthcheck.ts
 */

// ---------------------------------------------------------------------------
// Minimal assertion helper
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean): void {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. Self-chat guard
//    Logic mirrored from src/components/ChatModal.tsx (line 46)
// ---------------------------------------------------------------------------

function isSelfChat(currentUserId: string | undefined, chefId: string): boolean {
  return currentUserId === chefId;
}

console.log("\n🔒 Self-chat guard");
assert("same IDs → blocked",  isSelfChat("user-abc", "user-abc") === true);
assert("different IDs → allowed", isSelfChat("user-abc", "user-xyz") === false);
assert("undefined userId → allowed", isSelfChat(undefined, "user-xyz") === false);

// ---------------------------------------------------------------------------
// 2. Past timeslot guard  (with 15-min grace period)
//    Logic mirrored from src/pages/AddMeal.tsx (lines 286-314)
// ---------------------------------------------------------------------------

function isTimeInPast(scheduledDate: Date | null, timeString: string): boolean {
  if (!scheduledDate || !timeString) return false;

  const now = new Date();
  const isToday =
    scheduledDate.getFullYear() === now.getFullYear() &&
    scheduledDate.getMonth() === now.getMonth() &&
    scheduledDate.getDate() === now.getDate();

  if (!isToday) return false; // future dates are always valid

  const [hour, minute] = timeString.split(":").map(Number);
  const pickupTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );

  const graceTime = new Date(now.getTime() + 15 * 60 * 1000);
  return pickupTime < graceTime;
}

console.log("\n⏰ Past timeslot guard");
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

// A time well in the past today (00:00)
assert("today 00:00 → blocked",    isTimeInPast(today, "00:00") === true);

// Dynamically compute a time >30 min ahead to avoid false failures near midnight
const thirtyMinAhead = new Date(today.getTime() + 30 * 60 * 1000);
if (thirtyMinAhead.getDate() === today.getDate()) {
  const hh = thirtyMinAhead.getHours().toString().padStart(2, "0");
  const mm = thirtyMinAhead.getMinutes().toString().padStart(2, "0");
  assert(`today +30 min (${hh}:${mm}) → allowed`, isTimeInPast(today, `${hh}:${mm}`) === false);
} else {
  // Near midnight – the "tomorrow is always valid" test below covers this case
  assert("near midnight: skip +30min today test (covered by tomorrow)", true);
}

// Tomorrow is never in the past
assert("tomorrow 00:00 → allowed", isTimeInPast(tomorrow, "00:00") === false);
// Null date → not in past
assert("null date → allowed",      isTimeInPast(null, "10:00") === false);
// Empty time string → not in past
assert("empty time → allowed",     isTimeInPast(today, "") === false);

// ---------------------------------------------------------------------------
// 3. Radius / Haversine distance logic
//    Logic mirrored from src/utils/distance.ts
// ---------------------------------------------------------------------------

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

console.log("\n📍 Radius / distance logic");
const samePoint = getDistance(47.5596, 7.5886, 47.5596, 7.5886);
assert("same coordinates → 0 m",     Math.round(samePoint) === 0);

// Basel Marktplatz → Basel SBB: known distance ≈ 1.34 km
const baselDist = getDistance(47.5596, 7.5886, 47.5476, 7.5898);
assert("Basel cross-city ~1.3 km",    baselDist > 1100 && baselDist < 1600);

// Basel → Zürich: ~75 km
const bzDist = getDistance(47.5596, 7.5886, 47.3769, 8.5417);
assert("Basel → Zürich ~75 km",       bzDist > 70_000 && bzDist < 80_000);

// Radius guard: within 2 km
const nearbyDist = getDistance(47.5596, 7.5886, 47.5600, 7.5950);
assert("nearby point within 2 km radius", nearbyDist < 2000);

// Radius guard: outside 2 km
assert("far point outside 2 km radius",   bzDist > 2000);

// ---------------------------------------------------------------------------
// 4. Stripe test-mode isolation guard
//    Logic mirrored from src/components/AdminStripeStatus.tsx (lines 38-43)
// ---------------------------------------------------------------------------

type StripeEvent = { id: string; stripe_mode: "test" | "live" };

function countByMode(events: StripeEvent[], mode: "test" | "live"): number {
  return events.filter((e) => e.stripe_mode === mode).length;
}

function isTestModeOnly(events: StripeEvent[]): boolean {
  return countByMode(events, "live") === 0 && countByMode(events, "test") > 0;
}

console.log("\n💳 Stripe test-mode isolation guard");
const testEvents: StripeEvent[] = [
  { id: "evt_1", stripe_mode: "test" },
  { id: "evt_2", stripe_mode: "test" },
];
const mixedEvents: StripeEvent[] = [
  { id: "evt_3", stripe_mode: "test" },
  { id: "evt_4", stripe_mode: "live" },
];
const emptyEvents: StripeEvent[] = [];

assert("all test events → test-only mode", isTestModeOnly(testEvents) === true);
assert("mixed events → NOT test-only",     isTestModeOnly(mixedEvents) === false);
assert("no events → NOT test-only",        isTestModeOnly(emptyEvents) === false);
assert("test event count = 2",             countByMode(testEvents, "test") === 2);
assert("live event count = 0",             countByMode(testEvents, "live") === 0);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const total = passed + failed;
console.log(`\n${"─".repeat(40)}`);
console.log(`Healthcheck complete: ${passed}/${total} tests passed`);

if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed – review output above.`);
  process.exit(1);
} else {
  console.log("\n✅ All checks passed.");
}
