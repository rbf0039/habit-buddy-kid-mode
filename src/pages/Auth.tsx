import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [isLoading, setIsLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signIn, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!privacyAccepted || !termsAccepted) {
      toast({
        title: "Error",
        description: "Please accept the Privacy Policy and Terms of Service to continue.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, name);

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to HabitBuddy!",
        description: "Your account has been created successfully.",
      });
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-child flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-bounce-gentle" />
            <h1 className="text-3xl font-bold text-foreground">HabitBuddy</h1>
          </div>
          <p className="text-muted-foreground">Parent Dashboard Access</p>
        </div>

        <Card className="shadow-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create an account or sign in to manage your children's habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      name="email"
                      type="email"
                      placeholder="parent@example.com"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input
                      id="password-signin"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-signup">Parent Name</Label>
                    <Input
                      id="name-signup"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      name="email"
                      type="email"
                      placeholder="parent@example.com"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">Confirm Password</Label>
                    <Input
                      id="password-confirm"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="h-12"
                    />
                  </div>

                  {/* Legal Agreements */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="privacy-policy"
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="privacy-policy" className="text-sm leading-relaxed cursor-pointer">
                        I have read and agree to the{" "}
                        <Link to="/privacy" className="text-primary underline hover:text-primary/80">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms-of-service"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms-of-service" className="text-sm leading-relaxed cursor-pointer">
                        I have read and agree to the{" "}
                        <Link to="/terms" className="text-primary underline hover:text-primary/80">
                          Terms of Service
                        </Link>
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
