import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCcw, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, API_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: number;
  role: 'bot' | 'user';
  text: string;
};

export function Chatbot() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: 'Hello! I am your Smart Retail AI Assistant powered by Gemini. How can I help you analyze your retail data today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, error]);

  const handleSend = async () => {
    if (!input.trim() || !token) return;

    const userText = input;
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      text: userText
    };

    // Filter out the initial greeting from history to save tokens, or keep it depending on preference.
    // For now we pass all history. We need to omit 'id' before sending.
    const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await api.post('/chat/message', {
        message: userText,
        history: history
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const botMessage: Message = {
        id: Date.now() + 1,
        role: 'bot',
        text: response.data.response
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 500 && err.response?.data?.detail?.includes("GEMINI_API_KEY")) {
        setError("Gemini API Key is not configured. Please add GEMINI_API_KEY to the backend .env file.");
      } else {
        setError("Failed to get response from the AI assistant. Please try again.");
      }
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

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI Chatbot</h1>
          <p className="text-secondary">Your intelligent assistant powered by Gemini.</p>
        </div>
        <button 
          onClick={() => {
            setMessages([{ id: 1, role: 'bot', text: 'Hello! I am your Smart Retail AI Assistant powered by Gemini. How can I help you analyze your retail data today?' }]);
            setError(null);
          }}
          className="px-3 py-1.5 bg-surface border border-border rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Clear Chat
        </button>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                msg.role === 'bot' 
                  ? "bg-accent/10 border-accent/20 text-accent" 
                  : "bg-primary text-background border-primary"
              )}>
                {msg.role === 'bot' ? (
                  <Bot className="w-6 h-6" />
                ) : user?.profile_picture_path ? (
                  <img 
                    src={`${API_URL}/${user.profile_picture_path}?t=${new Date().getTime()}`} 
                    alt={user.full_name || "User"} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === 'bot'
                  ? "bg-black/5 dark:bg-white/5 rounded-tl-none border border-border"
                  : "bg-primary text-background rounded-tr-none"
              )}>
                {msg.role === 'bot' ? (
                  <div className="[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-1.5 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-1.5 [&_li]:mb-0.5 [&_p]:mb-1.5 [&_:last-child]:mb-0">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex gap-4 max-w-[85%]">
               <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                 <Bot className="w-6 h-6" />
               </div>
               <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 rounded-tl-none border border-border flex items-center gap-1.5 h-[52px]">
                 <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                 <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
               </div>
             </div>
          )}
          
          {error && (
            <div className="flex gap-4 max-w-[85%] mx-auto mt-4">
              <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-background border-t border-border">
          <div className="relative flex items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your retail data..."
              className="w-full bg-surface border border-border rounded-xl pl-4 pr-12 py-3.5 min-h-[52px] max-h-[200px] resize-none focus:outline-none focus:border-accent transition-colors shadow-sm text-sm"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-xs text-secondary mt-3">
            AI can make mistakes. Consider verifying important metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
