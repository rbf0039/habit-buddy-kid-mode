import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Lock, Globe, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [timezone, setTimezone] = useState("America/New_York");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .single();

      if (data?.timezone) {
        setTimezone(data.timezone);
      }
    };

    fetchProfile();
  }, [user]);

  const handleTimezoneChange = async (value: string) => {
    setTimezone(value);
    setIsSavingTimezone(true);

    const { error } = await supabase
      .from("profiles")
      .update({ timezone: value })
      .eq("id", user!.id);

    setIsSavingTimezone(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save timezone.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Timezone updated successfully.",
      });
    }
  };

  const handleSessionError = (error: any) => {
    // Check for session-related errors
    if (error?.message?.includes("session") || 
        error?.code === "session_not_found" ||
        error?.message?.includes("Auth session missing")) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      // Force logout and redirect
      setTimeout(() => {
        localStorage.removeItem("sb-nfwbigpwjcurpchczwib-auth-token");
        window.location.href = "/auth";
      }, 1500);
      return true;
    }
    return false;
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    setIsLoading(false);

    if (error) {
      if (!handleSessionError(error)) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Confirmation Sent",
        description: "Please check both your old and new email addresses to confirm the change.",
      });
      setNewEmail("");
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsLoading(false);

    if (error) {
      if (!handleSessionError(error)) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (loading) {
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
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Dark Mode Toggle */}
          <Card className="shadow-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card className="shadow-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Timezone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Used for habit completion countdown timing
              </p>
              <Select value={timezone} onValueChange={handleTimezoneChange} disabled={isSavingTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Change Email */}
          <Card className="shadow-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Change Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current: {user?.email}
              </p>
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={handleEmailChange}
                disabled={isLoading || !newEmail.trim()}
                className="w-full"
              >
                Update Email
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="shadow-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full"
              >
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
