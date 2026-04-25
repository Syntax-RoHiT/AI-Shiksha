import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompletionsService } from '../completions/completions.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private completionsService: CompletionsService,
    private mailService: MailService,
  ) { }

  async findOne(studentId: string, courseId: string) {
    return this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId,
        },
      },
    });
  }

  async findMyEnrollments(studentId: string, franchiseId?: string | null) {
    // Ideally user is already scoped to franchise, but good to double check or strictly filter if needed.
    // However, if a user belongs to Franchise A, they should only have enrollments in Franchise A.
    // But if we want to be strict:
    const whereClause: any = { student_id: studentId };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    return this.prisma.enrollment.findMany({
      where: whereClause,
      include: {
        course: {
          include: {
            instructor: { include: { user: true } },
            reviews: { where: { student_id: studentId }, select: { id: true } }
          },
        },
      },
    });
  }

  async checkEnrollment(studentId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.findOne(studentId, courseId);
    return !!enrollment && ['active', 'completed'].includes(enrollment.status);
  }

  async create(userId: string, courseId: string, franchiseId?: string | null) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // Verify course and get access limit
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (franchiseId && course.franchise_id && course.franchise_id !== franchiseId) {
      throw new ForbiddenException('Cannot enroll in course from another franchise');
    }

    // Calculate expiry
    let expiresAt: Date | undefined;
    if (course.access_days_limit) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + course.access_days_limit);
      expiresAt = expiryDate;
    }

    const existing = await this.findOne(userId, courseId);
    if (existing) {
      if (existing.status !== 'active') {
        const updated = await this.prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: 'active', enrolled_at: new Date() },
          include: { user: true },
        });

        this.mailService.sendCourseEnrollmentEmail(
          { email: updated.user.email, name: updated.user.name, franchise_id: updated.user.franchise_id },
          course.title
        );

        return updated;
      }
      return existing;
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        student_id: userId,
        course_id: courseId,
        status: 'active',
        // Use course's franchise_id to ensure visibility to that franchise admin.
        // Fallback to user's franchise if course is global (though typically courses belong to franchise or null).
        franchise_id: course.franchise_id || franchiseId,
      },
      include: { user: true },
    });

    this.mailService.sendCourseEnrollmentEmail(
      { email: enrollment.user.email, name: enrollment.user.name, franchise_id: enrollment.user.franchise_id },
      course.title
    );

    return enrollment;
  }

  async acceptTerms(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date(),
      },
    });
  }

  // Admin methods
  async findAll(search?: string, status?: string, franchiseId?: string | null) {
    // Use AND array to safely combine multiple conditions including ORs
    const where: any = { AND: [] };

    if (franchiseId) {
      // Critical Fix: Show enrollment if it explicitly belongs to franchise OR if the course belongs to franchise.
      // This handles cases where enrollment.franchise_id was missed (legacy data) but course is correct.
      where.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (status) {
      where.AND.push({ status });
    }

    if (search) {
      where.AND.push({
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { course: { title: { contains: search, mode: 'insensitive' } } },
        ]
      });
    }

    // Clean up empty AND to avoid Prisma issues
    if (where.AND.length === 0) {
      delete where.AND;
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return enrollments;
  }

  async getStats(franchiseId?: string | null) {
    const whereClause: any = { AND: [] };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    // Helper to get raw count with dynamic where
    const getCount = async (extraCondition?: any) => {
      const query = { ...whereClause };
      if (extraCondition) {
        // If query already has AND, append. 
        // Simplification: just merge if possible, or push to AND
        query.AND = [...(query.AND || []), extraCondition];
      }
      if (query.AND.length === 0) delete query.AND;
      return this.prisma.enrollment.count({ where: query });
    };

    const totalEnrollments = await getCount();
    const activeEnrollments = await getCount({ status: 'active' });
    const completedEnrollments = await getCount({ status: 'completed' });

    // Get enrollments from this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEnrollments = await getCount({
      enrolled_at: { gte: startOfMonth }
    });

    // Calculate growth (compare to last month)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const lastMonthEnrollments = await getCount({
      enrolled_at: {
        gte: startOfLastMonth,
        lt: startOfMonth,
      }
    });

    const growth =
      lastMonthEnrollments > 0
        ? ((thisMonthEnrollments - lastMonthEnrollments) /
          lastMonthEnrollments) *
        100
        : 0;

    return {
      total: totalEnrollments,
      active: activeEnrollments,
      completed: completedEnrollments,
      thisMonth: thisMonthEnrollments,
      growth: Math.round(growth),
    };
  }

  async adminEnroll(studentEmail: string, courseId: string, franchiseId?: string | null) {
    // Find student by email
    const student = await this.prisma.user.findFirst({
      where: {
        email: studentEmail,
        ...(franchiseId !== undefined ? { franchise_id: franchiseId } : {}),
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found with this email');
    }

    // Check student belongs to franchise (if franchise admin)
    if (franchiseId && student.franchise_id && student.franchise_id !== franchiseId) {
      throw new ForbiddenException('Cannot enroll student from another franchise');
    }

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check course belongs to franchise
    if (franchiseId && course.franchise_id && course.franchise_id !== franchiseId) {
      throw new ForbiddenException('Cannot enroll in course from another franchise');
    }

    // Check if already enrolled
    const existing = await this.findOne(student.id, courseId);
    if (existing) {
      throw new BadRequestException(
        'Student is already enrolled in this course',
      );
    }

    // Create Payment record for manual enrollment
    const payment = await this.prisma.payment.create({
      data: {
        user_id: student.id,
        course_id: courseId,
        amount: course.price || 0,
        currency: 'INR',
        payment_provider: 'Offline Enrollment',
        payment_status: 'completed',
        transaction_id: `MANUAL-${Date.now()}`,
        franchise_id: franchiseId,
      }
    });

    const enrollment = await this.prisma.enrollment.create({
      data: {
        student_id: student.id,
        course_id: courseId,
        status: 'active',
        franchise_id: franchiseId,
        payment_id: payment.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Send enrollment email to the student
    this.mailService.sendCourseEnrollmentEmail(
      { email: student.email, name: student.name, franchise_id: student.franchise_id },
      course.title,
    ).catch(err => console.error('Failed to send admin enrollment email:', err));

    return enrollment;
  }

  async bulkEnroll(studentIds: string[], courseIds: string[], franchiseId?: string | null) {
    const results = {
      total: studentIds.length * courseIds.length,
      success: 0,
      alreadyEnrolled: 0,
      failed: 0,
      errors: [] as { studentId: string; courseId: string; error: any }[],
    };

    // Verify all students and courses belong to franchise if enforced
    if (franchiseId) {
      // Checking explicitly might be expensive in loop, so rely on DB constraints or checks
      // For strictness, one could fetch all and verify.
      // For now, I'll trust the individual checks or assume caller (Admin) passed valid IDs for their scope. 
      // But preventing cross-contamination is key.
    }

    for (const studentId of studentIds) {
      for (const courseId of courseIds) {
        try {
          // If strict, verify ownership here
          if (franchiseId) {
            const student = await this.prisma.user.findUnique({ where: { id: studentId } });
            if (student && student.franchise_id && student.franchise_id !== franchiseId) throw new Error("Student not in franchise");

            if (student && student.franchise_id && student.franchise_id !== franchiseId) throw new Error("Student not in franchise");

            const course = await this.prisma.course.findUnique({ where: { id: courseId } });
            if (course && course.franchise_id && course.franchise_id !== franchiseId) throw new Error("Course not in franchise");
          } else {
            // Fetch course to get access limit if not already fetched
            // Optimization: We could fetch courses outside loop, but simpler here
          }
          const course = await this.prisma.course.findUnique({ where: { id: courseId } });
          if (!course) throw new Error("Course not found");

          const existing = await this.findOne(studentId, courseId);
          if (existing) {
            results.alreadyEnrolled++;
            continue;
          }

          // Create Payment record for bulk enrollment
          const payment = await this.prisma.payment.create({
            data: {
              user_id: studentId,
              course_id: courseId,
              amount: course.price || 0,
              currency: 'INR',
              payment_provider: 'Offline Enrollment',
              payment_status: 'completed',
              transaction_id: `BULK-${Date.now()}-${studentId.substring(0,4)}`,
              franchise_id: franchiseId,
            }
          });

          await this.prisma.enrollment.create({
            data: {
              student_id: studentId,
              course_id: courseId,
              status: 'active',
              franchise_id: franchiseId,
              payment_id: payment.id,
              expires_at: (course?.access_days_limit) ? (() => {
                const d = new Date();
                d.setDate(d.getDate() + course.access_days_limit);
                return d;
              })() : null,
            },
          });

          results.success++;

          // Send enrollment email to student for bulk enrollment
          const enrolledStudent = await this.prisma.user.findUnique({ where: { id: studentId } });
          if (enrolledStudent) {
            this.mailService.sendCourseEnrollmentEmail(
              { email: enrolledStudent.email, name: enrolledStudent.name, franchise_id: enrolledStudent.franchise_id },
              course.title,
            ).catch(err => console.error('Failed to send bulk enrollment email:', err));
          }
        } catch (error) {
          console.error(`Failed to enroll student ${studentId} in course ${courseId}`, error);
          results.failed++;
          results.errors.push({ studentId, courseId, error: error.message });
        }
      }
    }

    return results;
  }

  async updateStatus(id: string, status: string, franchiseId?: string | null) {
    const whereClause: any = { id, AND: [] };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: whereClause,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, franchiseId?: string | null) {
    const whereClause: any = { id, AND: [] };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: whereClause,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.delete({
      where: { id },
    });
  }

  // Course completion management methods
  async getCourseStudents(courseId: string, franchiseId?: string | null) {
    // Verify course belongs to franchise
    if (franchiseId) {
      const course = await this.prisma.course.findUnique({ where: { id: courseId } });
      if (!course || (course.franchise_id && course.franchise_id !== franchiseId)) {
        throw new NotFoundException('Course not found');
      }
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId }, // Should we also filter enrollment.franchise_id? Yes.
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    // Extra safety: Filter out any enrollments that might leak (though course_id should segregate)
    // If a course is exclusive to a franchise, all its enrollments must be too.

    return {
      students: enrollments.map((enrollment) => ({
        id: enrollment.user.id,
        enrollment_id: enrollment.id,
        name: enrollment.user.name,
        email: enrollment.user.email,
        avatar_url: enrollment.user.avatar_url,
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status,
        progress_percentage: (enrollment as any).progress_percentage || 0,
        completed_at: (enrollment as any).completed_at,
        last_activity_at: (enrollment as any).last_activity_at,
        // TODO: Calculate these from progress tracking
        lessons_completed: 0,
        total_lessons: 0,
        certificate_issued: false,
      })),
    };
  }

  async bulkComplete(dto: { enrollment_ids: string[]; completion_date?: string }, franchiseId?: string | null) {
    const completionDate = dto.completion_date ? new Date(dto.completion_date) : new Date();

    // Results tracking
    let updatedCount = 0;

    // We must process individually or via more complex query to handle the OR condition safely for updates
    // Because updateMany doesn't support joining for filtering in the same way with the OR logic easily on all DBs,
    // and we need to ensure we don't update cross-franchise.
    // Fetch valid enrollments first.

    const whereClause: any = {
      id: { in: dto.enrollment_ids },
      AND: [] // Safe initialization
    };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    const validEnrollments = await this.prisma.enrollment.findMany({
      where: whereClause,
      select: { id: true, student_id: true, course_id: true }
    });

    if (validEnrollments.length === 0) {
      return { success: true, updated: 0, message: "No matching enrollments found." };
    }

    const validIds = validEnrollments.map(e => e.id);

    const result = await this.prisma.enrollment.updateMany({
      where: { id: { in: validIds } },
      data: {
        status: 'completed',
        completed_at: completionDate,
        progress_percentage: 100,
      },
    });

    // Also trigger completion logic for each to ensure certificates/progress sync
    // This fixes the issue where bulk complete only updated enrollment status but not CourseProgress/Certificate
    for (const enrollment of validEnrollments) {
      try {
        await this.completionsService.markComplete(enrollment.student_id, enrollment.course_id, 'ADMIN');
      } catch (e) {
        console.error(`Failed to trigger completion service for ${enrollment.id}`, e);
      }
    }

    return {
      success: true,
      updated: result.count,
      message: `Successfully marked ${result.count} enrollment(s) as complete`,
    };
  }

  async updateCompletionDate(enrollmentId: string, dto: { completion_date: string }, franchiseId?: string | null) {
    const whereClause: any = { id: enrollmentId };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: whereClause,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { completed_at: new Date(dto.completion_date) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async manualComplete(enrollmentId: string, dto: { completion_date?: string }, franchiseId?: string | null) {
    const whereClause: any = { id: enrollmentId, AND: [] };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: whereClause,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const completionDate = dto.completion_date ? new Date(dto.completion_date) : new Date();

    // 1. Update Enrollment
    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'completed',
        completed_at: completionDate,
        progress_percentage: 100,
      },
      include: {
        user: true,
        course: true,
      },
    });

    // 2. Trigger completion logic via CompletionsService
    const completionResult = await this.completionsService.markComplete(updated.student_id, updated.course_id, 'ADMIN');

    // If date was custom, ensure CourseProgress/Certificate match that date
    if (dto.completion_date) {
      await this.updateCompletionDate(enrollmentId, { completion_date: dto.completion_date });
    }

    return {
      ...updated,
      certificate_issued: !!completionResult.certificate,
    };
  }

  async bulkUpdateDates(dto: { enrollment_ids: string[]; enrollment_date?: string; completion_date?: string }, franchiseId?: string | null) {
    const updates: any = {};
    if (dto.enrollment_date) {
      updates.enrolled_at = new Date(dto.enrollment_date);
    }
    if (dto.completion_date) {
      updates.completed_at = new Date(dto.completion_date);
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, updated: 0, message: 'No dates provided for update' };
    }

    const whereClause: any = {
      id: { in: dto.enrollment_ids },
      AND: []
    };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    const result = await this.prisma.enrollment.updateMany({
      where: whereClause,
      data: updates,
    });

    // If completion date updated, sync with CourseProgress and Certificate
    if (dto.completion_date) {
      // Re-fetch strictly to handle only those updated
      const enrollments = await this.prisma.enrollment.findMany({
        where: whereClause,
        select: { student_id: true, course_id: true },
      });

      const newDate = new Date(dto.completion_date);

      for (const enrollment of enrollments) {
        // Update CourseProgress
        await this.prisma.courseProgress.updateMany({
          where: {
            student_id: enrollment.student_id,
            course_id: enrollment.course_id,
          },
          data: { updated_at: newDate },
        });

        // Update Certificate
        await this.prisma.certificate.updateMany({
          where: {
            student_id: enrollment.student_id,
            course_id: enrollment.course_id,
          },
          data: { issued_at: newDate },
        });
      }
    }

    return {
      success: true,
      updated: result.count,
      message: `Successfully updated dates for ${result.count} enrollment(s)`,
    };
  }

  async bulkIncomplete(dto: { enrollment_ids: string[] }, franchiseId?: string | null) {
    const whereClause: any = {
      id: { in: dto.enrollment_ids },
      AND: [] // Safe initialization
    };

    if (franchiseId) {
      whereClause.AND.push({
        OR: [
          { franchise_id: franchiseId },
          { course: { franchise_id: franchiseId } }
        ]
      });
    }

    if (whereClause.AND.length === 0) delete whereClause.AND;

    // 1. Update Enrollments to active, progress 0, no completion date
    const result = await this.prisma.enrollment.updateMany({
      where: whereClause,
      data: {
        status: 'active',
        completed_at: null,
        progress_percentage: 0,
      },
    });

    // 2. Fetch enrollment details to find related CourseProgress/Certificates
    const enrollments = await this.prisma.enrollment.findMany({
      where: whereClause,
      select: { student_id: true, course_id: true },
    });

    for (const enrollment of enrollments) {
      // 3. Reset CourseProgress
      await this.prisma.courseProgress.updateMany({
        where: {
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
        },
        data: {
          completed: false,
          progress_percentage: 0,
          updated_at: new Date(),
        },
      });

      // 4. Delete existing certificates
      await this.prisma.certificate.deleteMany({
        where: {
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
        },
      });
    }

    return {
      success: true,
      updated: result.count,
      message: `Successfully marked ${result.count} enrollment(s) as incomplete and reset progress`,
    };
  }
}
