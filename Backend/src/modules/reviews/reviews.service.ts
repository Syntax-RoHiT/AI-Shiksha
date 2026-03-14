import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async upsertReview(userId: string, createReviewDto: CreateReviewDto) {
        const { course_id, rating, comment } = createReviewDto;

        // Check if course exists
        const course = await this.prisma.course.findUnique({
            where: { id: course_id },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // Upsert the review (create if not exists, update if exists)
        const review = await this.prisma.review.upsert({
            where: {
                student_id_course_id: {
                    student_id: userId,
                    course_id: course_id,
                },
            },
            update: {
                rating,
                comment,
            },
            create: {
                student_id: userId,
                course_id: course_id,
                rating,
                comment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                    }
                }
            }
        });

        return review;
    }

    async getCourseRatingStats(courseId: string) {
        const stats = await this.prisma.review.aggregate({
            where: { course_id: courseId },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });

        return {
            averageRating: stats._avg.rating || 0,
            totalReviews: stats._count.rating,
        };
    }

    async getReviewsForCourse(courseId: string) {
        return this.prisma.review.findMany({
            where: { course_id: courseId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async getUserReview(userId: string, courseId: string) {
        const review = await this.prisma.review.findUnique({
            where: {
                student_id_course_id: {
                    student_id: userId,
                    course_id: courseId,
                },
            },
        });

        if (!review) {
            return null;
        }

        return review;
    }
}
