import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Plus, Paperclip, Image as ImageIcon, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { usePro } from '@/hooks/use-pro';
import { db, Message } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';
import { useSettings, fetchWikipediaSummary, callLLM, generateChatTitle } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  activeChatId: number | null;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export function ChatInterface({ activeChatId, onNewChat, onOpenSettings }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isPro } = usePro();
  const { apiKey, provider, model } = useSettings();
  const { toast } = useToast();
  
  const messages = useLiveQuery(
    () => activeChatId ? db.messages.where('chatId').equals(activeChatId).toArray() : Promise.resolve([] as Message[]),
    [activeChatId]
  );
  
  // Keep scroll at bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !activeChatId) return;

    const userMessage = input;
    setInput('');
    
    await db.messages.add({
      chatId: activeChatId,
      content: userMessage,
      role: 'user',
      createdAt: new Date()
    });

    // Auto-rename chat if it's the first message or generic title
    if (messages?.length === 0) {
      // Small delay to let the UI settle
      setTimeout(async () => {
         const newTitle = await generateChatTitle(userMessage, apiKey, provider, model);
         await db.chats.update(activeChatId, { title: newTitle });
      }, 500);
    }

    setIsTyping(true);

    try {
      let finalResponse = "";
      
      // Construct history for context
      // We need to include the just-added user message which might not be in 'messages' live query yet
      // So we manually append it to the previous messages
      const history = (messages || []).map(m => ({
        role: m.role,
        content: m.content
      }));
      history.push({ role: 'user', content: userMessage });

      // 1. Check for API Key - The Real "Smart" Path
      if (apiKey) {
        const contextWindow = history.slice(-6); // Keep last 6 turns for context
        
        try {
          finalResponse = await callLLM(contextWindow, apiKey, provider, model);
        } catch (err: any) {
          finalResponse = `**Error calling AI Provider:** ${err.message}\n\nPlease check your API key in settings.`;
          toast({
             title: "AI Error",
             description: err.message,
             variant: "destructive"
          });
        }
      } 
      // 2. No API Key - Fallback to "Smart" Mock + Wikipedia with Context
      else {
        // Check if this is a follow-up question
        const isFollowUp = history.length > 1;
        let contextQuery = userMessage;

        // Simple context extraction logic for "it", "this", "that"
        if (isFollowUp) {
           const lastBotMsg = history[history.length - 2]?.content || "";
           const lowerMsg = userMessage.toLowerCase();
           
           if (lowerMsg.includes('it') || lowerMsg.includes('this') || lowerMsg.includes('relation')) {
             // Append previous context keyword to current query for Wikipedia
             // Very naive extraction: grab the first Noun Phrase from previous bot message? 
             // Or just append the previous user query? 
             // Let's try appending the previous user query if available
             const lastUserMsg = history[history.length - 3]?.content || ""; // -1 is current user, -2 is bot, -3 is prev user
             if (lastUserMsg) {
                contextQuery = `${lastUserMsg} ${userMessage}`;
             }
           }
        }

        // Try Wikipedia for factual queries
        const wikiSummary = await fetchWikipediaSummary(contextQuery);
        
        if (wikiSummary) {
          finalResponse = `**Source: Wikipedia**\n\n${wikiSummary}\n\n*Context used: "${contextQuery}"*\n*Add an API key in Settings for full conversational intelligence.*`;
        } else {
          // Standard Mock Responses
          const lowerMsg = userMessage.toLowerCase();
          if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            finalResponse = "Hello! I am your local AI assistant. I can search Wikipedia for you, or you can connect an API key (OpenAI/Gemini) in settings for full intelligence.";
          } else if (lowerMsg.includes('code')) {
            finalResponse = "I can display code, but to generate it, I need an API key. Connect OpenAI or Gemini in settings!\n\nExample:\n```javascript\nconsole.log('Connect API Key for real code');\n```";
          } else {
            finalResponse = "I couldn't find a direct answer on Wikipedia for that. \n\nTry being more specific or **Settings > Add API Key** to unlock full ChatGPT-level intelligence!";
          }
        }
      }

      await db.messages.add({
        chatId: activeChatId,
        content: finalResponse,
        role: 'assistant',
        createdAt: new Date()
      });

    } catch (error) {
      console.error(error);
      await db.messages.add({
        chatId: activeChatId,
        content: "Sorry, something went wrong processing your request.",
        role: 'assistant',
        createdAt: new Date()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]">
          <SparklesIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">AI Chat Pro</h1>
        <p className="text-gray-400 max-w-md mb-6 text-lg">
          Local-first, private AI. Connect your own keys for unlimited power.
        </p>
        
        {!apiKey && (
          <Button 
            onClick={onOpenSettings}
            variant="outline" 
            className="mb-8 border-primary/50 text-primary hover:bg-primary/10"
          >
            <KeyIcon className="mr-2 h-4 w-4" />
            Connect API Key
          </Button>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          {[
            "Who is the CEO of Microsoft?",
            "Explain Quantum Computing",
            "Write a Python script",
            "History of the Roman Empire"
          ].map((suggestion) => (
            <button 
              key={suggestion}
              onClick={async () => {
                await onNewChat();
                // We need a way to pass the initial message, but for now just start chat
              }}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-left text-sm text-gray-300 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages?.map((msg: Message) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isTyping && <MessageBubble role="assistant" content="" isTyping={true} />}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 pt-2">
        <div className="max-w-3xl mx-auto relative">
          <div className="glass-input rounded-3xl p-2 flex items-end gap-2 shadow-2xl">
            <Button size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 h-10 w-10 shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={apiKey ? "Ask anything..." : "Search Wikipedia or enter API key..."}
              className="min-h-[44px] max-h-[200px] bg-transparent border-none focus-visible:ring-0 resize-none py-3 px-2 text-base text-white placeholder:text-gray-500 flex-1 custom-scrollbar"
              rows={1}
            />
            
            <div className="flex items-center gap-1 pb-1">
               {/* Indicator for Search Mode vs AI Mode */}
               <div className="hidden sm:flex items-center mr-2">
                 {apiKey ? (
                   <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 font-medium">
                     {provider === 'perplexity' ? 'Perplexity' : 'AI Ready'}
                   </span>
                 ) : (
                   <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30 font-medium flex items-center gap-1">
                     <Globe className="h-3 w-3" /> Wiki Mode
                   </span>
                 )}
               </div>

              {isPro && (
                <Button size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 h-9 w-9">
                  <Mic className="h-5 w-5" />
                </Button>
              )}
              
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon" 
                className={cn(
                  "rounded-full h-9 w-9 transition-all",
                  input.trim() ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25" : "bg-white/10 text-gray-500"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-3">
             <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
               {apiKey ? "Using Local API Key" : "Free Mode (Wikipedia Only)"}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

