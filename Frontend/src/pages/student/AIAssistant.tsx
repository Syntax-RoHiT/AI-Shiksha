import { UnifiedDashboard } from "@/components/layout/UnifiedDashboard";
import { Chatbot } from "@/components/ai/Chatbot";

export default function AIAssistant() {
    return (
        <UnifiedDashboard title="AI Assistant" subtitle="Your personal learning companion">
            <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-5xl mx-auto bg-background rounded-2xl border border-border shadow-sm overflow-hidden font-sans">
                <Chatbot 
                    endpoint="/ai/assistant/chat" 
                    isOpen={true} 
                    embedded={true} 
                    className="border-0 shadow-none rounded-none" 
                />
            </div>
        </UnifiedDashboard>
    );
}
