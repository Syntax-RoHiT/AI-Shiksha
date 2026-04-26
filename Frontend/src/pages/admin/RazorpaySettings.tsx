import { useState, useEffect } from "react";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CreditCard, ShieldCheck } from "lucide-react";
import { razorpayService } from "@/lib/api/razorpayService";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";

export default function RazorpaySettings() {
  const { branding } = useFranchise();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    key_id: "",
    key_secret: "",
    webhook_secret: "",
    currency: "INR",
    is_enabled: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await razorpayService.getSettings();
        setFormData({
          key_id: data.key_id || "",
          key_secret: data.key_secret || "",
          webhook_secret: data.webhook_secret || "",
          currency: data.currency || "INR",
          is_enabled: data.is_enabled || false,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load Razorpay settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, currency: value }));
  };

  const handleToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_enabled: checked }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await razorpayService.updateSettings(formData);
      toast({
        title: "Success",
        description: "Razorpay settings updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminDashboardLayout title="Payment Gateway Configuration" subtitle="Manage your Razorpay API keys and payment preferences.">
      <div className="p-3 md:p-6 space-y-8 max-w-5xl mx-auto">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-950">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 px-4 sm:px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Razorpay Integration</CardTitle>
                  <CardDescription className="mt-1">
                    Accept payments securely using Razorpay. Your credentials are encrypted.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-8 space-y-8">
              {/* Status Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Gateway Status</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enable or disable the Razorpay checkout for your franchise.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${formData.is_enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {formData.is_enabled ? 'Active' : 'Disabled'}
                  </span>
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>

              <Separator />

              {/* API Credentials Section */}
              <div className="grid md:grid-cols-[1fr_2fr] gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-base font-semibold">API Credentials</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Obtain these keys from your Razorpay Dashboard under API Keys. Remember to never share your secret keys publicly.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="key_id" className="text-sm font-medium text-slate-700 dark:text-slate-300">Key ID</Label>
                    <Input
                      id="key_id"
                      name="key_id"
                      value={formData.key_id}
                      onChange={handleChange}
                      placeholder="rzp_test_..."
                      className="bg-zinc-50 dark:bg-zinc-900 h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="key_secret" className="text-sm font-medium text-slate-700 dark:text-slate-300">Key Secret</Label>
                    <Input
                      id="key_secret"
                      name="key_secret"
                      type="password"
                      value={formData.key_secret}
                      onChange={handleChange}
                      placeholder="••••••••••••••••"
                      className="bg-zinc-50 dark:bg-zinc-900 h-11"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Settings Section */}
              <div className="grid md:grid-cols-[1fr_2fr] gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Preferences</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Configure your primary currency and webhook handling. Webhooks are essential for capturing delayed payments.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="currency" className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency</Label>
                    <Select value={formData.currency} onValueChange={handleSelectChange}>
                      <SelectTrigger id="currency" className="bg-zinc-50 dark:bg-zinc-900 h-11">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                        <SelectItem value="INR">INR (₹) - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                        <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="webhook_secret" className="text-sm font-medium text-slate-700 dark:text-slate-300">Webhook Secret</Label>
                    <Input
                      id="webhook_secret"
                      name="webhook_secret"
                      type="password"
                      value={formData.webhook_secret}
                      onChange={handleChange}
                      placeholder="••••••••••••••••"
                      className="bg-zinc-50 dark:bg-zinc-900 h-11"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-4 sm:px-8 py-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t flex flex-col sm:flex-row justify-end gap-3 rounded-b-xl">
              <Button 
                type="button" 
                variant="outline" 
                className="h-11 px-6 rounded-lg font-medium"
                onClick={() => setFormData({...formData})} // pseudo-reset 
              >
                Discard Changes
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="h-11 px-6 rounded-lg font-medium shadow-sm transition-all hover:shadow"
                style={{ backgroundColor: branding.primary_color }}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Configuration
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminDashboardLayout>
  );
}
