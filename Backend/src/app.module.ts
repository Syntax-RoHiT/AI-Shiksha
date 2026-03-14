import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InstructorsModule } from './modules/instructors/instructors.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ModulesModule } from './modules/modules/modules.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { CartModule } from './modules/cart/cart.module';
// Course Builder Modules
import { SectionsModule } from './modules/sections/sections.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { CompletionsModule } from './modules/completions/completions.module';

import { CertificateTemplatesModule } from './modules/certificate-templates/certificate-templates.module';
import { UploadModule } from './modules/upload/upload.module';
import { SupportModule } from './modules/support/support.module';
import { StudentsModule } from './modules/students/students.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { FranchisesModule } from './modules/franchises/franchises.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { QaModule } from './modules/qa/qa.module';
import { RazorpayModule } from './modules/razorpay/razorpay.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { InvoicesService } from './modules/invoices/invoices.service';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    InstructorsModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    EnrollmentsModule,
    PaymentsModule,
    CartModule,
    AiModule,
    AdminModule,
    CategoriesModule,
    TagsModule,
    // Course Builder
    SectionsModule,
    QuizzesModule,
    AssignmentsModule,
    CompletionsModule,
    AssignmentsModule,
    CompletionsModule,
    CertificateTemplatesModule,
    UploadModule,
    SupportModule,
    StudentsModule,
    LeaderboardModule,
    CertificatesModule,
    TransactionsModule,
    SystemSettingsModule,
    FranchisesModule,
    AnnouncementsModule,
    ReviewsModule,
    QaModule,
    RazorpayModule,
    CouponsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService, InvoicesService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

