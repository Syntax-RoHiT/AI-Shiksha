import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { CompletionsModule } from '../completions/completions.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [CompletionsModule, MailModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule { }
