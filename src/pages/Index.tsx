import { Button } from "@/components/ui/button";
import { Star, Trophy, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import heroImage from "@/assets/hero-illustration.jpg";
import coinImage from "@/assets/habit-coin.png";
import badgeImage from "@/assets/achievement-badge.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, isChildMode } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to appropriate dashboard
      if (isChildMode) {
        navigate("/child-device");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, isChildMode, navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-child">
      {/* Hero Section */}
      <header className="px-6 py-8 max-w-md mx-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary animate-bounce-gentle" />
            HabitBuddy
          </h1>
          <p className="text-lg text-muted-foreground">
            Help your kids build amazing habits!
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-card mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <img 
            src={heroImage} 
            alt="Happy children celebrating achievements" 
            className="w-full h-auto"
          />
        </div>

        <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Button variant="default" size="lg" className="w-full" onClick={() => navigate("/auth")}>
            Get Started as a Parent
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
            View Demo Dashboard
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="px-6 py-12 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          How It Works
        </h2>

        <div className="space-y-6">
          {/* Feature 1 */}
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:scale-105">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-primary p-3 rounded-xl shadow-soft flex-shrink-0">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Create Habits</h3>
                <p className="text-muted-foreground text-sm">
                  Parents set up daily habits broken into simple, easy steps for kids to follow.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:scale-105">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <img src={coinImage} alt="Habit coins" className="w-full h-full object-contain animate-bounce-gentle" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Earn Rewards</h3>
                <p className="text-muted-foreground text-sm">
                  Kids earn Habit Coins by completing tasks and can trade them for real-world rewards!
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:scale-105">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <img src={badgeImage} alt="Achievement badges" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Unlock Badges</h3>
                <p className="text-muted-foreground text-sm">
                  Celebrate milestones with digital badges and watch progress grow with visual streaks!
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:scale-105">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-success p-3 rounded-xl shadow-soft flex-shrink-0">
                <Trophy className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Child Mode</h3>
                <p className="text-muted-foreground text-sm">
                  Kids enjoy a safe, simple interface with fun animations while parents manage everything.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-12 max-w-md mx-auto">
        <div className="bg-gradient-primary rounded-3xl p-8 shadow-glow text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/90 mb-6">
            Join families building better habits together!
          </p>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate("/auth")}>
            Sign Up Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>© 2025 HabitBuddy. Helping families grow together.</p>
      </footer>
    </div>
  );
};

export default Index;
