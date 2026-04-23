import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AI } from "@/lib/api";

export function LandingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content: "Hi there! Welcome to LearnAI. How can I help you today?",
    },
  ]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await AI.publicChat(userMessage);
      const aiReply = response?.data?.response || response?.response || "I'm sorry, I couldn't process that request.";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: aiReply,
        },
      ]);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Please log in to chat with the AI Assistant.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#2d2f31] text-white shadow-xl hover:bg-black transition-all duration-300",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A3FF12]">
              <MessageSquare className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">LearnAI Support</h3>
              <p className="text-xs text-gray-500 font-medium">We typically reply instantly</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#2d2f31] text-white rounded-2xl rounded-br-sm"
                    : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2.5 text-sm text-gray-500 rounded-2xl rounded-bl-sm shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[100px] resize-none text-sm border-gray-200 text-gray-900 focus-visible:ring-[#2d2f31]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="h-11 w-11 shrink-0 rounded-xl bg-[#2d2f31] text-white hover:bg-black transition-colors"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
