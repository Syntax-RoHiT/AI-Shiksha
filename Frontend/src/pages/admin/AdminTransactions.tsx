import { useState, useEffect, useMemo } from "react";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown, DollarSign, Activity, CheckCircle2, XCircle, CreditCard, UserCheck } from "lucide-react";
import api from "@/lib/api";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminTransactions() {
  const { branding } = useFranchise();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/razorpay/transactions');
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(t => 
      t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const totalTransactions = data.length;
    const successfulTransactions = data.filter(t => t.payment_status === 'success');
    const totalRevenue = successfulTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0;
    
    return {
      totalRevenue,
      totalTransactions,
      successRate: successRate.toFixed(1)
    };
  }, [data]);

  return (
    <AdminDashboardLayout title="Transactions" subtitle="View and manage all payment transactions for your franchise.">
      <div className="p-3 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-8">
        
        {/* Dynamic Header */}
        <div className="relative overflow-hidden rounded-none bg-zinc-950 p-5 md:p-8 shadow-2xl border border-white/10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-blue-500/20 opacity-50 transition-opacity duration-1000 group-hover:opacity-70"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/30 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Revenue Center
              </h2>
              <p className="text-sm md:text-lg text-white/60 font-medium max-w-xl">
                Monitor real-time cash flow, successful checkouts, and payment statuses.
              </p>
            </div>
            <div className="shrink-0 relative w-full md:w-80">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/40" />
              </div>
              <Input
                placeholder="Search Txn ID, Order ID, or Name..."
                className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none focus-visible:ring-emerald-500 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-md font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Floating Glass Stats */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 sm:p-8 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-none flex items-center justify-center shadow-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Badge variant="outline" className="text-xs font-bold rounded-none bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 uppercase tracking-widest px-3 py-1">
                  Gross
                </Badge>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Collected</p>
              </div>
            </div>
          </div>

          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 sm:p-8 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-none flex items-center justify-center shadow-sm bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="outline" className="text-xs font-bold rounded-none bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 uppercase tracking-widest px-3 py-1">
                  Volume
                </Badge>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.totalTransactions}</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Transactions Processed</p>
              </div>
            </div>
          </div>

          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-fuchsia-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 sm:p-8 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-none flex items-center justify-center shadow-sm bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Activity className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <Badge variant="outline" className="text-xs font-bold rounded-none bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 uppercase tracking-widest px-3 py-1">
                  Health
                </Badge>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.successRate}%</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-black/5 dark:border-white/5 p-6 bg-white/40 dark:bg-zinc-950/40">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-zinc-400" />
              Transaction Ledger
            </h3>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Syncing Ledger...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center px-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-none flex items-center justify-center mb-2">
                  <Search className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">No transactions found</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {filteredData.map((txn) => {
                  const isSuccess = txn.payment_status === 'success';
                  const isFailed = txn.payment_status === 'failed';
                  
                  return (
                    <div key={txn.id} className="group p-4 md:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row gap-4 md:items-center justify-between">
                      
                      {/* Left: Status & Primary Info */}
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "mt-1 shrink-0 w-10 h-10 rounded-none flex items-center justify-center shadow-sm",
                          isSuccess ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                          isFailed ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                          "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}>
                          {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : 
                           isFailed ? <XCircle className="h-5 w-5" /> : 
                           <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-none border border-black/10 dark:border-white/10 shrink-0">
                            <AvatarImage src={txn.user?.avatar_url} alt={txn.user?.name} />
                            <AvatarFallback className="rounded-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                              {(txn.billing_name || txn.user?.name || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 max-w-[200px] sm:max-w-md">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">
                              {txn.billing_name || txn.user?.name || 'Unknown Customer'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                              <span className="truncate max-w-[120px]" title={txn.transaction_id}>{txn.transaction_id || 'PENDING-TXN'}</span>
                              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="hidden sm:inline">{new Date(txn.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Course Context (Hidden on very small screens, stacks on medium) */}
                      <div className="hidden md:flex flex-col items-start justify-center flex-1 max-w-xs px-4 border-l border-black/5 dark:border-white/5">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Purchased Item</p>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate w-full" title={txn.course?.title}>
                          {txn.course?.title || 'Unknown Course / General'}
                        </p>
                      </div>

                      {/* Right: Amount & Badges */}
                      <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[200px]">
                        <div className="md:hidden text-xs font-mono text-zinc-500">
                           {new Date(txn.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "text-lg font-black tracking-tight",
                              isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"
                            )}>
                              {txn.currency} {(txn.amount).toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {txn.payment_provider === 'admin_enrolled' ? (
                                <Badge variant="outline" className="rounded-none text-[9px] px-1.5 py-0.5 border uppercase tracking-wider font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20 flex items-center gap-1">
                                  <UserCheck className="h-2.5 w-2.5" />
                                  Admin Enrolled
                                </Badge>
                              ) : (
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                  {txn.payment_provider || 'Razorpay'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminDashboardLayout>
  );
}
