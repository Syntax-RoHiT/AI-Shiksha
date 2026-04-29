import { useState, useEffect, useMemo } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Tag as TagIcon, Trash2, Search, Percent, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  code: "", description: "", discount_type: "PERCENTAGE",
  discount_value: 0, min_order_value: 0, max_discount: 0,
  course_id: "all", usage_limit: 100, is_active: true,
};

export default function Coupons() {
  const { branding } = useFranchise();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [couponsRes, coursesRes] = await Promise.all([
        api.get("/coupons"),
        api.get("/courses/admin/all"),
      ]);
      setCoupons(couponsRes.data);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch coupons", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() =>
    coupons.filter(c => c.code?.toLowerCase().includes(search.toLowerCase())),
    [coupons, search]
  );

  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    totalUses: coupons.reduce((a, c) => a + (c.times_used || 0), 0),
  }), [coupons]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discount_value <= 0) {
      toast({ title: "Error", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/coupons", {
        ...formData,
        course_id: formData.course_id === "all" ? null : formData.course_id,
        discount_value: Number(formData.discount_value),
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      });
      toast({ title: "Coupon created successfully." });
      setIsDialogOpen(false);
      setFormData({ ...EMPTY_FORM });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create coupon", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast({ title: "Coupon deleted." });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to delete coupon.", variant: "destructive" });
    }
  };

  return (
    <AdminDashboardLayout title="Coupons" subtitle="Create and manage discount codes">
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-none bg-zinc-950 p-6 md:p-8 shadow-2xl border border-white/10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/30 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Coupons</h2>
              <p className="text-sm md:text-lg text-white/60 font-medium">Create and manage discount codes for your franchise.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="h-4 w-4 text-white/40" /></div>
                <Input placeholder="Search coupons..." className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none focus-visible:ring-emerald-500 backdrop-blur-md font-medium" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 font-bold shadow-lg shrink-0">
                    <Plus className="h-4 w-4" /> Create Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-none">
                  <form onSubmit={handleSave}>
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase tracking-widest text-xl">Create Coupon</DialogTitle>
                      <DialogDescription>Define rules for your new discount code.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-1.5">
                        <Label>Coupon Code *</Label>
                        <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER50" maxLength={20} required className="rounded-none font-mono tracking-widest" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Discount Type</Label>
                          <Select value={formData.discount_type} onValueChange={v => setFormData({ ...formData, discount_type: v })}>
                            <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                              <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Discount Value *</Label>
                          <Input type="number" min="1" max={formData.discount_type === "PERCENTAGE" ? 100 : undefined} value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })} required className="rounded-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Min Order (₹) <span className="text-zinc-400">Optional</span></Label>
                          <Input type="number" min="0" value={formData.min_order_value} onChange={e => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) })} className="rounded-none" />
                        </div>
                        {formData.discount_type === "PERCENTAGE" && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Max Discount (₹) <span className="text-zinc-400">Optional</span></Label>
                            <Input type="number" min="0" value={formData.max_discount} onChange={e => setFormData({ ...formData, max_discount: parseFloat(e.target.value) })} className="rounded-none" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Specific Course <span className="text-zinc-400 text-xs">(Optional)</span></Label>
                        <Select value={formData.course_id} onValueChange={v => setFormData({ ...formData, course_id: v })}>
                          <SelectTrigger className="rounded-none"><SelectValue placeholder="All Courses" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Course</SelectItem>
                            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Usage Limit</Label>
                          <Input type="number" min="1" value={formData.usage_limit} onChange={e => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })} className="rounded-none" />
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                          <Switch id="active" checked={formData.is_active} onCheckedChange={v => setFormData({ ...formData, is_active: v })} />
                          <Label htmlFor="active">Active</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-none">Cancel</Button>
                      <Button type="submit" disabled={submitting} className="rounded-none bg-emerald-600 hover:bg-emerald-700">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Coupon
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: "Total Coupons", value: stats.total, icon: TagIcon, bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20", color: "text-emerald-600 dark:text-emerald-400", grad: "from-emerald-400 to-teal-500" },
            { label: "Active Coupons", value: stats.active, icon: CheckCircle2, bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20", color: "text-blue-600 dark:text-blue-400", grad: "from-blue-400 to-indigo-500" },
            { label: "Total Uses", value: stats.totalUses, icon: Percent, bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-100 dark:border-violet-500/20", color: "text-violet-600 dark:text-violet-400", grad: "from-violet-400 to-purple-500" },
          ].map(c => (
            <div key={c.label} className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="relative p-5 flex flex-col h-full z-10">
                <div className={`w-10 h-10 rounded-none flex items-center justify-center mb-4 border ${c.bg} ${c.border} group-hover:scale-110 transition-transform duration-500`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{loading ? "..." : c.value}</p>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon List */}
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-black/5 dark:border-white/5 p-5 bg-white/40 dark:bg-zinc-950/40 flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-zinc-400" />Discount Codes
              <span className="text-xs font-normal text-zinc-400">({filtered.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
              <TagIcon className="h-10 w-10 text-zinc-300" />
              <p className="font-bold text-zinc-900 dark:text-white">No coupons found</p>
              <p className="text-sm text-zinc-500">Create your first discount code above.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map(coupon => (
                <div key={coupon.id} className="group p-4 md:p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                  {/* Left: code + discount */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-none bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                      <TagIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black font-mono tracking-widest text-zinc-900 dark:text-white text-sm">{coupon.code}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{coupon.course ? coupon.course.title : "All Courses"}</p>
                    </div>
                  </div>

                  {/* Right: meta */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {coupon.discount_type === "PERCENTAGE" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} OFF
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 font-mono rounded-none">
                      {coupon.times_used}/{coupon.usage_limit ?? "∞"} used
                    </span>
                    <Badge className={cn("rounded-none text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-0", coupon.is_active ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                      {coupon.is_active ? <><CheckCircle2 className="h-3 w-3 mr-1 inline" />Active</> : <><XCircle className="h-3 w-3 mr-1 inline" />Inactive</>}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="rounded-none h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
