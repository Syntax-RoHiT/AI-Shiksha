import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Analytics } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  RefreshCw, 
  Users, 
  MousePointerClick, 
  Clock, 
  Activity,
  Globe,
  Smartphone,
  Unplug,
  Loader2,
  Settings
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuperAdminSetup, setShowSuperAdminSetup] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectingProperty, setSelectingProperty] = useState(false);

  useEffect(() => {
    // Check if returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      toast.success("Successfully authenticated with Google");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await Analytics.getStatus();
      setStatus(res);
      if (res.connected && res.propertySelected) {
        fetchAllData();
      } else if (res.connected && !res.propertySelected) {
        fetchProperties();
      }
      if (isSuperAdmin) {
        const config = await Analytics.getConfig();
        if (config.clientId) setClientId(config.clientId);
        if (config.clientSecret) setClientSecret(config.clientSecret);
      }
    } catch (error) {
      console.error("Failed to fetch analytics status", error);
      toast.error("Failed to load analytics status");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [traffic, acquisition, audience, content] = await Promise.all([
        Analytics.getTraffic(),
        Analytics.getAcquisition(),
        Analytics.getAudience(),
        Analytics.getContent()
      ]);
      setData({ traffic, acquisition, audience, content });
    } catch (error) {
      console.error("Failed to fetch analytics data", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await Analytics.getOAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      toast.error("Failed to initiate Google connection");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Analytics?")) return;
    try {
      await Analytics.disconnect();
      setStatus({ connected: false });
      setData(null);
      toast.success("Disconnected from Google Analytics");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Analytics.forceRefresh();
      await fetchAllData();
      toast.success("Analytics data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!clientId || !clientSecret) {
      toast.error("Please enter both Client ID and Client Secret");
      return;
    }
    setSavingConfig(true);
    try {
      await Analytics.saveConfig(clientId, clientSecret);
      toast.success("OAuth Configuration saved successfully");
      setShowSuperAdminSetup(false);
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const props = await Analytics.listProperties();
      // Ensure we always set an array to avoid map() crashes
      setProperties(props.properties || []);
    } catch (error) {
      console.error("Failed to fetch properties", error);
      toast.error("Failed to load Google Analytics properties");
    }
  };

  const handleSelectProperty = async (propertyId: string, propertyName: string) => {
    setSelectingProperty(true);
    try {
      await Analytics.connectProperty(propertyId, propertyName);
      toast.success(`Connected to ${propertyName}`);
      setStatus((prev: any) => ({ ...prev, propertySelected: true, propertyName }));
      fetchAllData();
    } catch (error) {
      toast.error("Failed to connect property");
    } finally {
      setSelectingProperty(false);
    }
  };

  if (loading && !data && !properties.length) {
    return (
      <AdminDashboardLayout title="Google Analytics">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  // Setup View (Not Connected)
  if (!status?.connected) {
    return (
      <AdminDashboardLayout title="Google Analytics">
        <div className="max-w-3xl mx-auto mt-10">
          <Card>
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Connect Google Analytics</CardTitle>
              <CardDescription className="text-lg mt-2">
                Gain deep insights into your student traffic, acquisition channels, and course engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-12 space-y-6">
              <Button size="lg" onClick={handleConnect} className="gap-2 px-8">
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect with Google
              </Button>
              <p className="text-sm text-muted-foreground">
                Requires a Google account with GA4 property access for your domain.
              </p>

              {isSuperAdmin && (
                <div className="w-full mt-10 border-t pt-8">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setShowSuperAdminSetup(!showSuperAdminSetup)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Super Admin OAuth Configuration
                  </Button>
                  
                  {showSuperAdminSetup && (
                    <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label>Google Client ID</Label>
                        <Input 
                          value={clientId} 
                          onChange={e => setClientId(e.target.value)} 
                          placeholder="Enter Client ID from Google Cloud Console" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Google Client Secret</Label>
                        <Input 
                          type="password" 
                          value={clientSecret} 
                          onChange={e => setClientSecret(e.target.value)} 
                          placeholder="Enter Client Secret" 
                        />
                      </div>
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                      >
                        {savingConfig ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          "Save Configuration"
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        These credentials are used globally for the platform's OAuth flow. Individual franchise admins will still authenticate with their own Google accounts to access their respective properties.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminDashboardLayout>
    );
  }

  // Select Property View
  if (status?.connected && !status?.propertySelected) {
    return (
      <AdminDashboardLayout title="Google Analytics">
        <div className="max-w-3xl mx-auto mt-10">
          <Card>
            <CardHeader className="text-center pb-8 pt-10">
              <CardTitle className="text-2xl font-bold">Select Analytics Property</CardTitle>
              <CardDescription className="text-lg mt-2">
                Choose the GA4 property you want to connect to this franchise.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col pb-12 space-y-6">
              {properties.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((prop) => (
                    <div key={prop.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground">{prop.name}</h4>
                        <p className="text-sm text-muted-foreground">Property ID: {prop.id}</p>
                      </div>
                      <Button 
                        onClick={() => handleSelectProperty(prop.id, prop.name)}
                        disabled={selectingProperty}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                  <div className="mt-6 flex justify-center border-t pt-6">
                     <Button variant="outline" onClick={handleDisconnect} className="text-destructive">
                       Cancel & Disconnect
                     </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminDashboardLayout>
    );
  }

  // Dashboard View
  if (status?.propertySelected && data) {
    const ts = data.traffic.summary;
    return (
      <AdminDashboardLayout title="Google Analytics Dashboard">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Connected to: <span className="font-medium text-foreground">{status.email}</span> • Property: <span className="font-medium text-foreground">{status.propertyName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Refresh Data
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Traffic KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ts.users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users</CardTitle>
                <Users className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ts.newUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">First time visitors</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <MousePointerClick className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ts.avgEngagementRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Avg engagement</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor(ts.avgSessionDuration / 60)}m {ts.avgSessionDuration % 60}s</div>
                <p className="text-xs text-muted-foreground mt-1">Session duration</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Traffic Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Daily Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.traffic.daily}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickFormatter={(val) => val.substring(4, 8)} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="users" name="Users" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Acquisition Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.acquisition}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="sessions"
                        nameKey="channel"
                      >
                        {data.acquisition.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return null;
}
