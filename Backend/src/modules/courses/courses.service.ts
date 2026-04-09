import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) { }

  async create(instructorUserId: string, createCourseDto: CreateCourseDto, franchiseId?: string | null) {
    // Override instructor if author_id is provided (e.g. by Admin)
    const targetUserId = createCourseDto.author_id || instructorUserId;

    // Check if user has an instructor profile
    let instructor = await this.prisma.instructorProfile.findUnique({
      where: { user_id: targetUserId },
    });

    // If no instructor profile exists, check if user is admin and create one
    if (!instructor) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Ensure user belongs to the same franchise
      if (user.franchise_id && user.franchise_id !== franchiseId) {
        throw new ForbiddenException('Cannot create course for user in different franchise');
      }

      if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR' || user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISE_ADMIN') {
        instructor = await this.prisma.instructorProfile.create({
          data: {
            user_id: targetUserId,
            headline: 'Instructor',
            description: 'Course Instructor',
          },
        });
      } else {
        throw new BadRequestException('User is not an instructor');
      }
    }

    const {
      modules,
      category_id,
      tag_ids,
      prerequisite_course_ids,
      author_id, // Extract to remove from courseData
      ...courseData
    } = createCourseDto;

    return this.prisma.course.create({
      data: {
        ...courseData,
        slug: courseData.slug || courseData.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now(),
        instructor_id: instructor.id,
        franchise_id: franchiseId,
        category_id: category_id || null,
        prerequisites: prerequisite_course_ids
          ? {
            create: prerequisite_course_ids.map((id) => ({
              prerequisite_course_id: id,
            })),
          }
          : undefined,
        modules: modules
          ? {
            create: modules.map((module) => ({
              title: module.title,
              position: module.position || 0,
              lessons: module.lessons
                ? {
                  create: module.lessons.map((lesson) => ({
                    title: lesson.title,
                    content: lesson.content,
                    video_url: lesson.video_url,
                    duration_seconds: lesson.duration_seconds || 0,
                    is_preview: lesson.is_preview || false,
                    position: lesson.position || 0,
                  })),
                }
                : undefined,
            })),
          }
          : undefined,
        tags:
          tag_ids && tag_ids.length > 0
            ? {
              create: tag_ids.map((tag_id) => ({
                tag_id: tag_id,
              })),
            }
            : undefined,
      },
      include: {
        modules: {
          include: { lessons: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  async findAll(adminRequest = false, franchiseId?: string | null, userRole?: string) {
    const whereClause: any = {};
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    } else if (userRole === 'SUPER_ADMIN') {
      // SUPER ADMIN ISOLATION:
      // If Super Admin requests "All Courses" without a specific franchise filter,
      // show ONLY System Courses (franchise_id: null).
      whereClause.franchise_id = null;
    }

    if (!adminRequest) {
      whereClause.status = 'PUBLISHED';
    }

    const courses = await this.prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: { include: { user: true } },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
        category: true,
        modules: {
          include: {
            _count: {
              select: { lessons: true },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
        payments: adminRequest,
      },
      orderBy: { created_at: 'desc' },
    });

    return (courses as any[]).map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail_url,
      status: course.status,
      students: course._count.enrollments,
      rating:
        course.reviews.reduce((acc, r) => acc + r.rating, 0) /
        (course.reviews.length || 1),
      lessons: course.modules.reduce((acc, m) => acc + m._count.lessons, 0),
      price: course.price,
      lastUpdated: course.updated_at,
      instructor: course.instructor.user.name,
      level: course.level,
      category: course.category,
      revenue: course.payments
        ? course.payments.reduce((sum, p) => sum + p.amount, 0)
        : 0,
    }));
  }

  async findMyCourses(userId: string, franchiseId?: string | null) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { user_id: userId },
    });

    if (!instructor) {
      return [];
    }

    const whereClause: any = { instructor_id: instructor.id };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }
    const courses = await this.prisma.course.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
        category: true,
        modules: {
          include: {
            _count: {
              select: { lessons: true },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return (courses as any[]).map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail_url,
      status: course.status,
      students: course._count.enrollments,
      rating:
        course.reviews.reduce((acc, r) => acc + r.rating, 0) /
        (course.reviews.length || 1),
      lessons: course.modules.reduce((acc: any, m: any) => acc + m._count.lessons, 0),
      price: course.price,
      revenue: 0, // Calculate revenue if needed
      category: course.category,
      lastUpdated: course.updated_at,
    }));
  }

  async findOne(id: string, franchiseId?: string | null) {
    const whereClause: any = { id };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
      include: {
        instructor: { include: { user: true } },
        category: true,
        tags: { include: { tag: true } },
        // New curriculum structure
        sections: {
          include: {
            items: {
              include: {
                lecture_content: true, // Include content to get content_type for icons
              },
              orderBy: { order_index: 'asc' },
            },
          },
          orderBy: { order_index: 'asc' },
        },
        // Old curriculum structure - for backwards compatibility
        modules: {
          include: {
            lessons: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        reviews: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findBySlug(slug: string, franchiseId?: string | null) {
    const whereClause: any = { slug };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
      include: {
        instructor: { include: { user: true } },
        category: true,
        tags: { include: { tag: true } },
        // New curriculum structure (sections)
        sections: {
          include: {
            items: {
              include: {
                lecture_content: true,
              },
              orderBy: { order_index: 'asc' },
            },
          },
          orderBy: { order_index: 'asc' },
        },
        // Old curriculum structure (modules/lessons) - needed for backwards compatibility
        modules: {
          include: {
            lessons: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        reviews: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only return published courses for public access
    if (course.status !== 'PUBLISHED') {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
    userRole?: string,
    franchiseId?: string | null
  ) {
    console.log(`[CoursesService.update] ID: ${id}, DTO:`, JSON.stringify(updateCourseDto, null, 2));

    const whereClause: any = { id };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
      include: { instructor: true },
    });

    if (!course) throw new NotFoundException('Course not found');

    // Verify ownership (skip for Admin/SuperAdmin/FranchiseAdmin)
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && userRole !== 'FRANCHISE_ADMIN' && course.instructor.user_id !== userId) {
      throw new BadRequestException('You do not own this course'); // Or ForbiddenException
    }

    const { modules, prerequisite_course_ids, tag_ids, author_id, ...courseData } =
      updateCourseDto;

    // Handle Author Change (Admin Only or specific logic)
    let newInstructorId: string | undefined = undefined;
    if (author_id) {
      // Check if target user has instructor profile
      let targetInstructor = await this.prisma.instructorProfile.findUnique({
        where: { user_id: author_id },
      });

      if (!targetInstructor) {
        // Auto-create if not exists (similar to create logic)
        const user = await this.prisma.user.findUnique({ where: { id: author_id } });
        if (user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR' || user.role === 'SUPER_ADMIN')) {
          targetInstructor = await this.prisma.instructorProfile.create({
            data: {
              user_id: author_id,
              headline: 'Instructor',
              description: 'Course Instructor',
            }
          });
        }
      }
      if (targetInstructor) {
        newInstructorId = targetInstructor.id;
      }
    }

    return this.prisma.$transaction(async (prisma: any) => {
      // 1. Update course details
      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          ...courseData,
          instructor_id: newInstructorId, // Update instructor if changed
          // Handle Tags Update
          tags: tag_ids
            ? {
              deleteMany: {}, // Clear existing tags
              create: tag_ids.map((tag_id) => ({ tag_id })), // Add new tags
            }
            : undefined,
          // Handle Prerequisites Update
          prerequisites: prerequisite_course_ids
            ? {
              deleteMany: {}, // Clear existing
              create: prerequisite_course_ids.map((id) => ({
                prerequisite_course_id: id,
              })),
            }
            : undefined,
        },
      });

      // 2. Handle modules and lessons if provided
      if (modules) {
        // Get existing modules
        const existingModules = await prisma.module.findMany({
          where: { course_id: id },
          include: { lessons: true },
        });

        const existingModuleIds = existingModules.map((m) => m.id);
        const incomingModuleIds = modules.filter((m) => m.id).map((m) => m.id);

        // Delete removed modules
        const modulesToDelete = existingModuleIds.filter(
          (id) => !incomingModuleIds.includes(id),
        );
        if (modulesToDelete.length > 0) {
          await prisma.module.deleteMany({
            where: { id: { in: modulesToDelete } },
          });
        }

        // Process each incoming module
        for (const [index, moduleDto] of modules.entries()) {
          const moduleData = {
            title: moduleDto.title,
            position: index, // Use array index as position
          };

          let moduleId = moduleDto.id;

          if (moduleId && existingModuleIds.includes(moduleId)) {
            // Update existing module
            await prisma.module.update({
              where: { id: moduleId },
              data: moduleData,
            });
          } else {
            // Create new module
            const newModule = await prisma.module.create({
              data: {
                ...moduleData,
                course: { connect: { id } },
              },
            });
            moduleId = newModule.id;
          }

          // Handle lessons for this module
          if (moduleDto.lessons) {
            const existingLessons =
              existingModules.find((m) => m.id === moduleId)?.lessons || [];
            const existingLessonIds = existingLessons.map((l) => l.id);
            const incomingLessonIds = moduleDto.lessons
              .filter((l) => l.id)
              .map((l) => l.id);

            // Delete removed lessons
            const lessonsToDelete = existingLessonIds.filter(
              (id) => !incomingLessonIds.includes(id),
            );
            if (lessonsToDelete.length > 0) {
              await prisma.lesson.deleteMany({
                where: { id: { in: lessonsToDelete } },
              });
            }

            // Upsert lessons
            for (const [lIndex, lessonDto] of moduleDto.lessons.entries()) {
              const lessonData = {
                title: lessonDto.title,
                content: lessonDto.content,
                video_url: lessonDto.video_url,
                duration_seconds: lessonDto.duration_seconds || 0,
                is_preview: lessonDto.is_preview || false,
                position: lIndex,
              };

              if (lessonDto.id && existingLessonIds.includes(lessonDto.id)) {
                await prisma.lesson.update({
                  where: { id: lessonDto.id },
                  data: lessonData,
                });
              } else {
                await prisma.lesson.create({
                  data: {
                    ...lessonData,
                    module: { connect: { id: moduleId } },
                  },
                });
              }
            }
          }
        }
      }

      return updatedCourse;
    });
  }

  async remove(id: string, userId: string, userRole?: string, franchiseId?: string | null) {
    const whereClause: any = { id };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
      include: { instructor: true },
    });

    if (!course) throw new NotFoundException('Course not found');

    // Verify ownership (skip for Admin/SuperAdmin/FranchiseAdmin)
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && userRole !== 'FRANCHISE_ADMIN' && course.instructor.user_id !== userId) {
      throw new BadRequestException('You do not own this course');
    }

    return this.prisma.$transaction(async (tx: any) => {
      // Clean up relations that do not have onDelete: Cascade
      await tx.payment.deleteMany({
        where: { course_id: id }
      });

      await tx.aIConversation.updateMany({
        where: { course_id: id },
        data: { course_id: null }
      });

      return tx.course.delete({
        where: { id },
      });
    });
  }

  // ========== APPROVAL WORKFLOW METHODS ==========

  async submitForApproval(courseId: string, userId: string, franchiseId?: string | null) {
    const whereClause: any = { id: courseId };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    // Verify ownership
    const course = await this.prisma.course.findFirst({
      where: whereClause,
      include: { instructor: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructor.user_id !== userId) {
      throw new ForbiddenException('You do not own this course');
    }

    if (course.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft courses can be submitted for approval',
      );
    }

    return (this.prisma as any).course.update({
      where: { id: courseId },
      data: {
        status: 'PENDING_APPROVAL',
        submitted_for_approval_at: new Date(),
      },
      include: {
        instructor: { include: { user: true } },
        category: true,
      },
    });
  }

  async approveCourse(courseId: string, adminUserId: string, franchiseId?: string | null) {
    const whereClause: any = { id: courseId };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only pending courses can be approved');
    }

    return (this.prisma as any).course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        approved_by: adminUserId,
        approved_at: new Date(),
        rejection_reason: null,
      },
      include: {
        instructor: { include: { user: true } },
        approver: true,
        category: true,
        tags: { include: { tag: true } },
      },
    });
  }

  async rejectCourse(courseId: string, adminUserId: string, reason: string, franchiseId?: string | null) {
    const whereClause: any = { id: courseId };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only pending courses can be rejected');
    }

    return (this.prisma as any).course.update({
      where: { id: courseId },
      data: {
        status: 'REJECTED',
        rejection_reason: reason,
        approved_by: adminUserId,
        approved_at: new Date(),
      },
      include: {
        instructor: { include: { user: true } },
        approver: true,
      },
    });
  }

  async publishCourse(courseId: string, adminUserId: string, franchiseId?: string | null) {
    const whereClause: any = { id: courseId };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    // Admin can directly publish any course
    const course = await this.prisma.course.findFirst({
      where: whereClause,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return (this.prisma as any).course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        approved_by: adminUserId,
        approved_at: new Date(),
      },
      include: {
        instructor: { include: { user: true } },
        approver: true,
        category: true,
      },
    });
  }

  async getPendingApproval(franchiseId?: string | null) {
    const whereClause: any = { status: 'PENDING_APPROVAL' };
    if (franchiseId) {
      whereClause.franchise_id = franchiseId;
    }

    return (this.prisma as any).course.findMany({
      where: whereClause,
      include: {
        instructor: { include: { user: true } },
        category: true,
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: { submitted_for_approval_at: 'asc' },
    });
  }
}
