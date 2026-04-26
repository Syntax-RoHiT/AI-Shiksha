import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Tag as TagIcon, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export default function Coupons() {
  const { branding } = useFranchise();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "PERCENTAGE",
    discount_value: 0,
    min_order_value: 0,
    max_discount: 0,
    course_id: "all",
    usage_limit: 100,
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [couponsRes, coursesRes] = await Promise.all([
        api.get('/coupons'),
        api.get('/courses/admin/all') // Or whichever gets courses for admin
      ]);
      setCoupons(couponsRes.data);
      // fallback if /courses/admin structure is different
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discount_value <= 0) {
      toast({ title: "Error", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        course_id: formData.course_id === "all" ? null : formData.course_id,
        discount_value: Number(formData.discount_value),
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null
      };

      await api.post('/coupons', payload);
      toast({ title: "Success", description: "Coupon created successfully." });
      setIsDialogOpen(false);
      fetchData();
      // Reset form
      setFormData({
        code: "", description: "", discount_type: "PERCENTAGE", discount_value: 0, min_order_value: 0, max_discount: 0, course_id: "all", usage_limit: 100, is_active: true
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create coupon", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast({ title: "Success", description: "Coupon deleted." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete coupon.", variant: "destructive" });
    }
  };

  return (
    <AdminDashboardLayout title="Coupons" subtitle="Create and manage discount codes for your franchise.">
      <div className="p-3 md:p-6 space-y-6 max-w-7xl mx-auto">
        <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-950">
          <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Active Coupons</CardTitle>
              <CardDescription>All your franchise's discount codes.</CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" style={{ backgroundColor: branding.primary_color }}>
                  <Plus className="h-4 w-4" /> Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSave}>
                  <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                    <DialogDescription>Define rules for your new discount code.</DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Coupon Code *</Label>
                      <Input id="code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER50" maxLength={20} required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Discount Type</Label>
                        <Select value={formData.discount_type} onValueChange={(v) => setFormData({...formData, discount_type: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                            <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="value">Discount Value *</Label>
                        <Input id="value" type="number" min="1" max={formData.discount_type === 'PERCENTAGE' ? 100 : undefined} value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value)})} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="min_order" className="text-xs">Min Order Value (₹) Optional</Label>
                        <Input id="min_order" type="number" min="0" value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: parseFloat(e.target.value)})} />
                      </div>
                      {formData.discount_type === 'PERCENTAGE' && (
                        <div className="grid gap-2">
                          <Label htmlFor="max_discount" className="text-xs">Max Discount (₹) Optional</Label>
                          <Input id="max_discount" type="number" min="0" value={formData.max_discount} onChange={e => setFormData({...formData, max_discount: parseFloat(e.target.value)})} />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="course">Specific Course (Optional)</Label>
                      <Select value={formData.course_id} onValueChange={(v) => setFormData({...formData, course_id: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Course</SelectItem>
                          {courses.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="grid gap-2">
                        <Label htmlFor="limit" className="text-xs">Usage Limit (Total)</Label>
                        <Input id="limit" type="number" min="1" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: parseInt(e.target.value)})} />
                      </div>
                      <div className="flex items-center space-x-2 mt-6">
                        <Switch id="active" checked={formData.is_active} onCheckedChange={(v) => setFormData({...formData, is_active: v})} />
                        <Label htmlFor="active">Active Status</Label>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting} style={{ backgroundColor: branding.primary_color }}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Coupon
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
             <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Linked Course</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No coupons found. Create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="pl-4 sm:pl-6 font-mono font-bold tracking-tight">{coupon.code}</TableCell>
                      <TableCell>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                           {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} OFF
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {coupon.course ? coupon.course.title : 'All Courses'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {coupon.times_used} / {coupon.usage_limit || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'} className={coupon.is_active ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 sm:pr-6">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
}
