import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export function MessageBubble({ role, content, isTyping }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-lg",
          isUser 
            ? "bg-white/10 border-white/20 text-white" 
            : "bg-primary border-primary/50 text-white"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message Content */}
        <div className={cn(
          "relative px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden",
          isUser 
            ? "bg-white/10 text-white rounded-tr-sm border border-white/10" 
            : "glass-panel text-gray-100 rounded-tl-sm"
        )}>
          {isTyping ? (
            <div className="flex space-x-1 h-6 items-center">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    return !inline ? (
                      <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                          <span className="text-xs text-gray-400 font-mono">code</span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <code className="text-sm font-mono text-gray-200" {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <code className="bg-white/10 rounded px-1.5 py-0.5 font-mono text-xs" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
