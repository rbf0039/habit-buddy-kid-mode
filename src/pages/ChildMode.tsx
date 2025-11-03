import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Award, Coins, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Child {
  id: string;
  name: string;
  age: number;
  coin_balance: number;
  current_streak: number;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  coins_per_completion: number;
}

interface HabitWithSteps extends Habit {
  steps: HabitStep[];
  completedSteps: number;
}

interface HabitStep {
  id: string;
  name: string;
  order_index: number;
  completed: boolean;
}

const ChildMode = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [child, setChild] = useState<Child | null>(null);
  const [habits, setHabits] = useState<HabitWithSteps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const habitsWithSteps = await Promise.all(
      (habitsData || []).map(async (habit) => {
        const { data: stepsData } = await supabase
          .from("habit_steps")
          .select("*")
          .eq("habit_id", habit.id)
          .order("order_index", { ascending: true });

        const { data: progressData } = await supabase
          .from("habit_progress")
          .select("step_id")
          .eq("habit_id", habit.id)
          .eq("child_id", childId)
          .eq("date", new Date().toISOString().split("T")[0]);

        const completedStepIds = new Set(progressData?.map((p) => p.step_id) || []);

        const steps = (stepsData || []).map((step) => ({
          ...step,
          completed: completedStepIds.has(step.id),
        }));

        return {
          ...habit,
          steps,
          completedSteps: steps.filter((s) => s.completed).length,
        };
      })
    );

    setHabits(habitsWithSteps);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChildData();
  }, [childId, user]);

  const handleStepToggle = async (habitId: string, stepId: string, currentlyCompleted: boolean) => {
    if (!child) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = new Date().toISOString().split("T")[0];

    if (currentlyCompleted) {
      // Check if habit was fully completed before uncompleting this step
      const wasFullyCompleted = habit.completedSteps === habit.steps.length;

      // Uncomplete the step
      const { error } = await supabase
        .from("habit_progress")
        .delete()
        .eq("habit_id", habitId)
        .eq("step_id", stepId)
        .eq("child_id", child.id)
        .eq("date", today);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update progress.",
          variant: "destructive",
        });
        return;
      }

      // If habit was fully completed, deduct coins
      if (wasFullyCompleted) {
        const { error: coinError } = await supabase
          .from("children")
          .update({ coin_balance: Math.max(0, child.coin_balance - habit.coins_per_completion) })
          .eq("id", child.id);

        if (coinError) {
          toast({
            title: "Error",
            description: "Failed to update coins.",
            variant: "destructive",
          });
        }
      }
    } else {
      // Complete the step
      const { error } = await supabase.from("habit_progress").insert({
        habit_id: habitId,
        step_id: stepId,
        child_id: child.id,
        date: today,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update progress.",
          variant: "destructive",
        });
        return;
      }

      // Check if this completes the habit
      const newCompletedSteps = habit.completedSteps + 1;
      const isNowFullyCompleted = newCompletedSteps === habit.steps.length;

      if (isNowFullyCompleted) {
        // Award coins
        const { error: coinError } = await supabase
          .from("children")
          .update({ coin_balance: child.coin_balance + habit.coins_per_completion })
          .eq("id", child.id);

        if (coinError) {
          toast({
            title: "Error",
            description: "Failed to award coins.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Great job! 🎉",
            description: `You earned ${habit.coins_per_completion} coins for completing ${habit.name}!`,
          });
        }
      }
    }

    // Refresh data
    fetchChildData();
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
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-3xl shadow-glow">
            {child.name.charAt(0).toUpperCase()}
          </div>
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

        {/* Habits */}
        {habits.length === 0 ? (
          <Card className="shadow-card mb-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
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
            {habits.map((habit, index) => {
              const progress = habit.steps.length > 0 
                ? (habit.completedSteps / habit.steps.length) * 100 
                : 0;
              const isFullyCompleted = progress === 100;

              return (
                <Card
                  key={habit.id}
                  className={`shadow-card animate-fade-in-up ${
                    isFullyCompleted ? "border-success/50 bg-success/5" : ""
                  }`}
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
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
                        <div className="flex items-center gap-2 mb-2">
                          <Coins className="w-4 h-4 text-warning" />
                          <span className="text-sm font-semibold text-warning">
                            +{habit.coins_per_completion} coins
                          </span>
                        </div>
                      </div>
                    </div>

                    {habit.steps.length > 0 && (
                      <>
                        <Progress value={progress} className="mb-4 h-2" />
                        <div className="space-y-2">
                          {habit.steps.map((step) => (
                            <button
                              key={step.id}
                              onClick={() =>
                                handleStepToggle(habit.id, step.id, step.completed)
                              }
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                                step.completed
                                  ? "bg-success/10 border border-success/30"
                                  : "bg-muted/50 hover:bg-muted border border-border"
                              }`}
                            >
                              {step.completed ? (
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
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
