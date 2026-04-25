import { useState, useEffect, useMemo } from "react";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowUpDown } from "lucide-react";
import api from "@/lib/api";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";

export default function AdminTransactions() {
  const { branding } = useFranchise();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      // Since we don't have a specific global transactions endpoint without user_id context ready in Transactions app yet,
      // I am fetching it from my backend payments endpoint. Note: The backend requirements specified:
      // "API: Get Transactions." Let's fetch from a new endpoint we will create or use existing if any.
      // Wait, let's create it in RazorpayController if it wasn't there, or use existing transactions service?
      // For now, I'll fetch from /payments/razorpay/transactions which we need to make sure exists or just use a mock initially.
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
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Analytics Overview (GDL style) */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium tracking-tight text-muted-foreground">Total Revenue</p>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                  <Badge variant="outline" className="border-transparent bg-transparent text-emerald-600 dark:text-emerald-400">
                    <ArrowUpDown className="h-4 w-4" />
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tracking-tight" style={{ color: branding.primary_color }}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-muted-foreground">From successful payments</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium tracking-tight text-muted-foreground">Transactions</p>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                   <div className="h-4 w-4 text-blue-600 dark:text-blue-400 font-bold text-center leading-4">#</div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tracking-tight">{stats.totalTransactions}</span>
                <p className="text-xs text-muted-foreground">Total payment attempts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 ring-1 ring-zinc-200 dark:ring-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium tracking-tight text-muted-foreground">Success Rate</p>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                  <div className="h-4 w-4 text-indigo-600 dark:text-indigo-400 font-bold text-center leading-4">%</div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tracking-tight">{stats.successRate}%</span>
                <p className="text-xs text-muted-foreground">Successful transactions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
          <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>A list of recent payments processing through Razorpay.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Payment ID</TableHead>
                  <TableHead className="whitespace-nowrap">Order ID</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Course</TableHead>
                  <TableHead className="whitespace-nowrap">Method</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="whitespace-nowrap">{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{txn.transaction_id || '-'}</TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{txn.order_id || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium text-sm">{txn.billing_name || txn.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{txn.billing_email || txn.user?.email || ''}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{txn.course?.title || 'Unknown'}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{txn.payment_provider || 'Stripe'}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {txn.currency} {(txn.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          txn.payment_status === 'success' ? 'default' :
                          txn.payment_status === 'failed' ? 'destructive' : 'secondary'
                        } className="font-medium">
                          {txn.payment_status}
                        </Badge>
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
