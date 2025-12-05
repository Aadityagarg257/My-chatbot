import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export function SubscriptionModal({ open, onOpenChange, onUpgrade }: SubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-primary/20 bg-black/80 text-white sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            You've reached the free limit of 100 chats. Unlock unlimited power for just ₹99 lifetime.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            {[
              "Unlimited Chats & Messages",
              "Priority Response Time",
              "Advanced AI Models (GPT-4 Style)",
              "Voice Input & Output",
              "Exclusive Glass Themes"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 p-3">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm text-gray-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2 sm:space-y-0">
          <Button 
            className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-lg font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02]"
            onClick={onUpgrade}
          >
            Pay ₹99 Lifetime Access
          </Button>
          <p className="text-center text-xs text-gray-500 mt-4">
            Secured by Razorpay • UPI / Card / Netbanking
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
