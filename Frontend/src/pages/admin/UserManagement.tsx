import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, UserPlus, Shield, GraduationCap, Users, MoreHorizontal,
  Wand2, Copy, Check, Eye, EyeOff, Loader2, Trash2, AlertTriangle, Calendar,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Users as UsersAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ─── Add User Dialog ─────────────────────────────────────────────────────── */
function AddUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    setPassword(Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
    setConfirm("");
    setCopied(false);
  };

  const copy = () => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const submit = async () => {
    if (!form.name || !form.email || !form.role) return toast({ title: "Missing fields", variant: "destructive" });
    if (password.length < 6) return toast({ title: "Password too short", variant: "destructive" });
    if (password !== confirm) return toast({ title: "Passwords don't match", variant: "destructive" });
    setLoading(true);
    try {
      await UsersAPI.create({ ...form, password });
      toast({ title: "User Created" });
      setForm({ name: "", email: "", role: "" });
      setPassword(""); setConfirm("");
      await onSuccess();
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create user", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-none bg-violet-600 hover:bg-violet-700 text-white h-12 px-6 font-bold shadow-lg">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-widest">Add New User</DialogTitle>
          <DialogDescription>Create a new user account for the platform.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-none" /></div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-none" /></div>
          <div className="space-y-3 border border-black/10 dark:border-white/10 p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <Label className="font-bold">Password</Label>
              <Button type="button" variant="outline" size="sm" onClick={generate} className="h-7 gap-1.5 rounded-none text-xs"><Wand2 className="h-3 w-3" />Generate</Button>
            </div>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="pr-16 rounded-none" />
              <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-0.5">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShow(!show)}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                {password && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={copy}>{copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>}
              </div>
            </div>
            <Input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="rounded-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-none">Cancel</Button>
          <Button onClick={submit} disabled={loading} className="rounded-none bg-violet-600 hover:bg-violet-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Edit Joining Date Dialog ────────────────────────────────────────────── */
function EditDateDialog({ user, isOpen, setIsOpen, onSuccess }: any) {
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) setDate(user.created_at ? new Date(user.created_at).toISOString().split("T")[0] : "");
  }, [user]);

  const submit = async () => {
    if (!date) return;
    setLoading(true);
    try {
      await UsersAPI.updateJoiningDate(user.id, date);
      toast({ title: "Date updated" });
      setIsOpen(false);
      onSuccess();
    } catch { toast({ title: "Error", description: "Failed to update date", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-none sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-widest">Edit Joining Date</DialogTitle>
          <DialogDescription>Update when this user joined the platform.</DialogDescription>
        </DialogHeader>
        <div className="py-3 space-y-2">
          <Label>Joining Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-none" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-none">Cancel</Button>
          <Button onClick={submit} disabled={loading} className="rounded-none">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Role badge colours ──────────────────────────────────────────────────── */
const roleConfig: Record<string, { label: string; className: string }> = {
  STUDENT: { label: "Student", className: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  INSTRUCTOR: { label: "Instructor", className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ADMIN: { label: "Admin", className: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  SUPER_ADMIN: { label: "Super Admin", className: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  FRANCHISE_ADMIN: { label: "Franchise Admin", className: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

/* ─── Tab selector ────────────────────────────────────────────────────────── */
const TABS = [
  { id: "all", label: "All Users" },
  { id: "STUDENT", label: "Students" },
  { id: "INSTRUCTOR", label: "Instructors" },
  { id: "admin", label: "Admins" },
];

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editDateUser, setEditDateUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try { setLoading(true); setUsers(await UsersAPI.getAll()); }
    catch { console.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (activeTab === "STUDENT") list = list.filter(u => u.role === "STUDENT");
    else if (activeTab === "INSTRUCTOR") list = list.filter(u => u.role === "INSTRUCTOR");
    else if (activeTab === "admin") list = list.filter(u => ["ADMIN", "SUPER_ADMIN", "FRANCHISE_ADMIN"].includes(u.role));
    if (search) list = list.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [users, activeTab, search]);

  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter(u => u.role === "STUDENT").length,
    instructors: users.filter(u => u.role === "INSTRUCTOR").length,
    admins: users.filter(u => ["ADMIN", "SUPER_ADMIN", "FRANCHISE_ADMIN"].includes(u.role)).length,
  }), [users]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await UsersAPI.delete(deleteId);
      toast({ title: "User deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to delete", variant: "destructive" });
    } finally { setDeleting(false); setDeleteId(null); }
  };

  const statCards = [
    { label: "Total Users", value: stats.total, icon: Users, colors: "from-blue-400 to-indigo-500", bg: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-500/20" },
    { label: "Students", value: stats.students, icon: GraduationCap, colors: "from-emerald-400 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-500/20" },
    { label: "Instructors", value: stats.instructors, icon: Users, colors: "from-violet-400 to-purple-500", bg: "bg-violet-50 dark:bg-violet-500/10", iconColor: "text-violet-600 dark:text-violet-400", border: "border-violet-100 dark:border-violet-500/20" },
    { label: "Admins", value: stats.admins, icon: Shield, colors: "from-rose-400 to-pink-500", bg: "bg-rose-50 dark:bg-rose-500/10", iconColor: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-500/20" },
  ];

  return (
    <AdminDashboardLayout title="Users" subtitle="Manage all platform users">
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-none bg-zinc-950 p-6 md:p-8 shadow-2xl border border-white/10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-blue-500/10 to-indigo-500/20 opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/30 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Users</h2>
              <p className="text-sm md:text-lg text-white/60 font-medium">Manage students, instructors, and administrators.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-white/40" /></div>
                <Input placeholder="Search by name or email..." className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none focus-visible:ring-violet-500 backdrop-blur-md font-medium" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <AddUserDialog onSuccess={load} />
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map(c => (
            <div key={c.label} className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${c.colors} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="relative p-5 flex flex-col h-full z-10">
                <div className={`w-10 h-10 rounded-none flex items-center justify-center mb-4 border ${c.bg} ${c.border} group-hover:scale-110 transition-transform duration-500`}>
                  <c.icon className={`h-5 w-5 ${c.iconColor}`} />
                </div>
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{loading ? "..." : c.value}</p>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User List */}
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Tab Bar */}
          <div className="border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-950/40 overflow-x-auto">
            <div className="flex min-w-max">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("px-5 py-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-b-2", activeTab === t.id ? "border-violet-500 text-violet-600 dark:text-violet-400" : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Rows */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Loading Users...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-none flex items-center justify-center"><Users className="h-8 w-8 text-zinc-400" /></div>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">No users found</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Try adjusting your search or tab filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map(user => {
                const rc = roleConfig[user.role] ?? { label: user.role, className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" };
                return (
                  <div key={user.id} className="group p-4 md:p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-11 w-11 rounded-none border border-black/10 dark:border-white/10 shrink-0">
                        <AvatarFallback className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-black rounded-none text-sm">
                          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-wrap shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                      <Badge className={cn("rounded-none text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-0", rc.className)}>
                        {rc.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-none hover:bg-black/5 dark:hover:bg-white/5 h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-black/10 dark:border-white/10">
                          <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => setEditDateUser(user)}>
                            <Calendar className="h-4 w-4 mr-2" />Edit Joining Date
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-none cursor-pointer" onClick={() => setDeleteId(user.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the user. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="rounded-none bg-destructive hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Date Dialog */}
      <EditDateDialog user={editDateUser} isOpen={!!editDateUser} setIsOpen={(o: boolean) => !o && setEditDateUser(null)} onSuccess={load} />
    </AdminDashboardLayout>
  );
}
