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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  coin_cost: number;
}

interface EditRewardDialogProps {
  reward: Reward;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRewardUpdated: () => void;
}

export const EditRewardDialog = ({ reward, open, onOpenChange, onRewardUpdated }: EditRewardDialogProps) => {
  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description || "");
  const [icon, setIcon] = useState(reward.icon);
  const [coinCost, setCoinCost] = useState(reward.coin_cost);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(reward.name);
    setDescription(reward.description || "");
    setIcon(reward.icon);
    setCoinCost(reward.coin_cost);
  }, [reward]);

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

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("rewards")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          icon: icon,
          coin_cost: coinCost,
        })
        .eq("id", reward.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reward updated successfully!",
      });

      onOpenChange(false);
      onRewardUpdated();
    } catch (error) {
      console.error("Error updating reward:", error);
      toast({
        title: "Error",
        description: "Failed to update reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Reward</DialogTitle>
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
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Reward"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
