import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateRewardDialogProps {
  childId: string;
  onRewardCreated: () => void;
}

export const CreateRewardDialog = ({ childId, onRewardCreated }: CreateRewardDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [coinCost, setCoinCost] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("🎁");
    setCoinCost(50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reward name.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      // Create reward linked to parent and specific child
      const { error } = await supabase
        .from("rewards")
        .insert({
          parent_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          icon: icon,
          coin_cost: coinCost,
          child_id: childId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reward created successfully!",
      });

      resetForm();
      setOpen(false);
      onRewardCreated();
    } catch (error) {
      console.error("Error creating reward:", error);
      toast({
        title: "Error",
        description: "Failed to create reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full" variant="secondary">
          <Plus className="w-4 h-4 mr-2" />
          Create New Reward
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Reward</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Reward Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Extra screen time"
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this reward include?"
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
                placeholder="🎁"
                maxLength={4}
              />
            </div>

            <div>
              <Label htmlFor="coins">Coin Cost</Label>
              <Input
                id="coins"
                type="number"
                value={coinCost}
                onChange={(e) => setCoinCost(parseInt(e.target.value) || 0)}
                min={1}
                max={10000}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Reward"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
