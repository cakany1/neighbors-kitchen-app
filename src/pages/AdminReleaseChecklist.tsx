import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  category: "auth" | "meals" | "payments" | "safety" | "notifications";
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Authentication
  { key: "signup_works", label: "Signup works", description: "New user can register with email", category: "auth" },
  { key: "email_verification", label: "Email verification works", description: "Verification email is sent and link works", category: "auth" },
  { key: "login_works", label: "Login works", description: "Existing user can log in successfully", category: "auth" },
  { key: "partner_linking", label: "Partner linking optional", description: "Household linking works with dual confirmation, nothing blocked if skipped", category: "auth" },
  
  // Meals & Booking
  { key: "add_meal_works", label: "Add meal works", description: "Chef can create and publish a meal", category: "meals" },
  { key: "delete_under_5min", label: "Delete <5 min works", description: "Meal deletion within 5 min has no karma penalty", category: "meals" },
  { key: "delete_over_5min_karma", label: "Delete >5 min gives -10 karma", description: "Meal deletion after 5 min deducts 10 karma", category: "meals" },
  { key: "ai_preview_labeled", label: "AI meal preview labeled", description: "AI-generated images show 'Beispielbild' badge and require confirmation", category: "meals" },
  
  // Payments
  { key: "stripe_test_visible", label: "Stripe TEST visible", description: "Test mode indicator visible in admin, test payments work", category: "payments" },
  { key: "stripe_live_visible", label: "Stripe LIVE visible", description: "Live mode indicator visible, real payments processed", category: "payments" },
  
  // Safety & Privacy
  { key: "captcha_contact", label: "CAPTCHA on contact works", description: "Turnstile captcha appears and validates on contact form", category: "safety" },
  { key: "women_only_logic", label: "Women-only flow works", description: "Women-only meals require photo verification, only visible to verified women", category: "safety" },
  { key: "vacation_mode", label: "Vacation mode works", description: "User can enable vacation mode, meals hidden from feed", category: "safety" },
  
  // Notifications
  { key: "notifications_behave", label: "Notifications behave correctly", description: "Email notifications sent for bookings, cancellations, ratings", category: "notifications" },
];

const CATEGORY_LABELS: Record<string, string> = {
  auth: "🔐 Authentication",
  meals: "🍽️ Meals & Booking",
  payments: "💳 Payments",
  safety: "🛡️ Safety & Privacy",
  notifications: "🔔 Notifications",
};

interface CheckState {
  is_checked: boolean;
  note: string;
  checked_at: string | null;
  checked_by: string | null;
}

export default function AdminReleaseChecklist() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [releaseVersion, setReleaseVersion] = useState(() => {
    const today = new Date();
    return `v${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
  });
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    loadChecks();
  }, [releaseVersion]);

  const loadChecks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("release_checks")
        .select("*")
        .eq("release_version", releaseVersion);

      if (error) throw error;

      const checksMap: Record<string, CheckState> = {};
      CHECKLIST_ITEMS.forEach((item) => {
        const existing = data?.find((d) => d.check_key === item.key);
        checksMap[item.key] = {
          is_checked: existing?.is_checked || false,
          note: existing?.note || "",
          checked_at: existing?.checked_at || null,
          checked_by: existing?.checked_by || null,
        };
      });
      setChecks(checksMap);
    } catch (error) {
      console.error("Error loading checks:", error);
      toast({
        title: "Error",
        description: "Failed to load checklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCheck = (key: string, field: "is_checked" | "note", value: boolean | string) => {
    setChecks((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
        ...(field === "is_checked" && value === true
          ? { checked_at: new Date().toISOString(), checked_by: userId }
          : {}),
      },
    }));
  };

  const saveChecks = async () => {
    setSaving(true);
    try {
      for (const item of CHECKLIST_ITEMS) {
        const checkState = checks[item.key];
        if (!checkState) continue;

        const { error } = await supabase
          .from("release_checks")
          .upsert(
            {
              release_version: releaseVersion,
              check_key: item.key,
              is_checked: checkState.is_checked,
              note: checkState.note || null,
              checked_by: checkState.is_checked ? userId : null,
              checked_at: checkState.is_checked ? checkState.checked_at : null,
            },
            { onConflict: "release_version,check_key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Saved",
        description: "Checklist saved successfully",
      });
    } catch (error) {
      console.error("Error saving checks:", error);
      toast({
        title: "Error",
        description: "Failed to save checklist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const checkedCount = Object.values(checks).filter((c) => c.is_checked).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const groupedItems = CHECKLIST_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Release QA Checklist</h1>
            <p className="text-muted-foreground mt-1">
              Verify release readiness before deployment
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              value={releaseVersion}
              onChange={(e) => setReleaseVersion(e.target.value)}
              placeholder="e.g. v2024.01.15"
              className="w-40"
            />
            <Button onClick={loadChecks} variant="outline" size="icon" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Progress Summary with Status Indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {progress === 100 ? "🟢" : progress > 0 ? "🟡" : "🔴"}
                </span>
                <span className="text-sm font-medium">
                  {progress === 100 ? "Ready for Release" : progress > 0 ? "In Progress" : "Not Started"}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {checkedCount} / {totalCount} checks completed ({progress}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  progress === 100 
                    ? "bg-green-500" 
                    : progress > 0 
                      ? "bg-yellow-500" 
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All checks passed! Ready for release.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Checklist by Category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category} className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
                <Badge variant="secondary">
                  {items.filter((i) => checks[i.key]?.is_checked).length} / {items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const state = checks[item.key] || { is_checked: false, note: "", checked_at: null };
                return (
                  <div
                    key={item.key}
                    className={`p-4 rounded-lg border transition-colors ${
                      state.is_checked
                        ? "bg-accent/10 border-accent/30"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={item.key}
                        checked={state.is_checked}
                        onCheckedChange={(checked) =>
                          updateCheck(item.key, "is_checked", checked === true)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <label
                          htmlFor={item.key}
                          className="font-medium cursor-pointer flex items-center gap-2"
                        >
                          {state.is_checked ? (
                            <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          {item.label}
                        </label>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        
                        {state.checked_at && (
                          <p className="text-xs text-muted-foreground">
                            Checked: {format(new Date(state.checked_at), "PPp")}
                          </p>
                        )}

                        <Textarea
                          placeholder="Optional notes..."
                          value={state.note}
                          onChange={(e) => updateCheck(item.key, "note", e.target.value)}
                          className="mt-2 text-sm min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Save Button */}
        <div className="flex justify-end sticky bottom-4">
          <Button onClick={saveChecks} disabled={saving} size="lg" className="shadow-lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Checklist"}
          </Button>
        </div>
      </div>
    </div>
  );
}
