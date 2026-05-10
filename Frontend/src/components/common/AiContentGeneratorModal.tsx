import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Lightbulb, Download, CheckCircle2, Cpu, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CreateMLCEngine, hasModelInCache, MLCEngineInterface } from "@mlc-ai/web-llm";
import { marked } from 'marked';

// Use a fast, capable model suitable for client-side WebGPU
const MODEL_ID = "gemma-2b-it-q4f32_1-MLC"; // 2B model for better compatibility

const checkDeviceCapabilities = async (): Promise<{ isCapable: boolean; reason?: string }> => {
    // 1. Browser Support (WebGPU)
    if (!(navigator as any).gpu) {
        return { isCapable: false, reason: "Your browser does not support WebGPU. Please use a compatible browser like Chrome or Edge." };
    }

    // 2. RAM Check (navigator.deviceMemory is an estimate in GB)
    if ('deviceMemory' in navigator) {
        const ram = (navigator as any).deviceMemory;
        if (ram < 4) { // Gemma 2B needs at least 4GB RAM safely
            return { isCapable: false, reason: `Your device has insufficient RAM (${ram}GB). Minimum 4GB required for AI features.` };
        }
    }

    // 3. Mobile Check
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        return { isCapable: false, reason: "Local AI features are currently not supported on mobile devices due to hardware constraints." };
    }

    // 4. GPU Check
    try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) {
            return { isCapable: false, reason: "No suitable GPU adapter found on your device." };
        }
    } catch (e) {
        return { isCapable: false, reason: "Failed to request GPU adapter." };
    }

    return { isCapable: true };
};

interface AiContentGeneratorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (content: string) => void;
    context?: string;
}

export function AiContentGeneratorModal({ open, onOpenChange, onGenerate, context }: AiContentGeneratorModalProps) {
    // Model Load State
    const [engineReady, setEngineReady] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadText, setDownloadText] = useState('');
    const [isCached, setIsCached] = useState(false);
    
    // WebLLM Engine reference
    const engineRef = useRef<MLCEngineInterface | null>(null);

    // Generation Form State
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    // Device Capability State
    const [deviceCheckComplete, setDeviceCheckComplete] = useState(false);
    const [deviceCapable, setDeviceCapable] = useState(true);
    const [incapableReason, setIncapableReason] = useState("");

    // Options
    const [length, setLength] = useState('1000');
    const [language, setLanguage] = useState('English');
    const [tone, setTone] = useState('Professional');
    const [format, setFormat] = useState('Markdown'); // Default to Markdown

    // Check if model is already downloaded in cache on mount
    useEffect(() => {
        const init = async () => {
            if (open) {
                const check = await checkDeviceCapabilities();
                setDeviceCapable(check.isCapable);
                if (!check.isCapable) {
                    setIncapableReason(check.reason || "Device not supported.");
                }
                setDeviceCheckComplete(true);

                if (check.isCapable) {
                    try {
                        const cached = await hasModelInCache(MODEL_ID);
                        setIsCached(cached);
                        if (cached && !engineReady && !isDownloading) {
                            // Auto-load if cached
                            loadModel();
                        }
                    } catch (e) {
                        console.error("Cache check failed", e);
                    }
                }
            }
        };
        init();
    }, [open]);

    const loadModel = async () => {
        if (engineReady) return;
        setIsDownloading(true);
        setDownloadProgress(0);
        setDownloadText('Initializing AI Engine...');

        try {
            const initProgressCallback = (report: any) => {
                setDownloadText(report.text);
                // The progress is a string like "Loading model ... 50%" or we can use report.progress
                if (report.progress !== undefined) {
                    setDownloadProgress(Math.round(report.progress * 100));
                }
            };

            const engine = await CreateMLCEngine(
                MODEL_ID,
                { initProgressCallback: initProgressCallback }
            );

            engineRef.current = engine;
            setEngineReady(true);
            setIsCached(true);
            toast.success("AI Model loaded successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load AI model. Please check your browser's WebGPU support.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !engineRef.current) return;

        setLoading(true);
        try {
            // Construct a detailed prompt based on options
            const systemPrompt = `You are an expert AI content generator. 
You MUST strictly follow these constraints:
- Language: ${language}
- Tone: ${tone}
- Format: ${format}
- Target Word Count: At least ${length} words. This is a STRICT requirement. You must elaborate deeply, provide examples, and expand on concepts to ensure the text is long and comprehensive enough.
- Context: ${context || 'General Educational Content'}`;

            const userPrompt = `Generate the following content: "${prompt}". 
Remember to strictly adhere to the requested Language (${language}), Tone (${tone}), Format (${format}), and minimum Word Count (${length} words). Be highly detailed and comprehensive. Return ONLY the generated content without any conversational filler or introductory text.`;

            const messages = [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: userPrompt }
            ];

            // Estimate tokens based on words (rough 1.5 - 2x multiplier). Max safe limit for local context.
            const targetTokens = Math.max(1024, parseInt(length) * 2);

            const reply = await engineRef.current.chat.completions.create({
                messages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: targetTokens,
            });

            const text = reply.choices[0].message.content || "";
            
            // Parse markdown to HTML for the Rich Text Editor
            const finalContent = await marked.parse(text);
            
            onGenerate(finalContent);
            onOpenChange(false);
            toast.success("Content generated successfully");

            // Reset form partly
            setPrompt('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content");
        } finally {
            setLoading(false);
        }
    };

    const handleInspireMe = () => {
        const suggestions = [
            "Explain the key concepts of [Topic] for beginners...",
            "Write a compelling course description for a masterclass on...",
            "List 5 main learning outcomes for a course about...",
            "Describe the prerequisites needed for...",
        ];
        const random = suggestions[Math.floor(Math.random() * suggestions.length)];
        setPrompt(random);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                    <div className="flex items-center gap-2 text-purple-700">
                        <Sparkles className="h-5 w-5" />
                        <h2 className="font-semibold text-lg">AI Studio (Local WebGPU)</h2>
                    </div>
                </div>

                {!deviceCapable ? (
                    <div className="p-10 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">
                                Device Not Supported
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                {incapableReason}
                            </p>
                        </div>
                        <Button 
                            onClick={() => onOpenChange(false)} 
                            className="mt-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 h-auto shadow-lg"
                        >
                            Close
                        </Button>
                    </div>
                ) : !engineReady ? (
                    <div className="p-10 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                            <Cpu className="h-10 w-10 text-purple-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isCached ? "Loading Local AI Model..." : "Download Local AI Model"}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                {isCached 
                                    ? "Initializing the cached AI model from your browser. This will only take a moment."
                                    : "To ensure maximum privacy and zero API costs, this feature runs entirely on your device using WebGPU. We need to download the AI model once."}
                            </p>
                        </div>

                        {isDownloading ? (
                            <div className="w-full max-w-md space-y-2 mt-4">
                                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                                    <span className="truncate pr-4">{downloadText || "Loading..."}</span>
                                    <span>{downloadProgress}%</span>
                                </div>
                                <Progress value={downloadProgress} className="h-2" />
                            </div>
                        ) : (
                            <Button 
                                onClick={loadModel} 
                                className="mt-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 h-auto shadow-lg shadow-purple-200"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                {isCached ? "Initialize Model" : "Download & Initialize Model (approx. 2-3GB)"}
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="p-6 space-y-6">
                            {/* Main Input */}
                            <div className="space-y-3">
                                <Label className="text-gray-700 font-medium">Craft Your Content Request</Label>
                                <div className="relative">
                                    <Textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Provide a brief overview of your course topic, target audience, and key takeaways"
                                        className="min-h-[140px] resize-none rounded-2xl border-gray-200 bg-gray-50/50 p-4 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all text-base shadow-inner"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleInspireMe}
                                        className="absolute bottom-3 left-3 h-8 gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100 transition-colors"
                                    >
                                        <Lightbulb className="h-3.5 w-3.5" />
                                        Inspire Me
                                    </Button>
                                </div>
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Word Count</Label>
                                    <Input
                                        type="number"
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                        className="h-10 rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Language</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999] rounded-xl border-gray-100 shadow-xl">
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Spanish">Spanish</SelectItem>
                                            <SelectItem value="French">French</SelectItem>
                                            <SelectItem value="German">German</SelectItem>
                                            <SelectItem value="Hindi">Hindi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tone</Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999] rounded-xl border-gray-100 shadow-xl">
                                            <SelectItem value="Formal">Formal</SelectItem>
                                            <SelectItem value="Casual">Casual</SelectItem>
                                            <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                                            <SelectItem value="Professional">Professional</SelectItem>
                                            <SelectItem value="Instructional">Instructional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Format</Label>
                                    <Select value={format} onValueChange={setFormat}>
                                        <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999] rounded-xl border-gray-100 shadow-xl">
                                            <SelectItem value="Paragraph">Paragraph</SelectItem>
                                            <SelectItem value="List">Bullet Points</SelectItem>
                                            <SelectItem value="Essay">Short Essay</SelectItem>
                                            <SelectItem value="HTML">HTML Structured</SelectItem>
                                            <SelectItem value="Markdown">Markdown</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-gray-200/50 text-gray-600">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 border-0 transition-all active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Now
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
