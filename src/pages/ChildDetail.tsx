import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, Coins, Flame, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateHabitDialog } from "@/components/CreateHabitDialog";

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
  frequency: string;
  coins_per_completion: number;
  is_active: boolean;
}

interface HabitWithSteps extends Habit {
  steps: { id: string; name: string; order_index: number }[];
}

const ChildDetail = () => {
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

  const fetchData = async () => {
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
      .order("created_at", { ascending: false });

    if (habitsError) {
      toast({
        title: "Error",
        description: "Failed to load habits.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Fetch steps for each habit
    const habitsWithSteps = await Promise.all(
      (habitsData || []).map(async (habit) => {
        const { data: stepsData } = await supabase
          .from("habit_steps")
          .select("*")
          .eq("habit_id", habit.id)
          .order("order_index", { ascending: true });

        return {
          ...habit,
          steps: stepsData || [],
        };
      })
    );

    setHabits(habitsWithSteps);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [childId, user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-parent flex items-center justify-center">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (!child) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-parent px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{child.name}</h1>
                  <p className="text-muted-foreground">Age {child.age}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                  {child.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-warning/10 rounded-lg p-3 text-center">
                  <Coins className="w-5 h-5 mx-auto mb-1 text-warning" />
                  <p className="text-xl font-bold text-warning">{child.coin_balance}</p>
                  <p className="text-xs text-muted-foreground">Habit Coins</p>
                </div>
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <Flame className="w-5 h-5 mx-auto mb-1 text-success" />
                  <p className="text-xl font-bold text-success">{child.current_streak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habits Section */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5" />
              Habits
            </h2>
          </div>

          {habits.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No habits yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first habit to help {child.name} build great routines!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 mb-4">
              {habits.map((habit) => (
                <Card key={habit.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{habit.icon}</span>
                      <span className="text-lg">{habit.name}</span>
                      {!habit.is_active && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mb-3">{habit.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-warning" />
                        <span className="font-semibold text-warning">
                          +{habit.coins_per_completion} coins
                        </span>
                      </span>
                      <span className="text-muted-foreground capitalize">
                        {habit.frequency}
                      </span>
                    </div>

                    {habit.steps.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Steps:</p>
                        <ol className="space-y-1">
                          {habit.steps.map((step, index) => (
                            <li key={step.id} className="text-sm text-muted-foreground">
                              {index + 1}. {step.name}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <CreateHabitDialog childId={childId!} onHabitCreated={fetchData} />
        </div>
      </div>
    </div>
  );
};

export default ChildDetail;
