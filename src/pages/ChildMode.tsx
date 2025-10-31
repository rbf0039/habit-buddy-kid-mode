import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Star, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import coinImage from "@/assets/habit-coin.png";
import badgeImage from "@/assets/achievement-badge.png";

const ChildMode = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  // Mock data - will be replaced with real data from Lovable Cloud
  const [habits, setHabits] = useState([
    {
      id: 1,
      name: "Brush Teeth",
      icon: "🦷",
      steps: [
        { id: 1, text: "Get toothbrush ready", completed: true },
        { id: 2, text: "Brush for 2 minutes", completed: true },
        { id: 3, text: "Rinse and clean up", completed: false },
      ],
      coins: 10,
    },
    {
      id: 2,
      name: "Make Bed",
      icon: "🛏️",
      steps: [
        { id: 1, text: "Pull up blanket", completed: false },
        { id: 2, text: "Arrange pillows", completed: false },
      ],
      coins: 5,
    },
    {
      id: 3,
      name: "Pack Backpack",
      icon: "🎒",
      steps: [
        { id: 1, text: "Check homework", completed: false },
        { id: 2, text: "Add lunch box", completed: false },
        { id: 3, text: "Put by door", completed: false },
      ],
      coins: 15,
    },
  ]);

  const totalCoins = 125; // Mock total
  const streak = 7; // Mock streak

  const toggleStep = (habitId: number, stepId: number) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        return {
          ...habit,
          steps: habit.steps.map(step =>
            step.id === stepId ? { ...step, completed: !step.completed } : step
          ),
        };
      }
      return habit;
    }));
  };

  const completedHabitsCount = habits.filter(h => 
    h.steps.every(s => s.completed)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-child">
      {/* Header */}
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
                <span className="text-xl">👦</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Emma's Habits</h1>
                <p className="text-xs text-muted-foreground">Keep going! 🌟</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                // TODO: Implement PIN verification
                navigate("/dashboard");
              }}
            >
              <Lock className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in-up">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2">
                <img src={coinImage} alt="Coins" className="w-full h-full object-contain animate-bounce-gentle" />
              </div>
              <p className="font-bold text-xl text-secondary">{totalCoins}</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Star className="w-8 h-8 text-highlight fill-highlight animate-pulse" />
              </div>
              <p className="font-bold text-xl text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2">
                <img src={badgeImage} alt="Badges" className="w-full h-full object-contain" />
              </div>
              <p className="font-bold text-xl text-foreground">{completedHabitsCount}</p>
              <p className="text-xs text-muted-foreground">Done Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Habits List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            Today's Tasks 📋
          </h2>

          {habits.map((habit, habitIndex) => {
            const allCompleted = habit.steps.every(s => s.completed);
            
            return (
              <Card
                key={habit.id}
                className={`shadow-soft transition-all duration-300 animate-fade-in-up ${
                  allCompleted ? 'bg-gradient-success' : ''
                }`}
                style={{ animationDelay: `${habitIndex * 0.1}s` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{habit.icon}</span>
                      <div>
                        <h3 className={`font-bold text-lg ${allCompleted ? 'text-accent-foreground' : 'text-foreground'}`}>
                          {habit.name}
                        </h3>
                        <p className={`text-sm flex items-center gap-1 ${
                          allCompleted ? 'text-accent-foreground/80' : 'text-muted-foreground'
                        }`}>
                          <img src={coinImage} alt="Coins" className="w-4 h-4" />
                          {habit.coins} coins
                        </p>
                      </div>
                    </div>
                    {allCompleted && (
                      <div className="bg-accent-foreground rounded-full p-2 animate-celebrate">
                        <Check className="w-6 h-6 text-accent" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {habit.steps.map((step) => (
                      <Button
                        key={step.id}
                        variant={step.completed ? "success" : "outline"}
                        size="lg"
                        className={`w-full justify-start text-left font-semibold ${
                          step.completed ? 'animate-wiggle' : ''
                        }`}
                        onClick={() => toggleStep(habit.id, step.id)}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                          step.completed 
                            ? 'bg-accent-foreground border-accent-foreground' 
                            : 'border-border bg-background'
                        }`}>
                          {step.completed && (
                            <Check className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        <span className={step.completed ? 'line-through opacity-75' : ''}>
                          {step.text}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Encouragement Message */}
        {completedHabitsCount === habits.length && (
          <Card className="mt-8 bg-gradient-reward shadow-glow animate-celebrate">
            <CardContent className="py-8 text-center">
              <span className="text-6xl mb-4 block">🎉</span>
              <h3 className="text-2xl font-bold text-secondary-foreground mb-2">
                Amazing Job!
              </h3>
              <p className="text-secondary-foreground/90">
                You completed all your habits today!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ChildMode;
