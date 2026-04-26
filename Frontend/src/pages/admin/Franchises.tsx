
import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

// Components
import FranchiseServerSetup from "./Franchises/FranchiseServerSetup";
import AddFranchiseModal from "./Franchises/AddFranchiseModal";
import FranchisesList from "./Franchises/FranchisesList";
import FranchiseSetupInstructions from "./Franchises/FranchiseSetupInstructions";

interface Franchise {
  id: string;
  name: string;
  lms_name: string | null;
  domain: string;
  logo_url: string | null;
  primary_color: string | null;
  support_email: string | null;
  is_active: boolean;
  domain_verified: boolean;
  created_at: string;
  _count?: { users: number; courses: number; enrollments: number };
}

export default function FranchisesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFranchises();
    } else {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  const fetchFranchises = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/franchises");
      setFranchises(response.data);
    } catch {
      toast({ title: "Error", description: "Failed to load franchises.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSuspend = async (franchise: Franchise) => {
    try {
      const response = await api.patch(`/franchises/${franchise.id}/suspend`);
      setFranchises((prev) =>
        prev.map((f) => (f.id === franchise.id ? { ...f, is_active: response.data.is_active } : f))
      );
      toast({
        description: `Franchise "${franchise.name}" has been ${response.data.is_active ? "activated" : "suspended"}.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to update franchise status.", variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // VIEW: Franchise Admin (Setup Instructions only)
  // ------------------------------------------------------------------
  if (!isSuperAdmin) {
    if (user?.role === 'franchise_admin') {
      return (
        <AdminDashboardLayout title="Franchise Settings" subtitle="Configure your franchise instance">
          <div className="max-w-4xl mx-auto py-8">
            <FranchiseSetupInstructions />
          </div>
        </AdminDashboardLayout>
      );
    }

    return (
      <AdminDashboardLayout title="Franchise Management" subtitle="Manage your franchise network">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <ShieldOff className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Access Restricted</h3>
              <p className="text-muted-foreground max-w-sm">
                You don't have permission to manage franchises. Please contact the main domain administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ------------------------------------------------------------------
  // VIEW: Super Admin (Manage Network)
  // ------------------------------------------------------------------
  return (
    <AdminDashboardLayout title="Franchise Network" subtitle="Manage all academies and server configuration">
      <div className="space-y-8 animate-fade-in p-4 md:p-8">

        {/* 1. Statistics Overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="shadow-sm border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Franchises</p>
                <p className="text-2xl font-bold">{franchises.length}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Academies</p>
                <p className="text-2xl font-bold">{franchises.filter((f) => f.is_active).length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {franchises.reduce((sum, f) => sum + (f._count?.users || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Server Configuration */}
        <FranchiseServerSetup />

        {/* 3. Actions Row */}
        <div className="flex justify-end">
          <AddFranchiseModal onSuccess={fetchFranchises} />
        </div>

        {/* 4. Franchises List */}
        <FranchisesList
          franchises={franchises}
          isLoading={isLoading}
          onToggleSuspend={handleToggleSuspend}
          onRefresh={fetchFranchises}
        />
      </div>
    </AdminDashboardLayout>
  );
}