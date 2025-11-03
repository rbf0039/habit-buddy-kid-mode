import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Target, Award, TrendingUp, Users, LogOut, Smartphone } from "lucide-react";
import { AddChildDialog } from "@/components/AddChildDialog";
import { PinDialog } from "@/components/PinDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Child {
  id: string;
  name: string;
  age: number;
  coin_balance: number;
  current_streak: number;
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading, setChildMode, hasPin, createPin } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [showPinDialog, setShowPinDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Redirect if in child mode
  useEffect(() => {
    if (!loading && user) {
      const childMode = localStorage.getItem("childMode");
      if (childMode === "true") {
        navigate("/child-device");
      }
    }
  }, [user, loading, navigate]);

  const fetchChildren = async () => {
    if (!user) return;
    
    setIsLoadingChildren(true);
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load children.",
        variant: "destructive",
      });
    } else {
      setChildren(data || []);
    }
    setIsLoadingChildren(false);
  };

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSwitchToChildMode = () => {
    if (!hasPin) {
      // If no PIN is set, prompt to create one first
      setShowPinDialog(true);
    } else {
      // If PIN exists, go directly to child device mode
      setChildMode(true);
      navigate("/child-device");
    }
  };

  const handlePinCreated = () => {
    setChildMode(true);
    navigate("/child-device");
  };

  if (loading || isLoadingChildren) {
    return (
      <div className="min-h-screen bg-gradient-parent flex items-center justify-center">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-parent px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Parent Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your children's habits</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium text-foreground">Habits</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-secondary/20">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <p className="text-xs font-medium text-foreground">Rewards</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-success/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
              <p className="text-xs font-medium text-foreground">Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Children List */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Children
          </h2>

          {children.length === 0 ? (
            <Card className="shadow-card mb-4">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No children added yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first child to begin tracking their habits!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {children.map((child, index) => (
                <Card
                  key={child.id}
                  className="shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  onClick={() => navigate(`/child/${child.id}/manage`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{child.name}</h3>
                        <p className="text-sm text-muted-foreground">Age {child.age}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-glow">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-warning/10 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-warning">{child.coin_balance}</p>
                        <p className="text-xs text-muted-foreground">Habit Coins</p>
                      </div>
                      <div className="bg-success/10 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-success">{child.current_streak}</p>
                        <p className="text-xs text-muted-foreground">Day Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Child Button */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <AddChildDialog onChildAdded={fetchChildren} />
          
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleSwitchToChildMode}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Switch to Child Device Mode
          </Button>
        </div>

        {/* Quick Tip */}
        <Card className="mt-6 shadow-card border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary mb-1">💡 Quick Tip</p>
            <p className="text-sm text-foreground">
              Consistency is key! Help your children build lasting habits by celebrating small wins daily.
            </p>
          </CardContent>
        </Card>
      </div>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        mode="create"
        onSuccess={handlePinCreated}
        onCreate={createPin}
      />
    </div>
  );
};

export default ParentDashboard;
