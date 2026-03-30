import { supabase } from "@/integrations/supabase/client";

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalHabitsCompleted: number;
  currentStreak: number;
  totalRewardsRedeemed: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_step",
    name: "First Step",
    description: "Complete your very first habit",
    icon: "🌱",
    check: (s) => s.totalHabitsCompleted >= 1,
  },
  {
    key: "high_five",
    name: "High Five",
    description: "Complete 5 habits",
    icon: "✋",
    check: (s) => s.totalHabitsCompleted >= 5,
  },
  {
    key: "shining_star",
    name: "Shining Star",
    description: "Complete 10 habits",
    icon: "⭐",
    check: (s) => s.totalHabitsCompleted >= 10,
  },
  {
    key: "habit_hero",
    name: "Habit Hero",
    description: "Complete 25 habits",
    icon: "🦸",
    check: (s) => s.totalHabitsCompleted >= 25,
  },
  {
    key: "century_club",
    name: "Century Club",
    description: "Complete 100 habits",
    icon: "💯",
    check: (s) => s.totalHabitsCompleted >= 100,
  },
  {
    key: "on_fire",
    name: "On Fire",
    description: "Reach a 3-day streak",
    icon: "🔥",
    check: (s) => s.currentStreak >= 3,
  },
  {
    key: "week_warrior",
    name: "Week Warrior",
    description: "Reach a 7-day streak",
    icon: "⚔️",
    check: (s) => s.currentStreak >= 7,
  },
  {
    key: "unstoppable",
    name: "Unstoppable",
    description: "Reach a 14-day streak",
    icon: "🚀",
    check: (s) => s.currentStreak >= 14,
  },
  {
    key: "monthly_master",
    name: "Monthly Master",
    description: "Reach a 30-day streak",
    icon: "👑",
    check: (s) => s.currentStreak >= 30,
  },
  {
    key: "reward_hunter",
    name: "Reward Hunter",
    description: "Redeem your first reward",
    icon: "🎯",
    check: (s) => s.totalRewardsRedeemed >= 1,
  },
];

/**
 * Checks and awards any newly earned badges for a child.
 * Returns the list of newly awarded badge names.
 */
export async function checkAndAwardBadges(childId: string): Promise<string[]> {
  try {
    // Fetch existing badges for this child
    const { data: existingBadges, error: badgesError } = await supabase
      .from("badges")
      .select("name")
      .eq("child_id", childId);

    if (badgesError) {
      console.error("Failed to fetch existing badges:", badgesError);
      return [];
    }

    const earnedNames = new Set((existingBadges || []).map((b) => b.name));

    // Fetch stats - count ALL habit_progress rows for this child (both direct and step-based completions)
    const [progressResult, childResult, redemptionsResult] = await Promise.all([
      supabase
        .from("habit_progress")
        .select("*", { count: "exact", head: true })
        .eq("child_id", childId)
        .is("step_id", null),
      supabase
        .from("children")
        .select("current_streak")
        .eq("id", childId)
        .single(),
      supabase
        .from("reward_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("child_id", childId),
    ]);

    if (progressResult.error) {
      console.error("Failed to fetch habit progress count:", progressResult.error);
    }
    if (childResult.error) {
      console.error("Failed to fetch child streak:", childResult.error);
    }
    if (redemptionsResult.error) {
      console.error("Failed to fetch redemptions count:", redemptionsResult.error);
    }

    const totalCompleted = progressResult.count ?? 0;

    const stats: BadgeStats = {
      totalHabitsCompleted: totalCompleted,
      currentStreak: childResult.data?.current_streak ?? 0,
      totalRewardsRedeemed: redemptionsResult.count ?? 0,
    };

    console.log("Badge check stats:", stats, "Already earned:", Array.from(earnedNames));

    // Check which new badges are earned
    const newBadges: string[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      if (earnedNames.has(badge.name)) continue;
      if (!badge.check(stats)) continue;

      // Award the badge
      const { error } = await supabase.from("badges").insert({
        child_id: childId,
        name: badge.name,
        description: badge.description,
        icon_url: badge.icon,
      });

      if (error) {
        console.error(`Failed to insert badge "${badge.name}":`, error);
      } else {
        console.log(`Badge awarded: ${badge.name}`);
        newBadges.push(badge.name);
      }
    }

    return newBadges;
  } catch (err) {
    console.error("checkAndAwardBadges unexpected error:", err);
    return [];
  }
}
