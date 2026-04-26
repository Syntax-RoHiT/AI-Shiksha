import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, TrendingUp, ChevronUp, ChevronDown, Minus, Loader2 } from "lucide-react";
import { UnifiedDashboard } from "@/components/layout/UnifiedDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaderboardService, LeaderboardUser } from "@/lib/api/leaderboardService";

export default function Leaderboard() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('all-time');

    useEffect(() => {
        loadLeaderboard();
    }, [period]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await leaderboardService.getLeaderboard(period);
            setLeaderboard(data);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <UnifiedDashboard title="Leaderboard" subtitle="Top performing students">
            <div className="max-w-5xl mx-auto font-sans p-6">
                {/* Header Content */}
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-light text-[#1F1F1F]">Leaderboard</h2>
                    <p className="text-gray-500 mt-2">Compete with peers and earn XP by completing lessons</p>
                </div>

                {/* Period Filter */}
                <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mb-8">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-gray-100 p-1 rounded-full">
                        <TabsTrigger value="weekly" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Weekly
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Monthly
                        </TabsTrigger>
                        <TabsTrigger value="all-time" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            All Time
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-lms-blue" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-20">
                        <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No rankings yet</h3>
                        <p className="text-gray-500">Start learning to earn XP and climb the leaderboard!</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-8 md:gap-6 mb-12">

                            {/* Rank 2 */}
                            <div className="order-2 md:order-1 flex flex-col items-center">
                                <div className="relative">
                                    <Avatar className="h-20 w-20 border-4 border-gray-100 shadow-md">
                                        <AvatarImage src={leaderboard[1].avatar || ""} />
                                        <AvatarFallback className="bg-gray-100 text-gray-700 text-xl font-bold">
                                            {leaderboard[1].name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full border border-white">#2</div>
                                </div>
                                <div className="mt-4 text-center">
                                    <h3 className="font-bold text-[#1F1F1F]">{leaderboard[1].name}</h3>
                                    <p className="text-sm text-lms-blue font-semibold">{leaderboard[1].xp.toLocaleString()} XP</p>
                                </div>
                            </div>

                            {/* Rank 1 */}
                            <div className="order-1 md:order-2 flex flex-col items-center z-10 -mt-8 md:-mt-0">
                                <div className="relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                        <Crown className="h-10 w-10 text-yellow-400 fill-yellow-400 drop-shadow-sm animate-bounce" />
                                    </div>
                                    <Avatar className="h-28 w-28 border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-400/20">
                                        <AvatarImage src={leaderboard[0].avatar || ""} />
                                        <AvatarFallback className="bg-yellow-50 text-yellow-700 text-3xl font-bold">
                                            {leaderboard[0].name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-white text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm">#1</div>
                                </div>
                                <div className="mt-5 text-center">
                                    <h3 className="text-lg font-bold text-[#1F1F1F]">{leaderboard[0].name}</h3>
                                    <p className="text-base text-lms-blue font-bold">{leaderboard[0].xp.toLocaleString()} XP</p>
                                </div>
                            </div>

                            {/* Rank 3 */}
                            <div className="order-3 flex flex-col items-center">
                                <div className="relative">
                                    <Avatar className="h-20 w-20 border-4 border-amber-600/30 shadow-md">
                                        <AvatarImage src={leaderboard[2].avatar || ""} />
                                        <AvatarFallback className="bg-amber-50 text-amber-700 text-xl font-bold">
                                            {leaderboard[2].name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white">#3</div>
                                </div>
                                <div className="mt-4 text-center">
                                    <h3 className="font-bold text-[#1F1F1F]">{leaderboard[2].name}</h3>
                                    <p className="text-sm text-lms-blue font-semibold">{leaderboard[2].xp.toLocaleString()} XP</p>
                                </div>
                            </div>
                        </div>

                        {/* Full List */}
                        <Card className="border-none shadow-lg bg-white overflow-hidden rounded-2xl ring-1 ring-gray-100">
                            <CardContent className="p-0">
                                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                    <h3 className="font-semibold text-[#1F1F1F]">All Rankings</h3>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {leaderboard.map((student) => (
                                        <div key={student.id} className={`flex items-center px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors ${student.name === user?.name ? "bg-blue-50/60" : ""}`}>
                                            <div className="w-8 sm:w-12 text-center shrink-0">
                                                <span className={`text-sm font-bold ${student.rank === 1 ? "text-yellow-500" :
                                                    student.rank === 2 ? "text-gray-500" :
                                                        student.rank === 3 ? "text-amber-600" :
                                                            "text-gray-400"
                                                    }`}>
                                                    #{student.rank}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mr-2">
                                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-gray-100 shrink-0">
                                                    <AvatarImage src={student.avatar || ""} />
                                                    <AvatarFallback className="bg-gray-100 text-gray-600 font-medium text-xs">
                                                        {student.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${student.name === user?.name ? "text-lms-blue" : "text-[#1F1F1F]"}`}>
                                                        {student.name} {student.name === user?.name && "(You)"}
                                                    </p>
                                                    <p className="text-xs text-gray-400">Level {Math.floor(student.xp / 1000) + 1} Student</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center shrink-0">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[#1F1F1F]">{student.xp.toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">XP Earned</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </UnifiedDashboard>
    );
}
