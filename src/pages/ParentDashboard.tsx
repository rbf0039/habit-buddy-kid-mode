import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Settings, Baby, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ParentDashboard = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real data from Lovable Cloud
  const children = [
    { id: 1, name: "Emma", age: 8, habits: 5, coins: 125 },
    { id: 2, name: "Noah", age: 6, habits: 3, coins: 87 },
  ];

  return (
    <div className="min-h-screen bg-gradient-child">
      {/* Header */}
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Parent Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back, Parent! 👋
          </h2>
          <p className="text-muted-foreground">
            Manage your children's habits and track their progress
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Button variant="default" className="h-24 flex-col gap-2">
            <Plus className="w-6 h-6" />
            Add Child
          </Button>
          <Button variant="secondary" className="h-24 flex-col gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </Button>
        </div>

        {/* Children List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Your Children
            </h3>
          </div>

          {children.map((child, index) => (
            <Card
              key={child.id}
              className="shadow-soft hover:shadow-card transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              onClick={() => navigate(`/child/${child.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
                      <Baby className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <CardDescription>{child.age} years old</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-muted-foreground">Habits</p>
                      <p className="font-bold text-lg text-foreground">{child.habits}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coins</p>
                      <p className="font-bold text-lg text-secondary">{child.coins}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {children.length === 0 && (
            <Card className="shadow-soft animate-fade-in-up">
              <CardContent className="py-12 text-center">
                <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No children added yet
                </p>
                <Button variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Child
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 bg-gradient-success shadow-glow animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-accent-foreground">💡 Quick Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-accent-foreground/90 text-sm">
              Start with 2-3 simple habits per child. Consistency is more important than quantity!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ParentDashboard;
