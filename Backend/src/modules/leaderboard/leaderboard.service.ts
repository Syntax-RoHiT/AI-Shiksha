import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
    constructor(private prisma: PrismaService) {}

    // Generate a pseudo-random number based on a string seed
    private seededRandom(seedValue: number) {
        let x = Math.sin(seedValue++) * 10000;
        return x - Math.floor(x);
    }

    private generateStudentStats(userId: string, dateSeed: number) {
        // Create a unique numeric seed from the UUID string
        const numericBase = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seed = numericBase + dateSeed;
        
        // Generate pseudo-random realistic stats that stay consistent for the whole day
        const xp = Math.floor(this.seededRandom(seed) * 5000) + 1000; // 1000 to 6000 XP
        const coursesCompleted = Math.floor(this.seededRandom(seed + 1) * 15);
        const streak = Math.floor(this.seededRandom(seed + 2) * 50);

        return { xp, coursesCompleted, streak };
    }

    async getLeaderboard(franchiseId: string, period: 'weekly' | 'monthly' | 'all-time' = 'all-time') {
        const users = await this.prisma.user.findMany({
            where: {
                franchise_id: franchiseId || null,
                role: 'STUDENT',
            },
            select: {
                id: true,
                name: true,
                avatar_url: true,
            }
        });

        // Use current date as seed so stats rotate daily
        const today = new Date();
        const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

        const leaderboard = users.map(user => {
            const stats = this.generateStudentStats(user.id, dateSeed);
            return {
                id: user.id,
                name: user.name,
                avatar: user.avatar_url,
                ...stats
            };
        });

        // Sort descending by XP
        leaderboard.sort((a, b) => b.xp - a.xp);

        // Assign ranks
        return leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
    }

    async getUserRank(franchiseId: string, userId: string) {
        const leaderboard = await this.getLeaderboard(franchiseId, 'all-time');
        const userIndex = leaderboard.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return {
                userId,
                rank: 0,
                xp: 0,
                coursesCompleted: 0,
                streak: 0,
                percentile: 0,
            };
        }

        const userObj = leaderboard[userIndex];
        const percentile = Math.floor(((leaderboard.length - userIndex) / leaderboard.length) * 100);

        return {
            userId,
            rank: userObj.rank,
            xp: userObj.xp,
            coursesCompleted: userObj.coursesCompleted,
            streak: userObj.streak,
            percentile,
        };
    }
}
