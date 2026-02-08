import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Circle, Award, Coins, Flame, Gift, Clock, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import confetti from "canvas-confetti";

interface Child {
  id: string;
  name: string;
  coin_balance: number;
  current_streak: number;
  avatar_url: string | null;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  coins_per_completion: number;
  frequency: string;
  times_per_period: number;
  cooldown_minutes: number;
  allowed_days: string[] | null;
}

interface HabitWithSteps extends Habit {
  steps: HabitStep[];
  completedSteps: number;
  completionsToday: number;
  lastCompletedAt: Date | null;
  canComplete: boolean;
  nextAvailableAt: Date | null;
  isScheduledToday: boolean;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  coin_cost: number;
  is_active: boolean;
}

interface RewardRedemption {
  id: string;
  reward_id: string;
  redeemed_at: string;
  status: string;
  reward: Reward;
}

interface HabitStep {
  id: string;
  name: string;
  order_index: number;
  completed: boolean;
}

const DAY_MAP: { [key: number]: string } = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

const ChildMode = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [child, setChild] = useState<Child | null>(null);
  const [habits, setHabits] = useState<HabitWithSteps[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [seenApprovals, setSeenApprovals] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("habits");

  // Trigger confetti when switching to "My Rewards" tab and there are unseen approvals
  const triggerCelebrationConfetti = () => {
    // Fire confetti from both sides
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 }
    });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 }
    });
    // Fire from center with stars
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7 },
        shapes: ['star'],
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
      });
    }, 200);
  };

  // Check for unseen approvals when tab changes to "my-rewards"
  useEffect(() => {
    if (activeTab === "my-rewards") {
      const approvedRedemptions = redemptions.filter(r => r.status === "approved");
      const unseenApprovals = approvedRedemptions.filter(r => !seenApprovals.has(r.id));
      
      if (unseenApprovals.length > 0) {
        // Trigger confetti for unseen approvals
        triggerCelebrationConfetti();
        
        // Mark all approved as seen
        setSeenApprovals(prev => {
          const newSet = new Set(prev);
          approvedRedemptions.forEach(r => newSet.add(r.id));
          return newSet;
        });
        
        // Show toast
        toast({
          title: "🎉 Congratulations!",
          description: `You have ${unseenApprovals.length} approved reward${unseenApprovals.length > 1 ? 's' : ''}!`,
        });
      }
    }
  }, [activeTab, redemptions, seenApprovals]);

  // Real-time countdown timer - updates every second
  useEffect(() => {
    const hasActiveCooldowns = habits.some(h => h.nextAvailableAt && h.nextAvailableAt.getTime() > Date.now());
    
    if (!hasActiveCooldowns) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      
      // Check if any cooldowns have expired and refresh data
      const expiredCooldowns = habits.filter(h => 
        h.nextAvailableAt && 
        h.nextAvailableAt.getTime() <= Date.now() && 
        !h.canComplete
      );
      
      if (expiredCooldowns.length > 0) {
        fetchChildData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [habits]);

  // Format countdown time for display
  const formatCooldownTime = useCallback((nextAvailableAt: Date | null) => {
    if (!nextAvailableAt) return null;
    const msLeft = nextAvailableAt.getTime() - currentTime;
    if (msLeft <= 0) return null;
    
    const totalMinutes = Math.ceil(msLeft / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `Complete again in ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Complete again in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `Complete again in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }, [currentTime]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchChildData = async () => {
    if (!childId || !user) return;

    setIsLoading(true);

    // Fetch child data
    const { data: childData, error: childError } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .eq("parent_id", user.id)
      .single();

    if (childError || !childData) {
      toast({
        title: "Error",
        description: "Child not found.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setChild(childData);

    // Fetch habits for this child
    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("child_id", childId)
      .eq("is_active", true);

    if (habitsError) {
      toast({
        title: "Error",
        description: "Failed to load habits.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Fetch steps and progress for each habit
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentDayOfWeek = DAY_MAP[today.getDay()];

    const habitsWithSteps = await Promise.all(
      (habitsData || []).map(async (habit) => {
        // Check if habit is scheduled for today
        let isScheduledToday = true;
        if (habit.frequency === "custom" && habit.allowed_days) {
          isScheduledToday = habit.allowed_days.includes(currentDayOfWeek);
        }

        const { data: stepsData } = await supabase
          .from("habit_steps")
          .select("*")
          .eq("habit_id", habit.id)
          .order("order_index", { ascending: true });

        const { data: progressData } = await supabase
          .from("habit_progress")
          .select("step_id, completed_at")
          .eq("habit_id", habit.id)
          .eq("child_id", childId)
          .eq("date", todayStr)
          .order("completed_at", { ascending: false });

        const completedStepIds = new Set(progressData?.map((p) => p.step_id) || []);

        const steps = (stepsData || []).map((step) => ({
          ...step,
          completed: completedStepIds.has(step.id),
        }));

        // Count completions today (for habits without steps, count null step_id entries)
        const hasSteps = steps.length > 0;
        let completionsToday = 0;
        let lastCompletedAt: Date | null = null;

        if (!hasSteps) {
          const nullStepProgress = progressData?.filter(p => p.step_id === null) || [];
          completionsToday = nullStepProgress.length;
          if (nullStepProgress.length > 0) {
            lastCompletedAt = new Date(nullStepProgress[0].completed_at);
          }
        } else {
          // For habits with steps, count full completions (when all steps are done)
          const allStepsCompleted = steps.every(s => s.completed);
          completionsToday = allStepsCompleted ? 1 : 0;
          // Get the most recent step completion time
          if (allStepsCompleted && progressData && progressData.length > 0) {
            lastCompletedAt = new Date(progressData[0].completed_at);
          }
        }

        // Calculate if habit can be completed now
        const timesPerPeriod = habit.times_per_period || 1;
        const cooldownMinutes = habit.cooldown_minutes || 0;
        
        let canComplete = isScheduledToday && completionsToday < timesPerPeriod;
        let nextAvailableAt: Date | null = null;

        // Check cooldown for multi-completion habits
        if (canComplete && timesPerPeriod > 1 && lastCompletedAt && cooldownMinutes > 0) {
          const cooldownEnds = new Date(lastCompletedAt.getTime() + cooldownMinutes * 60 * 1000);
          if (new Date() < cooldownEnds) {
            canComplete = false;
            nextAvailableAt = cooldownEnds;
          }
        }

        return {
          ...habit,
          steps,
          completedSteps: steps.filter((s) => s.completed).length,
          completionsToday,
          lastCompletedAt,
          canComplete,
          nextAvailableAt,
          isScheduledToday,
        };
      })
    );

    setHabits(habitsWithSteps);

    // Fetch rewards for this child
    const { data: rewardsData, error: rewardsError } = await supabase
      .from("rewards")
      .select("*")
      .eq("child_id", childId)
      .eq("is_active", true)
      .order("coin_cost", { ascending: true });

    if (rewardsError) {
      console.error("Error fetching rewards:", rewardsError);
    } else {
      setRewards(rewardsData || []);
    }

    // Fetch reward redemptions for this child
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select(`
        *,
        reward:rewards(*)
      `)
      .eq("child_id", childId)
      .order("redeemed_at", { ascending: false });

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError);
    } else {
      setRedemptions(redemptionsData || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchChildData();
  }, [childId, user]);

  // Real-time subscription for redemption status changes
  useEffect(() => {
    if (!childId) return;

    const channel = supabase
      .channel(`redemptions-${childId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reward_redemptions',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          // Update the local redemptions state with the new status
          setRedemptions(prev => 
            prev.map(r => 
              r.id === payload.new.id 
                ? { ...r, status: payload.new.status } 
                : r
            )
          );
          
          // Also refresh child data to update coin balance if denied
          if (payload.new.status === 'denied') {
            fetchChildData();
          }
          
          // Show celebration confetti when approved (only if on my-rewards tab)
          if (payload.new.status === 'approved') {
            triggerCelebrationConfetti();
            // Mark this approval as seen immediately since they saw it in real-time
            setSeenApprovals(prev => new Set(prev).add(payload.new.id));
          }
          
          // Show toast notification
          const statusMessage = payload.new.status === 'approved' 
            ? '🎉 Your reward was approved!' 
            : '❌ Your reward was denied. Coins refunded.';
          toast({
            title: payload.new.status === 'approved' ? 'Approved!' : 'Denied',
            description: statusMessage,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId]);

  const handleCompleteHabitWithoutSteps = async (habitId: string) => {
    if (!child || completingHabitId) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Check if can complete based on frequency, times, and cooldown
    if (!habit.canComplete) {
      if (!habit.isScheduledToday) {
        toast({
          title: "Not scheduled today",
          description: "This habit is not scheduled for today.",
        });
      } else if (habit.nextAvailableAt) {
        const minutesLeft = Math.ceil((habit.nextAvailableAt.getTime() - Date.now()) / (1000 * 60));
        toast({
          title: "Cooldown active",
          description: `Wait ${minutesLeft} more minute${minutesLeft !== 1 ? 's' : ''} before completing again.`,
        });
      } else {
        toast({
          title: "Already completed",
          description: `You've already completed this habit ${habit.times_per_period} time${habit.times_per_period !== 1 ? 's' : ''} today!`,
        });
      }
      return;
    }

    // Immediately disable button
    setCompletingHabitId(habitId);
    
    // Optimistically update canComplete to prevent double-clicks
    setHabits(prevHabits => prevHabits.map(h => 
      h.id === habitId ? { ...h, canComplete: false } : h
    ));

    const today = new Date().toISOString().split("T")[0];

    try {
      // Mark habit as complete (no step_id)
      const { error: progressError } = await supabase
        .from("habit_progress")
        .insert({
          habit_id: habitId,
          child_id: child.id,
          date: today,
          step_id: null,
        });

      if (progressError) throw progressError;

      // Award coins
      const { error: coinError } = await supabase
        .from("children")
        .update({ coin_balance: child.coin_balance + habit.coins_per_completion })
        .eq("id", child.id);

      if (coinError) throw coinError;

      const remaining = habit.times_per_period - habit.completionsToday - 1;
      toast({
        title: "Great job! 🎉",
        description: `You earned ${habit.coins_per_completion} coins!${remaining > 0 ? ` (${remaining} more time${remaining !== 1 ? 's' : ''} available today)` : ''}`,
      });

      // Refresh data
      await fetchChildData();
    } catch (error: unknown) {
      console.error("Error completing habit:", error);
      // Parse server-side validation errors
      const errorMessage = error instanceof Error ? error.message : "Failed to complete habit. Please try again.";
      toast({
        title: "Cannot complete habit",
        description: errorMessage.includes("Cooldown") || errorMessage.includes("Maximum") 
          ? errorMessage 
          : "Failed to complete habit. Please try again.",
        variant: "destructive",
      });
      // Refresh to get accurate state
      await fetchChildData();
    } finally {
      setCompletingHabitId(null);
    }
  };

  const handleStepComplete = async (habitId: string, stepId: string, currentlyCompleted: boolean) => {
    // Don't allow unchecking steps - only allow completing
    if (currentlyCompleted) return;
    
    if (!child || togglingStepId) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Immediately disable the step button
    setTogglingStepId(stepId);

    const today = new Date().toISOString().split("T")[0];

    try {
      // Complete the step
      const { error } = await supabase.from("habit_progress").insert({
        habit_id: habitId,
        step_id: stepId,
        child_id: child.id,
        date: today,
      });

      if (error) throw error;

      // Check if this completes the habit
      const newCompletedSteps = habit.completedSteps + 1;
      const isNowFullyCompleted = newCompletedSteps === habit.steps.length;

      if (isNowFullyCompleted) {
        // Award coins
        const { error: coinError } = await supabase
          .from("children")
          .update({ coin_balance: child.coin_balance + habit.coins_per_completion })
          .eq("id", child.id);

        if (coinError) throw coinError;

        toast({
          title: "Great job! 🎉",
          description: `You earned ${habit.coins_per_completion} coins for completing ${habit.name}!`,
        });
      }

      // Refresh data
      await fetchChildData();
    } catch (error) {
      console.error("Error completing step:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
      await fetchChildData();
    } finally {
      setTogglingStepId(null);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!child) return;

    if (child.coin_balance < reward.coin_cost) {
      toast({
        title: "Not enough coins",
        description: `You need ${reward.coin_cost - child.coin_balance} more coins to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Create redemption record
      const { error: redemptionError } = await supabase
        .from("reward_redemptions")
        .insert({
          child_id: child.id,
          reward_id: reward.id,
          status: "pending",
        });

      if (redemptionError) throw redemptionError;

      // Deduct coins
      const { error: coinError } = await supabase
        .from("children")
        .update({ coin_balance: child.coin_balance - reward.coin_cost })
        .eq("id", child.id);

      if (coinError) throw coinError;

      toast({
        title: "Success! 🎉",
        description: `You redeemed ${reward.name}! Your parent will approve it soon.`,
      });

      // Refresh data
      await fetchChildData();
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast({
        title: "Error",
        description: "Failed to redeem reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-child flex items-center justify-center">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (!child) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-child px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Avatar className="w-20 h-20 mx-auto mb-4 shadow-glow">
            <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
            <AvatarFallback className="text-3xl font-bold bg-gradient-primary text-white">
              {child.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hi, {child.name}! 👋
          </h1>
          <p className="text-muted-foreground">Let's build great habits today!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <Card className="shadow-card border-warning/30">
            <CardContent className="p-4 text-center">
              <Coins className="w-8 h-8 mx-auto mb-2 text-warning animate-bounce-gentle" />
              <p className="text-2xl font-bold text-warning">{child.coin_balance}</p>
              <p className="text-xs text-muted-foreground">Habit Coins</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-danger/30">
            <CardContent className="p-4 text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 text-danger animate-wiggle" />
              <p className="text-2xl font-bold text-danger">{child.current_streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Habits, Rewards, and My Rewards */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="habits">My Habits</TabsTrigger>
            <TabsTrigger value="rewards">Store</TabsTrigger>
            <TabsTrigger value="my-rewards">My Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="mt-4">
            {habits.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-foreground mb-2 font-semibold">No habits yet!</p>
                  <p className="text-sm text-muted-foreground">
                    Ask your parent to add some habits for you.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {habits.map((habit) => {
                  const hasSteps = habit.steps.length > 0;
                  const progress = hasSteps 
                    ? (habit.completedSteps / habit.steps.length) * 100 
                    : 0;
                  const isFullyCompletedForPeriod = habit.completionsToday >= habit.times_per_period;
                  const isFullyCompleted = hasSteps ? progress === 100 : isFullyCompletedForPeriod;

                  // Use the real-time countdown formatter
                  const cooldownDisplay = formatCooldownTime(habit.nextAvailableAt);

                  return (
                    <Card
                      key={habit.id}
                      className={`shadow-card ${
                        !habit.isScheduledToday 
                          ? "opacity-50 border-muted" 
                          : isFullyCompleted 
                            ? "border-success/50 bg-success/5" 
                            : ""
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{habit.icon}</span>
                              <h3 className="text-lg font-bold text-foreground">{habit.name}</h3>
                            </div>
                            {habit.description && (
                              <p className="text-sm text-muted-foreground mb-3">{habit.description}</p>
                            )}
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Coins className="w-4 h-4 text-warning" />
                                <span className="text-sm font-semibold text-warning">
                                  +{habit.coins_per_completion} coins
                                </span>
                              </div>
                              {habit.times_per_period > 1 && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                  {habit.completionsToday}/{habit.times_per_period} today
                                </span>
                              )}
                              {!habit.isScheduledToday && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                  Not scheduled today
                                </span>
                              )}
                              {cooldownDisplay && (
                                <div className="w-full mt-2 text-sm text-warning font-medium flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {cooldownDisplay}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {hasSteps ? (
                          <>
                            <Progress value={progress} className="mb-4 h-2" />
                            <div className="space-y-2">
                              {habit.steps.map((step) => (
                                <button
                                  key={step.id}
                                  onClick={() =>
                                    handleStepComplete(habit.id, step.id, step.completed)
                                  }
                                  disabled={step.completed || !habit.isScheduledToday || togglingStepId === step.id}
                                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                                    step.completed
                                      ? "bg-success/10 border border-success/30 cursor-default"
                                      : "bg-muted/50 hover:bg-muted border border-border"
                                  } ${!habit.isScheduledToday || togglingStepId === step.id ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                  {togglingStepId === step.id ? (
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                  ) : step.completed ? (
                                    <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 animate-celebrate" />
                                  ) : (
                                    <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span
                                    className={`text-left flex-1 ${
                                      step.completed
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {step.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleCompleteHabitWithoutSteps(habit.id)}
                            className="w-full"
                            variant={isFullyCompleted || !habit.canComplete ? "outline" : "default"}
                            disabled={!habit.canComplete || completingHabitId === habit.id}
                          >
                            {completingHabitId === habit.id
                              ? "Completing..."
                              : !habit.isScheduledToday 
                                ? "Not Scheduled Today"
                                : isFullyCompletedForPeriod 
                                  ? `Completed ${habit.times_per_period}x Today!` 
                                  : cooldownDisplay 
                                    ? `Wait ${cooldownDisplay}`
                                    : "Mark as Complete"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            {rewards.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-foreground text-lg mb-2">No rewards available</p>
                  <p className="text-sm text-muted-foreground">
                    Ask your parent to add some rewards you can earn!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => {
                  const canAfford = child && child.coin_balance >= reward.coin_cost;
                  return (
                    <Card
                      key={reward.id}
                      className={`shadow-card ${
                        canAfford
                          ? "border-success/40 hover:border-success cursor-pointer"
                          : "border-muted/20 opacity-70"
                      }`}
                      onClick={() => canAfford && handleRedeemReward(reward)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <span className="text-4xl">{reward.icon}</span>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-1">
                              {reward.name}
                            </h3>
                            {reward.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {reward.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Coins className="w-5 h-5 text-warning" />
                                <span className="text-lg font-bold text-warning">
                                  {reward.coin_cost} coins
                                </span>
                              </div>
                              {canAfford ? (
                                <Button size="sm" variant="default">
                                  Redeem
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                                  Need {reward.coin_cost - (child?.coin_balance || 0)} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-rewards" className="mt-4">
            {redemptions.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-foreground text-lg mb-2">No rewards redeemed yet</p>
                  <p className="text-sm text-muted-foreground">
                    Earn coins by completing habits and redeem rewards!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <Card key={redemption.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{redemption.reward.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {redemption.reward.name}
                          </h3>
                          {redemption.reward.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {redemption.reward.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {redemption.reward.coin_cost} coins
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(redemption.redeemed_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          redemption.status === 'approved' 
                            ? 'bg-success/20 text-success' 
                            : redemption.status === 'denied'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-warning/20 text-warning'
                        }`}>
                          {redemption.status === 'approved' ? '✓ Approved' : 
                           redemption.status === 'denied' ? '✗ Denied' : '⏳ Pending'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Back Button */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChildMode;
