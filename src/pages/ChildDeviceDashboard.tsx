import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PinDialog } from "@/components/PinDialog";
import { Lock } from "lucide-react";

interface Child {
  id: string;
  name: string;
  age: number;
  avatar_url: string | null;
  coin_balance: number;
  current_streak: number;
}

const ChildDeviceDashboard = () => {
  const navigate = useNavigate();
  const { user, loading, setChildMode, hasPin, createPin, verifyPin, isChildMode } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<"create" | "verify">("create");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isChildMode) {
      // If logged in but not in child mode, redirect to parent dashboard
      navigate("/dashboard");
    }
  }, [user, loading, isChildMode, navigate]);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const fetchChildren = async () => {
    if (!user) return;

    setIsLoading(true);
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

    setIsLoading(false);
  };

  const handleChildSelect = (childId: string) => {
    navigate(`/child/${childId}`);
  };

  const handleExitChildMode = () => {
    if (!hasPin) {
      // If no PIN is set, prompt to create one
      setPinDialogMode("create");
      setShowPinDialog(true);
    } else {
      // If PIN exists, verify it
      setPinDialogMode("verify");
      setShowPinDialog(true);
    }
  };

  const handlePinSuccess = () => {
    setChildMode(false);
    navigate("/dashboard");
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-child flex items-center justify-center">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-child px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Who's using the device? 👤
          </h1>
          <p className="text-muted-foreground">Select your profile</p>
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <Card className="shadow-card mb-4 animate-fade-in-up">
            <CardContent className="p-8 text-center">
              <p className="text-foreground mb-2 font-semibold">No children added yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ask your parent to add children in parent mode
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 mb-8">
            {children.map((child, index) => (
              <Card
                key={child.id}
                className="shadow-card animate-fade-in-up cursor-pointer hover:shadow-glow transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleChildSelect(child.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-glow flex-shrink-0">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {child.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Age {child.age} • {child.coin_balance} coins • {child.current_streak} day streak
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Exit Child Mode */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleExitChildMode}
          >
            <Lock className="w-4 h-4 mr-2" />
            Exit Child Mode (Parent Access)
          </Button>
        </div>
      </div>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        mode={pinDialogMode}
        onSuccess={handlePinSuccess}
        onVerify={verifyPin}
        onCreate={createPin}
      />
    </div>
  );
};

export default ChildDeviceDashboard;
