import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Settings, Crown, Search, Menu, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createChat, Chat } from '@/lib/db';
import { usePro } from '@/hooks/use-pro';

interface SidebarProps {
  activeChatId: number | null;
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
  onOpenPro: () => void;
  onOpenSettings?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ 
  activeChatId, 
  onSelectChat, 
  onNewChat, 
  onOpenPro,
  onOpenSettings,
  isOpen,
  setIsOpen
}: SidebarProps) {
  const { isPro } = usePro();
  const chats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().toArray());
  const [search, setSearch] = useState('');
  
  // ... rest of component ...


  const filteredChats = chats?.filter((c: Chat) => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteChat = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await db.chats.delete(id);
    await db.messages.where('chatId').equals(id).delete();
    if (activeChatId === id) {
      onSelectChat(0); // Clear selection (will likely need handling in parent)
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0A0A0F] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between md:hidden">
            <span className="font-bold text-lg">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Button 
            onClick={() => { onNewChat(); if(window.innerWidth < 768) setIsOpen(false); }}
            className="w-full justify-start gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 h-11 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="font-medium">New Chat</span>
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 p-2">
            {!filteredChats?.length ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No chats found
              </div>
            ) : (
              filteredChats.map((chat: Chat) => (
                <div
                  key={chat.id}
                  onClick={() => { onSelectChat(chat.id!); if(window.innerWidth < 768) setIsOpen(false); }}
                  className={cn(
                    "group flex items-center justify-between w-full p-3 rounded-lg text-sm text-left transition-all cursor-pointer",
                    activeChatId === chat.id 
                      ? "bg-white/10 text-white font-medium shadow-sm" 
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className={cn("h-4 w-4 shrink-0", activeChatId === chat.id ? "text-primary" : "text-gray-600")} />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    onClick={(e) => handleDeleteChat(e, chat.id!)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer / Pro Section */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {!isPro && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-primary rounded-md">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Free Plan</span>
                </div>
                <span className="text-[10px] text-gray-400">{chats?.length || 0}/100</span>
              </div>
              <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${Math.min(((chats?.length || 0) / 100) * 100, 100)}%` }} 
                />
              </div>
              <Button 
                onClick={onOpenPro}
                variant="ghost" 
                className="w-full mt-3 h-7 text-xs hover:bg-primary hover:text-white transition-colors"
              >
                Upgrade to Pro
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors" onClick={onOpenSettings}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
              US
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-gray-500 truncate">{isPro ? 'Pro Member' : 'Free Tier'}</p>
            </div>
            <Settings className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </>
  );
}
