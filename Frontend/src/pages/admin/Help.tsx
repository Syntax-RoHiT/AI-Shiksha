import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { LifeBuoy } from "lucide-react";

export default function HelpPage() {
  return (
    <AdminDashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
          <LifeBuoy className="h-10 w-10 text-purple-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Help & Documentation</h1>
        <p className="text-lg text-slate-500 max-w-md">
          Comprehensive administrator documentation and support resources are currently being finalized and will be published here soon.
        </p>
      </div>
    </AdminDashboardLayout>
  );
}
