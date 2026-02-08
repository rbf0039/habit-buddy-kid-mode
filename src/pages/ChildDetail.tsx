import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, Coins, Flame, Gift, CheckCircle, Clock, Pencil, Trash2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateHabitDialog } from "@/components/CreateHabitDialog";
import { CreateRewardDialog } from "@/components/CreateRewardDialog";
import { EditHabitDialog } from "@/components/EditHabitDialog";
import { EditRewardDialog } from "@/components/EditRewardDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  times_per_period: number;
  cooldown_minutes: number;
  allowed_days: string[] | null;
}

interface HabitWithSteps extends Habit {
  steps: { id: string; name: string; order_index: number }[];
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

const ChildDetail = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [child, setChild] = useState<Child | null>(null);
  const [habits, setHabits] = useState<HabitWithSteps[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingHabit, setEditingHabit] = useState<HabitWithSteps | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [deletingRewardId, setDeletingRewardId] = useState<string | null>(null);

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

    // Fetch rewards for this child
    const { data: rewardsData, error: rewardsError } = await supabase
      .from("rewards")
      .select("*")
      .eq("child_id", childId)
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false });

    if (rewardsError) {
      toast({
        title: "Error",
        description: "Failed to load rewards.",
        variant: "destructive",
      });
    } else {
      setRewards(rewardsData || []);
    }

    // Fetch reward redemptions
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select(`
        *,
        reward:rewards(*)
      `)
      .eq("child_id", childId)
      .order("redeemed_at", { ascending: false });

    if (redemptionsError) {
      toast({
        title: "Error",
        description: "Failed to load redemptions.",
        variant: "destructive",
      });
    } else {
      setRedemptions(redemptionsData || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [childId, user]);

  const handleDeleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit deleted successfully!",
      });

      setDeletingHabitId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from("rewards")
        .delete()
        .eq("id", rewardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reward deleted successfully!",
      });

      setDeletingRewardId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting reward:", error);
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveRedemption = async (redemptionId: string) => {
    try {
      const { error } = await supabase
        .from("reward_redemptions")
        .update({ status: "approved" })
        .eq("id", redemptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reward redemption approved!",
      });

      fetchData();
    } catch (error) {
      console.error("Error approving redemption:", error);
      toast({
        title: "Error",
        description: "Failed to approve redemption. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDenyRedemption = async (redemptionId: string, coinCost: number) => {
    if (!child) return;
    
    try {
      // Update redemption status to denied
      const { error: redemptionError } = await supabase
        .from("reward_redemptions")
        .update({ status: "denied" })
        .eq("id", redemptionId);

      if (redemptionError) throw redemptionError;

      // Refund coins to child
      const { error: coinError } = await supabase
        .from("children")
        .update({ coin_balance: child.coin_balance + coinCost })
        .eq("id", child.id);

      if (coinError) throw coinError;

      toast({
        title: "Redemption Denied",
        description: `${coinCost} coins have been refunded to ${child.name}.`,
      });

      fetchData();
    } catch (error) {
      console.error("Error denying redemption:", error);
      toast({
        title: "Error",
        description: "Failed to deny redemption. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="max-w-md mx-auto">
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

        {/* Tabs for Habits, Rewards, and Redemptions */}
        <Tabs defaultValue="habits" className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="mt-4">
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
                        <span className="text-lg flex-1">{habit.name}</span>
                        {!habit.is_active && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingHabit(habit)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingHabitId(habit.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            {rewards.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No rewards yet</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create rewards that {child.name} can redeem with Habit Coins!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 mb-4">
                {rewards.map((reward) => (
                  <Card key={reward.id} className="shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{reward.icon}</span>
                        <span className="text-lg flex-1">{reward.name}</span>
                        {!reward.is_active && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingReward(reward)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingRewardId(reward.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reward.description && (
                        <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                      )}
                      
                      <div className="flex items-center gap-1 text-sm">
                        <Coins className="w-4 h-4 text-warning" />
                        <span className="font-semibold text-warning">
                          {reward.coin_cost} coins
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <CreateRewardDialog childId={childId!} onRewardCreated={fetchData} />
          </TabsContent>

          <TabsContent value="redemptions" className="mt-4">
            {redemptions.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No redemptions yet</p>
                  <p className="text-sm text-muted-foreground">
                    {child.name} hasn't redeemed any rewards yet.
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
                          <p className="text-sm text-muted-foreground mb-2">
                            {redemption.reward.description}
                          </p>
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
                          
                          {/* Approve/Deny buttons for pending redemptions */}
                          {redemption.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-success hover:bg-success/90"
                                onClick={() => handleApproveRedemption(redemption.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDenyRedemption(redemption.id, redemption.reward.coin_cost)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          redemption.status === 'approved' 
                            ? 'bg-success/20 text-success' 
                            : redemption.status === 'denied'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-warning/20 text-warning'
                        }`}>
                          {redemption.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Habit Dialog */}
        {editingHabit && (
          <EditHabitDialog
            habit={editingHabit}
            steps={editingHabit.steps}
            open={!!editingHabit}
            onOpenChange={(open) => !open && setEditingHabit(null)}
            onHabitUpdated={fetchData}
          />
        )}

        {/* Edit Reward Dialog */}
        {editingReward && (
          <EditRewardDialog
            reward={editingReward}
            open={!!editingReward}
            onOpenChange={(open) => !open && setEditingReward(null)}
            onRewardUpdated={fetchData}
          />
        )}

        {/* Delete Habit Confirmation */}
        <AlertDialog open={!!deletingHabitId} onOpenChange={(open) => !open && setDeletingHabitId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Habit</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this habit? This will also delete all progress and steps. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingHabitId && handleDeleteHabit(deletingHabitId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Reward Confirmation */}
        <AlertDialog open={!!deletingRewardId} onOpenChange={(open) => !open && setDeletingRewardId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reward</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reward? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingRewardId && handleDeleteReward(deletingRewardId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ChildDetail;
