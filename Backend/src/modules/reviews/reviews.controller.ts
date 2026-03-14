import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    @Post()
    async submitReview(@Req() req, @Body() createReviewDto: CreateReviewDto) {
        return this.reviewsService.upsertReview(req.user.userId, createReviewDto);
    }

    @Get('course/:courseId/stats')
    async getCourseStats(@Param('courseId') courseId: string) {
        return this.reviewsService.getCourseRatingStats(courseId);
    }

    @Get('course/:courseId')
    async getCourseReviews(@Param('courseId') courseId: string) {
        return this.reviewsService.getReviewsForCourse(courseId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me/:courseId')
    async getMyReview(@Req() req, @Param('courseId') courseId: string) {
        return this.reviewsService.getUserReview(req.user.userId, courseId);
    }
}
