import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "verify";
  onSuccess: () => void;
  onVerify?: (pin: string) => Promise<boolean>;
  onCreate?: (pin: string) => Promise<{ error: any }>;
}

export const PinDialog = ({
  open,
  onOpenChange,
  mode,
  onSuccess,
  onVerify,
  onCreate,
}: PinDialogProps) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (mode === "create") {
      if (pin.length < 4) {
        toast({
          title: "Invalid PIN",
          description: "PIN must be at least 4 digits",
          variant: "destructive",
        });
        return;
      }

      if (pin !== confirmPin) {
        toast({
          title: "PINs don't match",
          description: "Please make sure both PINs are the same",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const { error } = await onCreate?.(pin);
      setIsLoading(false);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create PIN",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "PIN created successfully",
      });
      
      setPin("");
      setConfirmPin("");
      onSuccess();
      onOpenChange(false);
    } else {
      if (pin.length < 4) {
        toast({
          title: "Invalid PIN",
          description: "Please enter your PIN",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const isValid = await onVerify?.(pin);
      setIsLoading(false);

      if (!isValid) {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect",
          variant: "destructive",
        });
        setPin("");
        return;
      }

      setPin("");
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create PIN" : "Enter PIN"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a PIN to protect parent mode access"
              : "Enter your PIN to access parent mode"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {mode === "create" && (
            <div>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {mode === "create" ? "Create PIN" : "Verify PIN"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
