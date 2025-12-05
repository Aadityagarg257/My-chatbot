import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { db, createChat } from '@/lib/db';
import { usePro } from '@/hooks/use-pro';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isPro, upgradeToPro } = usePro();
  const { toast } = useToast();
  
  const chats = useLiveQuery(() => db.chats.toArray());

  const handleNewChat = async () => {
    const chatCount = chats?.length || 0;
    
    if (!isPro && chatCount >= 100) {
      setIsProModalOpen(true);
      return;
    }

    const id = await createChat(`Chat ${chatCount + 1}`);
    setActiveChatId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleUpgrade = () => {
    // Mock Razorpay Payment
    const options = {
      key: "rzp_test_mock_key",
      amount: 9900, // ₹99
      currency: "INR",
      name: "AI Chat Pro",
      description: "Lifetime Pro Access",
      handler: function (response: any) {
        upgradeToPro();
        setIsProModalOpen(false);
        toast({
          title: "Welcome to Pro!",
          description: "You now have unlimited access.",
          className: "bg-primary text-white border-none"
        });
      }
    };

    // Simulate payment success
    setTimeout(() => {
       options.handler({ razorpay_payment_id: "pay_mock_123" });
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar 
        activeChatId={activeChatId} 
        onSelectChat={setActiveChatId} 
        onNewChat={handleNewChat}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-background/50 backdrop-blur-3xl">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold">AI Chat Pro</span>
        </div>

        <ChatInterface 
          activeChatId={activeChatId} 
          onNewChat={handleNewChat} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      <SubscriptionModal 
        open={isProModalOpen} 
        onOpenChange={setIsProModalOpen}
        onUpgrade={handleUpgrade}
      />

      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  );
}
