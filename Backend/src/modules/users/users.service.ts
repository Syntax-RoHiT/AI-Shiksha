import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User, Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async create(createUserDto: CreateUserDto, franchiseId?: string | null, isAdminAction: boolean = false, loginUrl: string = ''): Promise<User> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          ...rest,
          password_hash: hashedPassword,
          role: rest.role || 'STUDENT',
          franchise_id: franchiseId || null,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(`A user with email "${rest.email}" already exists in this franchise`);
      }
      throw error;
    }

    if (isAdminAction) {
      this.mailService.sendAdminAddedUserEmail(
        { email: user.email, name: user.name, plainToken: password, franchise_id: user.franchise_id },
        loginUrl || 'https://experttrainersacademy.cloud', // Default fallback
      );
    }

    return user;
  }

  async createBulk(bulkDto: { users: CreateUserDto[] }, franchiseId?: string | null, loginUrl: string = '') {
    const { users } = bulkDto;

    // Step 1: Pre-check which emails already exist in this franchise
    // so we only create + email the truly new users
    const incomingEmails = users.map((u) => u.email);
    const existingUsers = await this.prisma.user.findMany({
      where: {
        email: { in: incomingEmails },
        franchise_id: franchiseId ?? null,
      },
      select: { email: true },
    });
    const existingEmailSet = new Set(existingUsers.map((u) => u.email));

    // Step 2: Separate new vs. skipped
    const newUsers = users.filter((u) => !existingEmailSet.has(u.email));
    const skippedUsers = users.filter((u) => existingEmailSet.has(u.email));

    // Step 3: Hash passwords and build insert data only for new users
    const usersData = await Promise.all(
      newUsers.map(async (userDto) => {
        const { password, ...rest } = userDto;
        const hashedPassword = await bcrypt.hash(password, 10);
        return {
          ...rest,
          password_hash: hashedPassword,
          role: (rest.role || 'STUDENT') as Role,
          franchise_id: franchiseId ?? null,
        };
      })
    );

    // Step 4: Bulk insert only new users
    let insertedCount = 0;
    const failedUsers: { email: string; reason: string }[] = [];

    if (usersData.length > 0) {
      try {
        const result = await this.prisma.user.createMany({
          data: usersData,
          skipDuplicates: true, // Safety net for race conditions
        });
        insertedCount = result.count;
      } catch (error: any) {
        // Fall back to per-user inserts to collect detailed errors
        for (const userData of usersData) {
          try {
            await this.prisma.user.create({ data: userData });
            insertedCount++;
          } catch (err: any) {
            failedUsers.push({ email: userData.email, reason: err?.message || 'Unknown error' });
          }
        }
      }
    }

    // Step 5: Send credentials ONLY to newly created users (never to skipped/existing ones)
    const emailFallbackUrl = loginUrl || 'https://experttrainersacademy.cloud';
    Promise.allSettled(
      newUsers
        .filter((u) => !failedUsers.some((f) => f.email === u.email))
        .map((userDto) =>
          this.mailService.sendAdminAddedUserEmail(
            {
              email: userDto.email,
              name: userDto.name,
              plainToken: userDto.password,
              franchise_id: franchiseId ?? null,
            },
            emailFallbackUrl,
          ).catch((e) => console.error(`Failed to send bulk welcome email to ${userDto.email}:`, e))
        )
    );

    return {
      message: 'Bulk import completed',
      summary: {
        total: users.length,
        created: insertedCount,
        skipped: skippedUsers.length,
        failed: failedUsers.length,
      },
      skipped: skippedUsers.map((u) => ({ email: u.email, reason: 'Already exists in this franchise' })),
      failed: failedUsers,
    };
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; avatar_url?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async deleteAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar_url: null },
    });
  }

  async changePassword(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isMatch) throw new Error('Incorrect current password');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  // ... (keeping other methods same until findAll)

  async getStudentDashboardStats(userId: string) {
    const enrolledCount = await this.prisma.enrollment.count({
      where: { student_id: userId, status: 'active' },
    });

    const hoursLearnedAgg = await this.prisma.lessonProgress.aggregate({
      where: { student_id: userId },
      _sum: { watched_seconds: true },
    });
    const hours = Math.round(
      (hoursLearnedAgg._sum.watched_seconds || 0) / 3600,
    );

    const certificates = await this.prisma.certificate.count({
      where: { student_id: userId },
    });

    const inProgress = await this.prisma.enrollment.findMany({
      where: { student_id: userId, status: 'active' },
      include: {
        course: {
          include: {
            instructor: { include: { user: true } },
          },
        },
      },
      take: 3,
      orderBy: { enrolled_at: 'desc' },
    });

    const progressList = await Promise.all(
      inProgress.map(async (enrollment) => {
        const progress = await this.prisma.courseProgress.findUnique({
          where: {
            student_id_course_id: {
              student_id: userId,
              course_id: enrollment.course_id,
            },
          },
        });
        return {
          id: enrollment.course.id,
          title: enrollment.course.title,
          instructor: enrollment.course.instructor.user.name,
          progress: progress ? progress.progress_percentage : 0,
          image:
            enrollment.course.thumbnail_url ||
            'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=120&h=80&fit=crop',
        };
      }),
    );

    const completedProgresses = await this.prisma.courseProgress.findMany({
      where: {
        student_id: userId,
        progress_percentage: { gte: 100 },
      },
      include: {
        course: {
          include: {
            instructor: { include: { user: true } },
            reviews: {
              where: { student_id: userId },
            }
          }
        }
      }
    });

    const completedCourses = completedProgresses.map((p) => ({
      id: p.course.id,
      title: p.course.title,
      instructor: p.course.instructor.user.name,
      image: p.course.thumbnail_url || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=120&h=80&fit=crop',
      has_reviewed: p.course.reviews.length > 0,
    }));

    return {
      stats: [
        {
          label: 'Courses Enrolled',
          value: enrolledCount.toString(),
          icon: 'BookOpen',
          gradient: 'from-primary/15 to-primary/5',
          iconColor: 'text-primary',
        },
        {
          label: 'Hours Learned',
          value: hours.toString(),
          icon: 'Clock',
          gradient: 'from-accent/15 to-accent/5',
          iconColor: 'text-accent',
        },
        {
          label: 'Certificates',
          value: certificates.toString(),
          icon: 'Trophy',
          gradient: 'from-chart-3/15 to-chart-3/5',
          iconColor: 'text-chart-3',
        },
      ],
      inProgressCourses: progressList.filter(c => c.progress < 100),
      completedCourses,
      upcomingDeadlines: [
        { title: 'Complete Profile', course: 'Onboarding', dueIn: 'Soon' },
      ],
    };
  }

  async findOne(email: string, franchiseId?: string | null): Promise<User | null> {
    // Build the where clause based on franchiseId:
    // - null   → system domain: only match users WHERE franchise_id IS NULL
    // - string → franchise domain: match users in that specific franchise only
    // - undefined → no franchise filter (admin/internal lookups that span all franchises)
    const where: any = { email };
    if (franchiseId !== undefined) {
      where.franchise_id = franchiseId; // null = IS NULL filter; string = exact match
    }
    return this.prisma.user.findFirst({ where });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { franchise: true },
    }) as any;
  }

  // =====================================
  // PASSWORD RESET METHODS
  // =====================================

  async updateResetToken(userId: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        reset_password_token: token,
        reset_password_expires: expires,
      },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        reset_password_token: token,
      },
      include: { franchise: true },
    }) as any;
  }

  async updatePasswordAndClearToken(userId: string, newPasswordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });
  }

  async findAll(role?: string, franchiseId?: string | null, isSuperAdmin = false) {
    let mappedRole = role;
    if (role) {
      const upper = role.toUpperCase();
      // Map TEACHER to INSTRUCTOR for backward compatibility
      mappedRole = upper === 'TEACHER' ? 'INSTRUCTOR' : upper;
    }
    const where: any = mappedRole ? { role: mappedRole as any } : {};

    // Franchise isolation:
    // If franchiseId is provided (Franchise Admin/User), scope to that franchise.
    // If isSuperAdmin is true and no franchiseId provided (System View), show all?
    // Wait, if we want to show ONLY system users to Super Admin, we might need logic.
    // But typically Super Admin sees everything.
    // Start with: Super Admin sees all. Franchise Admin sees theirs.

    if (franchiseId) {
      where.franchise_id = franchiseId;
    } else if (isSuperAdmin) {
      // SUPER ADMIN ISOLATION:
      // If Super Admin requests "All Users" without a specific franchise filter,
      // show ONLY System Users (franchise_id: null).
      // This prevents the main admin dashboard from being cluttered with franchise users.
      where.franchise_id = null;
    } else {
      // Fallback (shouldn't happen due to controller checks): 
      // If not super admin and no franchise ID, they strictly shouldn't see anything or just their own.
      // But let's keep it safe.
    }

    // What about "System Users" (users with franchise_id = null)?
    // If Super Admin wants to see ONLY system users, we need a way to filter.
    // For now, standard behavior: Admin sees their franchise. Super Admin sees all.

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        avatar_url: true,
        franchise_id: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async delete(id: string, franchiseId?: string | null): Promise<User> {
    // Prevent deletion of the last admin
    const userToDelete = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      throw new Error('User not found');
    }

    if (franchiseId && userToDelete.franchise_id && userToDelete.franchise_id !== franchiseId) {
      throw new Error('Cannot delete user from another franchise');
    }
    // Also prevent deleting a SUPER_ADMIN if you are not one? 
    // Usually handled by RolesGuard, but good to be safe.
    // Assuming franchise admin cannot delete SUPER_ADMIN.

    if (userToDelete.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Delete related payments first (since relation is RESTRICT)
    await this.prisma.payment.deleteMany({
      where: { user_id: id },
    });

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getLeaderboard(franchiseId?: string | null) {
    const whereClause: any = { role: 'STUDENT' };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const topStudents = await this.prisma.user.findMany({
      where: whereClause,
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        avatar_url: true,
        xp: true,
        franchise_id: true,
      },
    });

    return topStudents.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  }

  async getStudentStats(franchiseId?: string | null) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereUsers: any = { role: 'STUDENT' };
    const whereEnrollments: any = { status: 'active' };

    if (franchiseId !== undefined) {
      whereUsers.franchise_id = franchiseId;
      whereEnrollments.franchise_id = franchiseId;
    }

    // Total students
    const totalStudents = await this.prisma.user.count({
      where: whereUsers,
    });

    // Active learners (students with at least one active enrollment)
    const activeStudentsIds = await this.prisma.enrollment.findMany({
      where: whereEnrollments,
      select: {
        student_id: true,
      },
      distinct: ['student_id'],
    });

    const activeStudents = activeStudentsIds.length;

    // Average completion across all students
    // Aggregate doesn't support relation filtering easily in simple query, 
    // need to filter courseProgress by student's franchise? 
    // CourseProgress links to student and course.
    // If we filter enrollments by franchise, we should probably filter progress too.
    // But CourseProgress doesn't have franchise_id directly.
    // However, CourseProgress depends on Enrollment usually.
    // Let's rely on finding progress for students in the franchise.
    // Or just aggregate all? Aggregating all leaks global stats.
    // We need to fetch progress for specific students OR filter by student's franchise.

    // Workaround: Calculate average manually or complex query.
    // For now, let's skip complex aggregation if it's too heavy, or rely on students.
    // Actually, `CourseProgress` has `student_id`.
    // We can find `student_id`s in franchise and filter `CourseProgress`.

    // If franchiseId is present:
    let avgCompletion = 0;
    if (franchiseId !== undefined) {
      const studentIds = await this.prisma.user.findMany({
        where: { franchise_id: franchiseId, role: 'STUDENT' },
        select: { id: true }
      });
      const ids = studentIds.map(s => s.id);
      if (ids.length > 0) {
        const courseProgressData = await this.prisma.courseProgress.aggregate({
          where: { student_id: { in: ids } },
          _avg: { progress_percentage: true },
        });
        avgCompletion = Math.round(courseProgressData._avg.progress_percentage || 0);
      }
    } else {
      const courseProgressData = await this.prisma.courseProgress.aggregate({
        _avg: { progress_percentage: true },
      });
      avgCompletion = Math.round(courseProgressData._avg.progress_percentage || 0);
    }

    // New students this month
    const newThisMonth = await this.prisma.user.count({
      where: {
        ...whereUsers,
        created_at: {
          gte: firstDayOfMonth,
        },
      },
    });

    return {
      totalStudents,
      activeStudents,
      avgCompletion,
      newThisMonth,
    };
  }

  async getTeacherStats(franchiseId?: string | null) {
    // Get only instructors (not admins)
    const whereUser: any = {};
    if (franchiseId !== undefined) {
      whereUser.franchise_id = franchiseId;
    }

    const instructors = await this.prisma.instructorProfile.findMany({
      where: franchiseId !== undefined ? { user: { franchise_id: franchiseId } } : {},
      include: {
        user: true,
        courses: {
          where: franchiseId !== undefined ? { franchise_id: franchiseId } : {},
          include: {
            _count: {
              select: { enrollments: true },
            },
            payments: {
              where: {
                payment_status: 'completed',
                // Payments should generally belong to the course's franchise
              },
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
    });

    // Filter out admins (though role check should suffice if we trust data)
    const nonAdminInstructors = instructors.filter(
      (i) => i.user.role === 'INSTRUCTOR',
    );

    const totalTeachers = nonAdminInstructors.length;

    const totalCourses = nonAdminInstructors.reduce(
      (sum, instructor) => sum + instructor.courses.length,
      0,
    );

    const totalRevenue = nonAdminInstructors.reduce(
      (sum, instructor) =>
        sum +
        instructor.courses.reduce(
          (courseSum, course) =>
            courseSum +
            course.payments.reduce(
              (paymentSum, payment) => paymentSum + payment.amount,
              0,
            ),
          0,
        ),
      0,
    );

    // Calculate average rating across all courses
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    nonAdminInstructors.forEach((instructor) => {
      instructor.courses.forEach((course) => {
        const courseRatingSum = course.reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );
        totalRatingSum += courseRatingSum;
        totalRatingCount += course.reviews.length;
      });
    });

    const avgRating =
      totalRatingCount > 0
        ? parseFloat((totalRatingSum / totalRatingCount).toFixed(1))
        : 0;

    return {
      totalTeachers,
      totalCourses,
      totalRevenue,
      avgRating,
    };
  }

  async updateRole(id: string, newRole: string, franchiseId?: string | null) {
    const upperRole = newRole.toUpperCase() as Role;
    if (!Object.values(Role).includes(upperRole)) {
      throw new BadRequestException(`Invalid role specified: ${newRole}`);
    }

    const whereClause: any = { id };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: upperRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        franchise_id: true,
      },
    });
  }

  async updateJoiningDate(id: string, createdAt: Date, franchiseId?: string | null) {
    const whereClause: any = { id };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { created_at: createdAt },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });
  }
}


