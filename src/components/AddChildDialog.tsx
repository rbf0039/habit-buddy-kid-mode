import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const AddChildDialog = ({ onChildAdded }: { onChildAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("children")
      .insert({
        parent_id: user.id,
        name: name,
        age: parseInt(age),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add child. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `${name} has been added to your family.`,
      });
      setName("");
      setAge("");
      setOpen(false);
      onChildAdded();
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="w-full">
          <Plus className="w-5 h-5 mr-2" />
          Add Child
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Child</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="child-name">Child's Name</Label>
            <Input
              id="child-name"
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="child-age">Age</Label>
            <Input
              id="child-age"
              type="number"
              min="6"
              max="12"
              placeholder="6-12"
              value={age}
              onChange={(e) => setAge(e.target.value)}
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
            {isLoading ? "Adding..." : "Add Child"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};