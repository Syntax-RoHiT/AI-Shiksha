import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
  Send,
  User,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Support as supportApi } from "@/lib/api";

interface SupportTicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender: {
    name: string;
    role: string;
    avatar_url: string;
  };
  image_url?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
  created_at: string;
  updated_at: string;
  student?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
  messages?: SupportTicketMessage[];
}

export default function TicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getAdminTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN": return "secondary";
      case "IN_PROGRESS": return "default";
      case "RESOLVED": return "accent";
      case "CLOSED": return "outline";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "HIGH": return "destructive";
      case "MEDIUM": return "default";
      case "LOW": return "secondary";
      default: return "secondary";
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.student?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      loadTickets();
      toast({ title: "Success", description: "Reply sent successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } finally {
      setIsReplying(false);
      setUploadingImage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await supportApi.closeTicket(selectedTicket.id);
      const details = await supportApi.getTicketDetails(selectedTicket.id);
      setSelectedTicket(details);
      loadTickets();
      toast({ title: "Success", description: "Ticket manually closed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to close ticket", variant: "destructive" });
    }
  };

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <AdminDashboardLayout title="Support Tickets" subtitle="Handle user support requests">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold">{openCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                </div>
                <Clock className="h-8 w-8 text-chart-3/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{resolvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Response</p>
                  <p className="text-2xl font-bold">2.4h</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                All Tickets
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">TICK-{ticket.id.split('-')[0]}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary uppercase">
                              {ticket.student?.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{ticket.student?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground capitalize">Student</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getPriorityColor(ticket.priority) as any}
                        >
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(ticket.status) as any}
                          className={ticket.status === "RESOLVED" ? "bg-accent" : ""}
                        >
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleViewTicket(ticket)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 bg-white text-gray-900">
          <SheetHeader className="p-6 border-b border-gray-100 pb-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg pb-1 text-gray-900">{selectedTicket?.subject}</SheetTitle>
                <SheetDescription className="text-gray-500">
                  Ticket ID: TICK-{selectedTicket?.id?.split('-')[0]} • Created {selectedTicket && new Date(selectedTicket.created_at).toLocaleDateString()}
                </SheetDescription>
              </div>
              {selectedTicket && (
                <Badge variant={getStatusColor(selectedTicket.status) as any}>
                  {selectedTicket.status.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {selectedTicket && (
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Description / Initial Message */}
                <div className="space-y-3 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary uppercase">
                        {selectedTicket.student?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{selectedTicket.student?.name || 'Student'}</span>
                      <span className="text-xs text-muted-foreground">Original Request</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed border border-gray-100 text-gray-800">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="space-y-4">
                  {!selectedTicket.messages && (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {selectedTicket.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ₹{msg.is_admin ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {msg.is_admin ? (
                          <AvatarFallback className="bg-lms-blue text-white"><User className="h-4 w-4" /></AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary uppercase">
                            {msg.sender?.name?.[0] || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className={`space-y-1.5 flex flex-col ₹{msg.is_admin ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {msg.sender?.name || (msg.is_admin ? "Admin" : "Student")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ₹{msg.is_admin
                            ? "bg-lms-blue text-white rounded-tr-sm"
                            : "bg-white border border-gray-200 rounded-tl-sm text-gray-800"
                            }`}
                        >
                          {msg.message}
                          {msg.image_url && (
                              <div className="mt-2">
                                  <img src={msg.image_url} alt="Attachment" className="max-w-xs rounded-md shadow-sm border border-border/50" />
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
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex flex-col gap-3">
                {replyImage && (
                    <div className="relative w-20 h-20 rounded border border-border/50 overflow-hidden">
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
                  className="resize-none min-h-[90px] w-full"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        size="sm"
                        onClick={handleCloseTicket}
                      >
                        Mark as Resolved
                      </Button>
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
                          <Button variant="outline" size="sm" type="button" className="text-muted-foreground gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                              Attach Image
                          </Button>
                      </div>
                  </div>
                  <Button
                    onClick={handleReply}
                    disabled={isReplying || uploadingImage || (!replyMessage.trim() && !replyImage)}
                    className="gap-2 bg-lms-blue hover:bg-lms-blue/90"
                    size="sm"
                  >
                    {isReplying || uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
          {(selectedTicket?.status === 'CLOSED' || selectedTicket?.status === 'RESOLVED') && (
            <div className="p-4 border-t border-border bg-muted/20 text-center">
              <div className="mx-auto w-fit px-4 py-2 rounded-full bg-accent/10 border border-accent/20 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">This ticket has been resolved.</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminDashboardLayout>
  );
}
