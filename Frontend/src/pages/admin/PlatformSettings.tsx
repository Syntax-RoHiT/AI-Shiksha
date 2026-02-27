import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette,
  Upload,
  Globe,
  Mail,
  Save,
  Image,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Settings, Uploads, EmailTemplates } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useFranchise } from "@/contexts/FranchiseContext";
import { EmailTemplateEditor } from "@/components/admin/EmailTemplateEditor";

export default function PlatformSettingsPage() {
  const { toast } = useToast();
  const { refresh } = useFranchise();

  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Form State
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [description, setDescription] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");

  // Email Templates State
  const [customTemplates, setCustomTemplates] = useState<Record<string, { subject: string; body: string }>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTemplateType, setActiveTemplateType] = useState("");

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await EmailTemplates.getAll();
      setCustomTemplates(data || {});
    } catch (error) {
      console.error("Failed to load email templates", error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await Settings.getPlatformSettings();
      setPlatformName(data.lms_name || "");
      setSupportEmail(data.support_email || "");
      setDescription(data.description || "");
      setMaintenanceMode(data.maintenance_mode || false);
      setLogoUrl(data.logo_url || "");
      setFaviconUrl(data.favicon_url || "");
      setPrimaryColor(data.primary_color || "#6366f1");
    } catch (error) {
      toast({ title: "Error", description: "Failed to load platform settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    try {
      await Settings.updatePlatformSettings({
        lms_name: platformName,
        support_email: supportEmail || null,
        description: description,
        maintenance_mode: maintenanceMode
      });
      toast({ title: "Success", description: "General settings updated successfully." });
      refresh(); // Refresh global branding context
    } catch (error) {
      toast({ title: "Error", description: "Failed to update general settings", variant: "destructive" });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      await Settings.updatePlatformSettings({
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        primary_color: primaryColor,
      });
      toast({ title: "Success", description: "Branding updated successfully." });
      refresh(); // Refresh global branding context
    } catch (error) {
      toast({ title: "Error", description: "Failed to update branding", variant: "destructive" });
    } finally {
      setSavingBranding(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true); else setUploadingFavicon(true);

    try {
      const result = await Uploads.upload(file);
      if (type === 'logo') {
        setLogoUrl(result.url);
      } else {
        setFaviconUrl(result.url);
      }
      toast({ title: "Success", description: "Image uploaded successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      if (type === 'logo') setUploadingLogo(false); else setUploadingFavicon(false);
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout title="Platform Settings" subtitle="Configure your platform appearance and settings">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Platform Settings" subtitle="Configure your platform appearance and settings">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="email">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      placeholder="e.g. AI Shiksha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="e.g. support@domain.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Platform Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your learning platform..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Take the platform offline for maintenance</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
                <Button className="gap-2" onClick={handleSaveGeneral} disabled={savingGeneral}>
                  {savingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label>Logo</Label>
                    <div className="border border-border rounded-lg p-6 text-center space-y-4 bg-muted/20">
                      {logoUrl ? (
                        <div className="relative mx-auto w-32 h-16 border bg-background rounded overflow-hidden flex items-center justify-center">
                          <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                      )}

                      <div>
                        <p className="text-xs text-muted-foreground mb-3">Recommended format: SVG, PNG (transparent, max 2MB)</p>
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" className="gap-1 relative pointer-events-none">
                            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                        </Label>
                        <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} disabled={uploadingLogo} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label>Favicon</Label>
                    <div className="border border-border rounded-lg p-6 text-center space-y-4 bg-muted/20">
                      {faviconUrl ? (
                        <div className="relative mx-auto w-12 h-12 border bg-background rounded overflow-hidden flex items-center justify-center">
                          <img src={faviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-3">1:1 square: 32x32 or 64x64 pixels (.ico, .png, .svg)</p>
                        <Label htmlFor="favicon-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" className="gap-1 relative pointer-events-none">
                            {uploadingFavicon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
                          </Button>
                        </Label>
                        <input id="favicon-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'favicon')} disabled={uploadingFavicon} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                    </div>
                  </div>
                </div>
                <Button className="gap-2" onClick={handleSaveBranding} disabled={savingBranding}>
                  {savingBranding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Branding
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Welcome Email", type: "WELCOME" },
                  { name: "Admin Added User", type: "ADMIN_ADDED_USER" },
                  { name: "Course Enrollment", type: "ENROLLMENT" },
                  { name: "Course Purchase (User)", type: "PURCHASE_USER" },
                  { name: "Password Reset", type: "PASSWORD_RESET" },
                  { name: "Course Certificate", type: "CERTIFICATE" }
                ].map((template) => {
                  const isCustomized = !!customTemplates[template.type];

                  return (
                    <div key={template.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          {isCustomized && (
                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-none">
                              Customized
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Customize the {template.name.toLowerCase()} template</p>
                      </div>
                      <Button variant="outline" onClick={() => {
                        setActiveTemplateType(template.type);
                        setEditorOpen(true);
                      }}>
                        {isCustomized ? "Edit Custom" : "Customize"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <EmailTemplateEditor
              open={editorOpen}
              onOpenChange={setEditorOpen}
              templateType={activeTemplateType}
              onSaved={loadTemplates}
              initialData={customTemplates[activeTemplateType] || null}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}
