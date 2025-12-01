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

export const EditHabitDialog = ({ habit, steps: initialSteps, open, onOpenChange, onHabitUpdated }: EditHabitDialogProps) => {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || "");
  const [icon, setIcon] = useState(habit.icon);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [coinsPerCompletion, setCoinsPerCompletion] = useState(habit.coins_per_completion);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [newStepName, setNewStepName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(habit.name);
    setDescription(habit.description || "");
    setIcon(habit.icon);
    setFrequency(habit.frequency);
    setCoinsPerCompletion(habit.coins_per_completion);
    setSteps(initialSteps);
  }, [habit, initialSteps]);

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
          coins_per_completion: coinsPerCompletion,
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
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="coins">Coins Per Completion</Label>
            <Input
              id="coins"
              type="number"
              value={coinsPerCompletion}
              onChange={(e) => setCoinsPerCompletion(parseInt(e.target.value) || 0)}
              min={1}
              max={1000}
            />
          </div>

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
