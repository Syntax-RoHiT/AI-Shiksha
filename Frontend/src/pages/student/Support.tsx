import { useState, useEffect } from "react";
import { UnifiedDashboard } from "@/components/layout/UnifiedDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle2, AlertCircle, FileText, Loader2, Send, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Support as supportApi } from "@/lib/api";

interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
    created_at: string;
    updated_at: string;
    messages?: {
        id: string;
        message: string;
        image_url?: string;
        is_admin: boolean;
        created_at: string;
        sender: {
            name: string;
            role: string;
            avatar_url?: string;
        };
    }[];
}

export default function Support() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [activeTab, setActiveTab] = useState("create");
    const [loading, setLoading] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [newTicket, setNewTicket] = useState({
        subject: "",
        description: "",
        priority: "MEDIUM",
    });
    const [ticketImage, setTicketImage] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Details view state
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyImage, setReplyImage] = useState<File | null>(null);
    const [isReplying, setIsReplying] = useState(false);

    // Load tickets on mount
    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoadingTickets(true);
            const data = await supportApi.getStudentTickets();
            setTickets(data);
        } catch (error) {
            console.error('Error loading tickets:', error);
            toast({
                title: "Error",
                description: "Failed to load tickets. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            let imageUrl = undefined;
            if (ticketImage) {
                setUploadingImage(true);
                const uploadRes = await import('@/lib/api').then(m => m.Upload.uploadFile(ticketImage));
                imageUrl = uploadRes.url;
                setUploadingImage(false);
            }

            const createdTicket = await supportApi.createTicket({ ...newTicket, image_url: imageUrl });

            setTickets([createdTicket, ...tickets]);
            toast({
                title: "Ticket Created",
                description: `Support team has been notified. ID: TICK-${createdTicket.id.split('-')[0]}`,
            });

            setNewTicket({ subject: "", description: "", priority: "MEDIUM" });
            setTicketImage(null);
            setActiveTab("recent");
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast({
                title: "Error",
                description: "Failed to create ticket. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setUploadingImage(false);
        }
    };

    const handleViewTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setIsSheetOpen(true);
        try {
            const details = await supportApi.getTicketDetails(ticket.id);
            setSelectedTicket(details);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load ticket details",
                variant: "destructive",
            });
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim() && !replyImage) return;
        setIsReplying(true);
        try {
            let imageUrl = undefined;
            if (replyImage) {
                setUploadingImage(true);
                const uploadRes = await import('@/lib/api').then(m => m.Upload.uploadFile(replyImage));
                imageUrl = uploadRes.url;
                setUploadingImage(false);
            }

            await supportApi.addMessage(selectedTicket!.id, { message: replyMessage || "Sent an attachment.", image_url: imageUrl });
            setReplyMessage("");
            setReplyImage(null);
            const details = await supportApi.getTicketDetails(selectedTicket!.id);
            setSelectedTicket(details);
            // Refresh tickets list silently
            supportApi.getStudentTickets().then(setTickets).catch(console.error);
            toast({ title: "Success", description: "Reply sent successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
        } finally {
            setIsReplying(false);
            setUploadingImage(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case "OPEN": return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
            case "IN_PROGRESS": return "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
            case "RESOLVED": return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
            case "CLOSED": return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toUpperCase()) {
            case "HIGH": return "text-red-600 bg-red-50 border-red-100";
            case "MEDIUM": return "text-amber-600 bg-amber-50 border-amber-100";
            case "LOW": return "text-green-600 bg-green-50 border-green-100";
            default: return "text-gray-600";
        }
    };

    return (
        <UnifiedDashboard title="Support Center" subtitle="We're here to help you">
            <div className="max-w-6xl mx-auto p-6 font-sans space-y-8">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-lms-blue" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#1F1F1F]">{tickets.filter(t => t.status !== 'CLOSED').length}</p>
                            <p className="text-sm text-gray-500">Active Tickets</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#1F1F1F]">{tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length}</p>
                            <p className="text-sm text-gray-500">Solved Issues</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#1F1F1F]">~2 hrs</p>
                            <p className="text-sm text-gray-500">Avg. Response Time</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <TabsList className="bg-white border border-gray-200 p-1 rounded-full">
                            <TabsTrigger value="create" className="rounded-full px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">New Ticket</TabsTrigger>
                            <TabsTrigger value="recent" className="rounded-full px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">Recent Tickets</TabsTrigger>
                            <TabsTrigger value="closed" className="rounded-full px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">Closed Tickets</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="create">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-2 border-none shadow-md rounded-2xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                    <CardTitle className="text-xl font-semibold text-[#1F1F1F]">Submit a Request</CardTitle>
                                    <CardDescription>Our support team will get back to you as soon as possible.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <form onSubmit={handleCreateTicket} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Subject</label>
                                            <Input
                                                placeholder="Brief summary of the issue"
                                                value={newTicket.subject}
                                                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                                required
                                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Priority</label>
                                                <Select
                                                    value={newTicket.priority}
                                                    onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                                >
                                                    <SelectTrigger className="bg-gray-50 border-gray-200">
                                                        <SelectValue placeholder="Select Priority" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="LOW">Low</SelectItem>
                                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                                        <SelectItem value="HIGH">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Description</label>
                                            <Textarea
                                                placeholder="Please describe your issue in detail..."
                                                className="min-h-[150px] bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                                value={newTicket.description}
                                                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Attachment (Optional)</label>
                                            {ticketImage && (
                                                <div className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden mb-2">
                                                    <img src={URL.createObjectURL(ticketImage)} alt="Upload Preview" className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5" 
                                                        onClick={() => setTicketImage(null)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setTicketImage(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                                <Button variant="outline" type="button" className="text-gray-600 gap-2 w-full justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                                    {ticketImage ? "Change Image" : "Upload Image"}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button type="button" variant="outline" onClick={() => { setNewTicket({ subject: "", description: "", priority: "MEDIUM" }); setTicketImage(null); }}>Clear</Button>
                                            <Button type="submit" disabled={loading || uploadingImage} className="bg-[#0056D2] hover:bg-[#0041a3] text-white px-8">
                                                {(loading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Submit Ticket
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="border-none shadow-sm bg-blue-50/50 rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                                            <AlertCircle className="h-5 w-5" />
                                            Before you submit
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-blue-900/80 space-y-3">
                                        <p>• Check our FAQ section for instant answers.</p>
                                        <p>• Provide as much detail as possible (screenshots help!).</p>
                                        <p>• Allow up to 24 hours for a response during business days.</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Support Hours</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 space-y-2">
                                        <p><strong>Monday - Friday:</strong><br />9:00 AM - 6:00 PM EST</p>
                                        <p><strong>Weekend:</strong><br />Limited Support</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="recent" className="space-y-4">
                        {loadingTickets ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No tickets found</p>
                                <p className="text-sm text-gray-400 mt-2">Create your first support ticket to get started</p>
                            </div>
                        ) : (
                            tickets.map((ticket) => (
                                <div key={ticket.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant="outline" className="font-normal text-xs bg-gray-50">TICK-{ticket.id.split('-')[0]}</Badge>
                                                <Badge variant="outline" className={`font-normal text-xs border ${getStatusColor(ticket.status)}`}>{ticket.status.toUpperCase()}</Badge>
                                                <Badge variant="outline" className={`font-normal text-xs border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 min-w-[200px]">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Created</p>
                                            <p className="text-sm font-medium text-gray-700">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleViewTicket(ticket)}>View Details</Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="closed" className="space-y-4">
                        {loadingTickets ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : tickets.filter(t => t.status === 'CLOSED').length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No closed tickets found</p>
                            </div>
                        ) : (
                            tickets.filter(t => t.status === 'CLOSED').map((ticket) => (
                                <div key={ticket.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant="outline" className="font-normal text-xs bg-gray-50">TICK-{ticket.id.split('-')[0]}</Badge>
                                                <Badge variant="outline" className="font-normal text-xs bg-green-100 text-green-700 border-green-200">SOLVED</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 min-w-[200px]">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Closed On</p>
                                            <p className="text-sm font-medium text-gray-700">{new Date(ticket.updated_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleViewTicket(ticket)}>View Details</Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>

            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 text-gray-900 bg-white">
                    <SheetHeader className="p-6 border-b border-gray-100 pb-4 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-lg pb-1 text-gray-900">{selectedTicket?.subject}</SheetTitle>
                                <SheetDescription className="text-gray-500">
                                    Ticket ID: TICK-{selectedTicket?.id?.split('-')[0]} • Created {selectedTicket && new Date(selectedTicket.created_at).toLocaleDateString()}
                                </SheetDescription>
                            </div>
                            {selectedTicket && (
                                <Badge variant="outline" className={`${getStatusColor(selectedTicket.status)}`}>
                                    {selectedTicket.status.replace("_", " ").toUpperCase()}
                                </Badge>
                            )}
                        </div>
                    </SheetHeader>

                    {selectedTicket && (
                        <ScrollArea className="flex-1 p-6 bg-gray-50/50">
                            <div className="space-y-6">
                                {/* Messages Timeline */}
                                <div className="space-y-4">
                                    {!selectedTicket.messages && (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                        </div>
                                    )}

                                    {selectedTicket.messages?.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 max-w-[85%] ${!msg.is_admin ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                                        >
                                            <Avatar className="h-8 w-8 shrink-0">
                                                {!msg.is_admin ? (
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 uppercase">
                                                        {msg.sender?.name?.[0] || 'U'}
                                                    </AvatarFallback>
                                                ) : (
                                                    <AvatarFallback className="bg-[#1F1F1F] text-white"><User className="h-4 w-4" /></AvatarFallback>
                                                )}
                                            </Avatar>

                                            <div className={`space-y-1.5 flex flex-col ${!msg.is_admin ? "items-end" : "items-start"}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {msg.is_admin ? "Support Team" : "You"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${!msg.is_admin
                                                        ? "bg-blue-600 text-white rounded-tr-sm"
                                                        : "bg-white border border-gray-100 rounded-tl-sm text-gray-800"
                                                        }`}
                                                >
                                                    {msg.message}
                                                    {msg.image_url && (
                                                        <div className="mt-2">
                                                            <img src={msg.image_url} alt="Attachment" className="max-w-xs rounded-md shadow-sm border border-gray-200" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    {selectedTicket?.status !== 'CLOSED' && selectedTicket?.status !== 'RESOLVED' && (
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex flex-col gap-3">
                                {replyImage && (
                                    <div className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden">
                                        <img src={URL.createObjectURL(replyImage)} alt="Upload Preview" className="w-full h-full object-cover" />
                                        <button 
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5" 
                                            onClick={() => setReplyImage(null)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    </div>
                                )}
                                <Textarea
                                    placeholder="Type your reply here..."
                                    className="resize-none min-h-[90px] w-full border-gray-200 focus:border-blue-500 transition-colors"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <div className="flex items-center justify-between">
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setReplyImage(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <Button variant="outline" size="sm" type="button" className="text-gray-600 gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                            Attach Image
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleReply}
                                        disabled={isReplying || uploadingImage || (!replyMessage.trim() && !replyImage)}
                                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                    >
                                        {isReplying || uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    {(selectedTicket?.status === 'CLOSED' || selectedTicket?.status === 'RESOLVED') && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                            <div className="mx-auto w-fit px-4 py-2 rounded-full bg-green-50 border border-green-100 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">This ticket has been resolved.</span>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </UnifiedDashboard>
    );
}
