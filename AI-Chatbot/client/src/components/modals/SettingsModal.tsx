import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Settings, Key, ShieldCheck } from "lucide-react";
import { useSettings } from "@/lib/api";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { apiKey, provider, model, saveSettings } = useSettings();
  const [localKey, setLocalKey] = useState(apiKey);
  const [localProvider, setLocalProvider] = useState(provider);
  const [localModel, setLocalModel] = useState(model);

  useEffect(() => {
    setLocalKey(apiKey);
    setLocalProvider(provider);
    setLocalModel(model);
  }, [apiKey, provider, model, open]);

  const handleSave = () => {
    saveSettings(localKey, localProvider, localModel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 bg-black/90 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-white/10">
              <Settings className="h-5 w-5 text-gray-300" />
            </div>
            <DialogTitle>Intelligence Settings</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            Connect your own API key to enable real-time, smart responses. 
            Keys are stored 100% locally on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select 
              value={localProvider} 
              onValueChange={(v: any) => {
                setLocalProvider(v);
                // Reset model default when provider changes
                if (v === 'openai') setLocalModel('gpt-4o-mini');
                if (v === 'perplexity') setLocalModel('llama-3.1-sonar-small-128k-online');
                if (v === 'gemini') setLocalModel('gemini-1.5-flash');
              }}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E2E] border-white/10 text-white">
                <SelectItem value="openai">OpenAI (GPT-4 / GPT-3.5)</SelectItem>
                <SelectItem value="perplexity">Perplexity (Real-time Search)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Input 
              value={localModel} 
              onChange={(e) => setLocalModel(e.target.value)}
              className="bg-white/5 border-white/10 text-white" 
              placeholder="e.g. gpt-4o"
            />
            <p className="text-[10px] text-gray-500">
              Recommended: {localProvider === 'openai' ? 'gpt-4o-mini' : localProvider === 'perplexity' ? 'llama-3.1-sonar-large-128k-online' : 'gemini-1.5-flash'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white font-mono"
                placeholder={`sk-...`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 border border-green-500/20">
            <ShieldCheck className="h-4 w-4 text-green-400" />
            <p className="text-xs text-green-300">
              Your key never leaves your browser except to call the API directly.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
