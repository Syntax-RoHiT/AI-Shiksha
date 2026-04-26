import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search, CreditCard, Loader2, ReceiptText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { UnifiedDashboard } from "@/components/layout/UnifiedDashboard";
import { Input } from "@/components/ui/input";
import { transactionsService, Transaction } from "@/lib/api/transactionsService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await transactionsService.getMyTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (id: number | string) => {
        try {
            setDownloadingId(id);
            await transactionsService.downloadInvoice(id);
            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to download invoice");
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

    const filteredTransactions = transactions.filter(t =>
        t.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return { icon: CheckCircle2, label: 'Completed', className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' };
            case 'refunded':
                return { icon: XCircle, label: 'Refunded', className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' };
            default:
                return { icon: Clock, label: status, className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' };
        }
    };

    const totalSpent = transactions
        .filter(t => t.status.toLowerCase() === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <UnifiedDashboard title="Transactions" subtitle="Your complete payment history">
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Transactions', value: transactions.length.toString(), accent: 'from-violet-500/20 to-indigo-500/10' },
                        { label: 'Total Spent', value: formatCurrency(totalSpent), accent: 'from-emerald-500/20 to-teal-500/10' },
                        { label: 'Courses Purchased', value: transactions.filter(t => t.status === 'completed').length.toString(), accent: 'from-blue-500/20 to-cyan-500/10' },
                    ].map((stat) => (
                        <div key={stat.label} className={cn(
                            "relative overflow-hidden rounded-none border border-black/5 dark:border-white/10",
                            "bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm p-5"
                        )}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-60`} />
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ledger Card */}
                <div className="rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="border-b border-black/5 dark:border-white/5 p-4 bg-white/40 dark:bg-zinc-950/30 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <ReceiptText className="h-4 w-4 text-zinc-400" />
                            Payment History
                        </h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search by course or ID..."
                                className="pl-9 h-9 rounded-none bg-white/50 dark:bg-zinc-800/50 border-black/10 dark:border-white/10 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Ledger Header */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-black/5 dark:border-white/5 bg-zinc-50/80 dark:bg-zinc-950/50">
                        {['Course', 'Transaction ID', 'Date', 'Amount', 'Invoice'].map((h) => (
                            <p key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</p>
                        ))}
                    </div>

                    {/* Ledger Body */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
                            <div className="w-14 h-14 rounded-none bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <ReceiptText className="h-7 w-7 text-zinc-300 dark:text-zinc-600" />
                            </div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">No transactions yet</p>
                            <p className="text-xs text-zinc-500">Your purchases will appear here once you enroll in a paid course.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredTransactions.map((trx) => {
                                const statusConfig = getStatusConfig(trx.status);
                                const StatusIcon = statusConfig.icon;
                                return (
                                    <div
                                        key={trx.id}
                                        className="group grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 items-center px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Course */}
                                        <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                                            <div className="h-9 w-9 shrink-0 rounded-none bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                                                <CreditCard className="h-4 w-4 text-indigo-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-zinc-900 dark:text-white truncate" title={trx.courseName}>
                                                    {trx.courseName}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 uppercase tracking-widest truncate">{trx.paymentMethod}</p>
                                            </div>
                                        </div>

                                        {/* Transaction ID */}
                                        <div>
                                            <span className="md:hidden text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Txn ID</span>
                                            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate">{trx.transactionId}</p>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <span className="md:hidden text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Date</span>
                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatDate(trx.date)}</p>
                                        </div>

                                        {/* Amount */}
                                        <div className="col-span-1 md:col-span-1">
                                            <span className="md:hidden text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Amount</span>
                                            <p className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(trx.amount)}</p>
                                            <Badge variant="outline" className={cn("rounded-none text-[9px] px-1.5 py-0.5 border uppercase tracking-wider font-bold mt-1 flex items-center gap-1 w-fit", statusConfig.className)}>
                                                <StatusIcon className="h-2.5 w-2.5" />
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Invoice Download */}
                                        <div className="flex items-center justify-end md:justify-start col-span-1 md:col-span-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-none border border-transparent hover:border-black/10 dark:hover:border-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                                onClick={() => handleDownloadInvoice(trx.id)}
                                                disabled={downloadingId === trx.id}
                                                title="Download PDF Invoice"
                                            >
                                                {downloadingId === trx.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </UnifiedDashboard>
    );
}
