import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, GripVertical, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  frequency: string;
  coins_per_completion: number;
  times_per_period: number;
  cooldown_minutes: number;
  allowed_days: string[] | null;
}

interface Step {
  id?: string;
  name: string;
  order_index: number;
  tempId?: string;
}

interface EditHabitDialogProps {
  habit: Habit;
  steps: Step[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHabitUpdated: () => void;
}

const DAYS_OF_WEEK = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export const EditHabitDialog = ({ habit, steps: initialSteps, open, onOpenChange, onHabitUpdated }: EditHabitDialogProps) => {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || "");
  const [icon, setIcon] = useState(habit.icon);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [timesPerPeriod, setTimesPerPeriod] = useState(habit.times_per_period || 1);
  const [cooldownMinutes, setCooldownMinutes] = useState(habit.cooldown_minutes || 60);
  const [allowedDays, setAllowedDays] = useState<string[]>(habit.allowed_days || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  const [coinsPerCompletion, setCoinsPerCompletion] = useState(habit.coins_per_completion.toString());
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [newStepName, setNewStepName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(habit.name);
    setDescription(habit.description || "");
    setIcon(habit.icon);
    setFrequency(habit.frequency);
    setTimesPerPeriod(habit.times_per_period || 1);
    setCooldownMinutes(habit.cooldown_minutes || 60);
    setAllowedDays(habit.allowed_days || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    setCoinsPerCompletion(habit.coins_per_completion.toString());
    setSteps(initialSteps);
  }, [habit, initialSteps]);

  const toggleDay = (day: string) => {
    if (allowedDays.includes(day)) {
      setAllowedDays(allowedDays.filter(d => d !== day));
    } else {
      setAllowedDays([...allowedDays, day]);
    }
  };

  const addStep = () => {
    if (newStepName.trim()) {
      setSteps([...steps, { name: newStepName.trim(), order_index: steps.length, tempId: Date.now().toString() }]);
      setNewStepName("");
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < steps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a habit name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update habit
      const { error: habitError } = await supabase
        .from("habits")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          icon: icon,
          frequency: frequency,
          times_per_period: timesPerPeriod,
          cooldown_minutes: timesPerPeriod > 1 ? cooldownMinutes : 0,
          allowed_days: frequency === "custom" ? allowedDays : null,
          coins_per_completion: parseInt(coinsPerCompletion) || 1,
        })
        .eq("id", habit.id);

      if (habitError) throw habitError;

      // Delete existing steps
      const { error: deleteError } = await supabase
        .from("habit_steps")
        .delete()
        .eq("habit_id", habit.id);

      if (deleteError) throw deleteError;

      // Create new steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((step, index) => ({
          habit_id: habit.id,
          name: step.name,
          order_index: index,
        }));

        const { error: stepsError } = await supabase
          .from("habit_steps")
          .insert(stepsToInsert);

        if (stepsError) throw stepsError;
      }

      toast({
        title: "Success",
        description: "Habit updated successfully!",
      });

      onOpenChange(false);
      onHabitUpdated();
    } catch (error) {
      console.error("Error updating habit:", error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Brush teeth"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this habit involve?"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="icon">Icon/Emoji</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="⭐"
                maxLength={4}
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "custom" && (
            <div>
              <Label className="mb-2 block">Select Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                      allowedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border hover:bg-muted/80"
                    }`}
                  >
                    <Checkbox
                      checked={allowedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timesPerPeriod">Times per {frequency === "weekly" ? "week" : "day"}</Label>
              <Select 
                value={timesPerPeriod.toString()} 
                onValueChange={(v) => {
                  const newValue = parseInt(v);
                  setTimesPerPeriod(newValue);
                  // Auto-set cooldown when enabling multi-completion
                  if (newValue > 1 && cooldownMinutes === 0) {
                    setCooldownMinutes(60); // Default to 1 hour
                  }
                }}
              >
                <SelectTrigger id="timesPerPeriod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 time</SelectItem>
                  <SelectItem value="2">2 times</SelectItem>
                  <SelectItem value="3">3 times</SelectItem>
                  <SelectItem value="4">4 times</SelectItem>
                  <SelectItem value="5">5 times</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="coins">Coins Per Completion</Label>
              <Input
                id="coins"
                type="number"
                value={coinsPerCompletion}
                onChange={(e) => setCoinsPerCompletion(e.target.value)}
                min={1}
                max={1000}
                placeholder="e.g., 5"
              />
            </div>
          </div>

          {timesPerPeriod > 1 && frequency !== "weekly" && (
            <div>
              <Label htmlFor="cooldown">Cooldown Between Completions</Label>
              <Select value={cooldownMinutes.toString()} onValueChange={(v) => setCooldownMinutes(parseInt(v))}>
                <SelectTrigger id="cooldown">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="360">6 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Child must wait this long between completing this habit
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <Label className="mb-2 block">Habit Steps (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add sequential steps that need to be completed
            </p>

            <div className="flex gap-2 mb-3">
              <Input
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                placeholder="e.g., Wet toothbrush"
                maxLength={200}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addStep())}
              />
              <Button type="button" onClick={addStep} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id || step.tempId}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                      >
                        <GripVertical className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                      >
                        <GripVertical className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-sm">{step.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
