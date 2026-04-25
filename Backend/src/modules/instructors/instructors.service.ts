import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { UserRole } from '../users/dto/create-user.dto';

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createInstructorDto: CreateInstructorDto) {
    // Check if user exists and upgrade role if needed?
    // Or assume user must apply?
    // Let's just create the profile.

    // Check if profile exists
    const existing = await this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
    });
    if (existing) {
      throw new BadRequestException('Instructor profile already exists');
    }

    // Update user role to INSTRUCTOR if not already?
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.INSTRUCTOR },
    });

    return this.prisma.instructorProfile.create({
      data: {
        user_id: userId,
        ...createInstructorDto,
      },
      include: { user: true },
    });
  }

  async findAll() {
    return this.prisma.instructorProfile.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { id },
      include: { user: true, courses: true },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');
    return instructor;
  }

  async toggleVerification(id: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { id },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    return this.prisma.instructorProfile.update({
      where: { id },
      data: { verified: !instructor.verified },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
      include: { user: true, courses: true },
    });
  }

  async update(id: string, updateInstructorDto: UpdateInstructorDto, userId: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor profile not found');
    }

    if (instructor.user_id !== userId) {
      throw new BadRequestException('You do not own this profile');
    }

    const { name, avatar_url, bio, ...profileData } = updateInstructorDto;

    return this.prisma.$transaction(async (prisma) => {
      // Update instructor profile
      const updatedProfile = await prisma.instructorProfile.update({
        where: { id },
        data: profileData,
      });

      // Update user details if provided
      if (name !== undefined || avatar_url !== undefined || bio !== undefined) {
        await prisma.user.update({
          where: { id: instructor.user_id },
          data: {
            name: name !== undefined ? name : instructor.user.name,
            avatar_url: avatar_url !== undefined ? avatar_url : instructor.user.avatar_url,
            bio: bio !== undefined ? bio : instructor.user.bio,
          },
        });
      }

      return updatedProfile;
    });
  }

  async getDashboardStats(userId: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
      include: { courses: true },
    });

    if (!instructor) {
      throw new BadRequestException('Instructor profile not found');
    }

    const courseIds = instructor.courses.map((c) => c.id);

    const totalStudents = await this.prisma.enrollment.count({
      where: { course_id: { in: courseIds } },
    });

    const draftCoursesCount = await this.prisma.course.count({
      where: { instructor_id: instructor.id, status: 'DRAFT' }
    });
    
    const publishedCoursesCount = await this.prisma.course.count({
      where: { instructor_id: instructor.id, status: 'PUBLISHED' }
    });

    // Calculate rating
    const reviews = await this.prisma.review.aggregate({
      where: { course_id: { in: courseIds } },
      _avg: { rating: true },
    });

    // Top Courses
    const courses = await this.prisma.course.findMany({
      where: { instructor_id: instructor.id, status: 'PUBLISHED' },
      include: {
        _count: { select: { enrollments: true } },
      },
      take: 5,
    });

    const topCourses = courses
      .map((c) => {
        return {
          title: c.title,
          students: c._count.enrollments,
          slug: c.slug,
          rating: 0, // Real rating calculation per course is more complex, keeping simple or 0 for now
        };
      })
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    // Recently Enrolled Students
    const recentEnrollments = await this.prisma.enrollment.findMany({
      where: { course_id: { in: courseIds } },
      include: {
        user: {
          select: { name: true, email: true, avatar_url: true }
        },
        course: {
          select: { title: true }
        }
      },
      orderBy: { enrolled_at: 'desc' },
      take: 5
    });

    const recentStudents = recentEnrollments.map(e => ({
      name: e.user.name,
      email: e.user.email,
      avatar_url: e.user.avatar_url,
      course: e.course.title,
      enrolled_at: e.enrolled_at,
    }));

    return {
      stats: [
        {
          label: 'Total Students',
          value: totalStudents.toString(),
          change: '+0%',
          icon: 'Users',
          gradient: 'from-accent/15 to-accent/5',
          iconColor: 'text-accent',
        },
        {
          label: 'Published Courses',
          value: publishedCoursesCount.toString(),
          icon: 'BookOpen',
          gradient: 'from-chart-3/15 to-chart-3/5',
          iconColor: 'text-chart-3',
        },
        {
          label: 'Draft Courses',
          value: draftCoursesCount.toString(),
          icon: 'FileText',
          gradient: 'from-primary/15 to-primary/5',
          iconColor: 'text-primary',
        },
        {
          label: 'Avg. Rating',
          value: (reviews._avg.rating || 0).toFixed(1),
          icon: 'Star',
          gradient: 'from-chart-4/15 to-chart-4/5',
          iconColor: 'text-chart-4',
        },
      ],
      topCourses,
      recentStudents,
    };
  }

  async findAllWithStats(franchiseId?: string | null) {
    const userWhere: any = {};
    if (franchiseId !== undefined) {
      userWhere.user = { franchise_id: franchiseId };
    }

    const instructors = await this.prisma.instructorProfile.findMany({
      where: userWhere,
      include: {
        user: true,
        courses: {
          include: {
            _count: { select: { enrollments: true } },
            payments: true,
            reviews: { select: { rating: true } },
          },
        },
      },
    });

    return instructors.map((instructor) => {
      const totalCourses = instructor.courses.length;
      const totalStudents = instructor.courses.reduce(
        (sum, c) => sum + c._count.enrollments,
        0,
      );
      const totalRevenue = instructor.courses.reduce(
        (sum, c) => sum + c.payments.reduce((psum, p) => psum + p.amount, 0),
        0,
      );

      let totalRatingSum = 0;
      let totalRatingCount = 0;
      instructor.courses.forEach((c) => {
        const courseRatingSum = c.reviews.reduce((sum, r) => sum + r.rating, 0);
        totalRatingSum += courseRatingSum;
        totalRatingCount += c.reviews.length;
      });
      const averageRating =
        totalRatingCount > 0
          ? (totalRatingSum / totalRatingCount).toFixed(1)
          : '0.0';

      return {
        id: instructor.id,
        name: instructor.user.name,
        email: instructor.user.email,
        courses: totalCourses,
        students: totalStudents,
        revenue: totalRevenue,
        rating: parseFloat(averageRating),
        status: instructor.verified ? 'verified' : 'pending',
        avatar: instructor.user.avatar_url,
      };
    });
  }

  async getStudents(userId: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
      include: { courses: true },
    });

    if (!instructor) {
      throw new BadRequestException('Instructor profile not found');
    }

    const courseIds = instructor.courses.map((c) => c.id);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: { in: courseIds } },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true }
        },
        course: {
          select: { title: true }
        }
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return enrollments.map(e => ({
      id: e.user.id,
      name: e.user.name,
      email: e.user.email,
      avatar_url: e.user.avatar_url,
      courseTitle: e.course.title,
      enrolledAt: e.enrolled_at,
      progress: e.progress_percentage || 0
    }));
  }

  async getReviews(userId: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
      include: { courses: true },
    });

    if (!instructor) {
      throw new BadRequestException('Instructor profile not found');
    }

    const courseIds = instructor.courses.map((c) => c.id);

    return this.prisma.review.findMany({
      where: { course_id: { in: courseIds } },
      include: {
        user: {
          select: { name: true, avatar_url: true }
        },
        course: {
          select: { title: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getQA(userId: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
      include: { courses: true },
    });

    if (!instructor) {
      throw new BadRequestException('Instructor profile not found');
    }

    const courseIds = instructor.courses.map((c) => c.id);

    return this.prisma.courseQA.findMany({
      where: { course_id: { in: courseIds } },
      include: {
        student: {
          select: { name: true, avatar_url: true }
        },
        course: {
          select: { title: true }
        },
        replies: {
          include: {
            user: {
              select: { name: true, avatar_url: true }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }
}
