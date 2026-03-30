import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExpiringHabit {
  habitName: string;
  childName: string;
  childId: string;
  habitId: string;
}

interface HabitExpiryBannerProps {
  userId: string;
  children: { id: string; name: string }[];
  forceShow?: boolean;
}

export const HabitExpiryBanner = ({ userId, children, forceShow = false }: HabitExpiryBannerProps) => {
  const [expiringHabits, setExpiringHabits] = useState<ExpiringHabit[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || children.length === 0) return;
    checkExpiringHabits();
    const interval = setInterval(checkExpiringHabits, 60000);
    return () => clearInterval(interval);
  }, [userId, children, forceShow]);

  const checkExpiringHabits = async () => {
    // Get parent timezone
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone, notification_hour")
      .eq("id", userId)
      .single();

    const timezone = profile?.timezone || "America/New_York";
    const notificationHour = profile?.notification_hour ?? 18;
    const now = new Date();

    // Get current time in parent's timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const currentHour = parseInt(formatter.format(now), 10);

    // Only show warnings after the configured hour (unless force showing)
    if (!forceShow && currentHour < notificationHour) {
      setExpiringHabits([]);
      return;
    }

    // Get today's date in parent's timezone
    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
    });
    const todayStr = dateFormatter.format(now);

    // Get the current day name for allowed_days check
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
    });
    const todayDay = dayFormatter.format(now).toLowerCase();

    const childIds = children.map((c) => c.id);

    // Fetch all active habits for these children
    const { data: habits } = await supabase
      .from("habits")
      .select("id, name, child_id, frequency, allowed_days, times_per_period")
      .in("child_id", childIds)
      .eq("is_active", true);

    if (!habits || habits.length === 0) {
      setExpiringHabits([]);
      return;
    }

    // Fetch today's progress
    const { data: progress } = await supabase
      .from("habit_progress")
      .select("habit_id, child_id")
      .in("child_id", childIds)
      .eq("date", todayStr)
      .is("step_id", null);

    const progressMap: Record<string, number> = {};
    progress?.forEach((p) => {
      const key = `${p.child_id}-${p.habit_id}`;
      progressMap[key] = (progressMap[key] || 0) + 1;
    });

    const childMap = Object.fromEntries(children.map((c) => [c.id, c.name]));

    const expiring: ExpiringHabit[] = [];

    for (const habit of habits) {
      // Check if habit is scheduled for today
      if (habit.frequency === "custom" && habit.allowed_days) {
        if (!habit.allowed_days.includes(todayDay)) continue;
      }
      // Weekly habits - show warning on all days
      // Daily habits - always applicable

      const key = `${habit.child_id}-${habit.id}`;
      const completions = progressMap[key] || 0;

      if (completions < habit.times_per_period) {
        expiring.push({
          habitName: habit.name,
          childName: childMap[habit.child_id] || "Unknown",
          childId: habit.child_id,
          habitId: habit.id,
        });
      }
    }

    setExpiringHabits(expiring);
  };

  const handleDismiss = (habitId: string) => {
    setDismissed((prev) => new Set(prev).add(habitId));
  };

  const handleDismissAll = () => {
    setDismissed(new Set(expiringHabits.map((h) => h.habitId)));
  };

  const visible = expiringHabits.filter((h) => !dismissed.has(h.habitId));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Habits expiring tonight
        </p>
        {visible.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2 text-muted-foreground"
            onClick={handleDismissAll}
          >
            Dismiss all
          </Button>
        )}
      </div>
      {visible.map((habit) => (
        <Alert
          key={habit.habitId}
          className="border-destructive/30 bg-destructive/5 py-2.5 pr-2"
        >
          <div className="flex items-center justify-between gap-2">
            <AlertDescription className="text-sm text-foreground">
              <span className="font-medium">{habit.childName}</span> hasn't completed{" "}
              <span className="font-medium">{habit.habitName}</span> today
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 rounded-full"
              onClick={() => handleDismiss(habit.habitId)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};
