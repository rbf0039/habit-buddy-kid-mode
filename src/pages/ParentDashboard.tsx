import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, LogOut, Smartphone, Pencil, Bell, ArrowLeft } from "lucide-react";
import { AddChildDialog } from "@/components/AddChildDialog";
import { EditChildDialog } from "@/components/EditChildDialog";
import { PinDialog } from "@/components/PinDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Child {
  id: string;
  name: string;
  avatar_url: string | null;
  coin_balance: number;
  current_streak: number;
}

interface PendingCounts {
  [childId: string]: number;
}

const DEMO_CHILDREN: Child[] = [
  { id: "demo-1", name: "Emma", avatar_url: null, coin_balance: 42, current_streak: 7 },
  { id: "demo-2", name: "Liam", avatar_url: null, coin_balance: 28, current_streak: 3 },
];

const DEMO_PENDING: PendingCounts = { "demo-1": 2 };

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user, signOut, loading, setChildMode, hasPin, createPin } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({});

  useEffect(() => {
    if (!isDemo && !loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate, isDemo]);

  // Redirect if in child mode
  useEffect(() => {
    if (!isDemo && !loading && user) {
      const childMode = localStorage.getItem("childMode");
      if (childMode === "true") {
        navigate("/child-device");
      }
    }
  }, [user, loading, navigate, isDemo]);

  const fetchChildren = async () => {
    if (isDemo) {
      setChildren(DEMO_CHILDREN);
      setPendingCounts(DEMO_PENDING);
      setIsLoadingChildren(false);
      return;
    }
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
      // Fetch pending redemption counts for each child
      if (data && data.length > 0) {
        fetchPendingCounts(data.map(c => c.id));
      }
    }
    setIsLoadingChildren(false);
  };

  const fetchPendingCounts = async (childIds: string[]) => {
    const { data, error } = await supabase
      .from("reward_redemptions")
      .select("child_id")
      .in("child_id", childIds)
      .eq("status", "pending");

    if (!error && data) {
      const counts: PendingCounts = {};
      data.forEach(redemption => {
        counts[redemption.child_id] = (counts[redemption.child_id] || 0) + 1;
      });
      setPendingCounts(counts);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user, isDemo]);

  // Real-time subscription for pending redemptions
  useEffect(() => {
    if (!user || children.length === 0) return;

    const childIds = children.map(c => c.id);
    
    const channel = supabase
      .channel('pending-redemptions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_redemptions',
        },
        (payload) => {
          // Refresh counts when any redemption changes
          if (payload.new && childIds.includes((payload.new as any).child_id)) {
            fetchPendingCounts(childIds);
          }
          if (payload.old && childIds.includes((payload.old as any).child_id)) {
            fetchPendingCounts(childIds);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, children]);

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

  if (loading && !isDemo) {
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
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {isDemo ? "Demo Dashboard" : "Parent Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isDemo ? "Explore with sample data" : "Manage your children's habits"}
            </p>
          </div>
          <div className="flex gap-2">
            {isDemo ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>


        {/* Children List */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isDemo ? "Sample Children" : "Your Children"}
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
                  className="shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => navigate(isDemo ? `/child/${child.id}/manage?demo=true` : `/child/${child.id}/manage`)}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                            <AvatarFallback className="bg-gradient-primary text-white font-bold">
                              {child.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {pendingCounts[child.id] > 0 && (
                            <Badge 
                              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs animate-pulse"
                            >
                              {pendingCounts[child.id]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-lg font-bold text-foreground">{child.name}</h3>
                          {pendingCounts[child.id] > 0 && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              {pendingCounts[child.id]} pending approval{pendingCounts[child.id] > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {!isDemo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChild(child);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div 
                      className="grid grid-cols-2 gap-4 cursor-pointer"
                      onClick={() => navigate(isDemo ? `/child/${child.id}/manage?demo=true` : `/child/${child.id}/manage`)}
                    >
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

        {/* Action Buttons */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {isDemo ? (
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => navigate("/auth?tab=signup")}
            >
              Sign Up to Get Started
            </Button>
          ) : (
            <>
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
            </>
          )}
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

      {editingChild && (
        <EditChildDialog
          open={!!editingChild}
          onOpenChange={(open) => !open && setEditingChild(null)}
          child={editingChild}
          onChildUpdated={fetchChildren}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
