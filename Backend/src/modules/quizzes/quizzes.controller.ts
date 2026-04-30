import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';
import { QuizzesService } from './quizzes.service';
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuizQuestionDto,
  UpdateQuizQuestionDto,
  ReorderQuestionsDto,
  SubmitQuizDto,
} from '../courses/dto/quiz.dto';

@Controller('quizzes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) { }

  // ========== QUIZ CRUD ==========

  @Post()
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  createQuiz(@Request() req, @Body() dto: CreateQuizDto) {
    const franchiseId = req.user?.franchise_id || null;
    return this.quizzesService.createQuiz(dto, franchiseId);
  }

  @Get()
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  findAll(@Request() req) {
    const franchiseId = req.user?.franchise_id || null;
    return this.quizzesService.findAll(franchiseId);
  }

  @Get(':quizId')
  getQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuiz(quizId);
  }

  @Patch(':quizId')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  updateQuiz(@Param('quizId') quizId: string, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.updateQuiz(quizId, dto);
  }

  @Delete(':quizId')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  deleteQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.deleteQuiz(quizId);
  }

  // ========== QUESTION CRUD ==========

  @Post(':quizId/questions')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  addQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.quizzesService.addQuestion(quizId, dto);
  }

  @Patch('../questions/:questionId')
  // NOTE: This route is weird if we prefix controller with 'quizzes'. 
  // But strictly RESTful it should be /questions/:id if it is global, but here questions belong to quiz.
  // Ideally, PUT /quizzes/:id/questions/:qid.
  // For now keeping simple as previous: /quizzes/questions/:id or just handle global question update
  // Let's use a specific route for question updates to avoid conflict.
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(questionId, dto);
  }

  // Actually, let's fix the route decorator to be absolute or relative correctly.
  // If controller is @Controller('quizzes'), then @Patch('../questions/:id') works relative to module root?? No.
  // NestJS routers are simple.
  // Let's expose question management under /questions separately if needed, or use full quiz update.
  // But since UI might update single question, let's keep it.
  // Cleaner: PUT /quizzes/:qid/questions/:qId

  @Patch(':quizId/questions/:questionId')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  updateQuestionInQuiz(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuizQuestionDto
  ) {
    return this.quizzesService.updateQuestion(questionId, dto);
  }

  @Delete(':quizId/questions/:questionId')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.quizzesService.deleteQuestion(questionId);
  }

  @Post(':quizId/questions/reorder')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  reorderQuestions(@Body() dto: ReorderQuestionsDto) {
    return this.quizzesService.reorderQuestions(dto);
  }

  // ========== QUIZ SUBMISSION ==========

  @Post(':quizId/submit')
  @Roles(Role.STUDENT)
  submitQuiz(
    @Request() req,
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(quizId, req.user.userId, dto);
  }

  @Get(':quizId/submissions')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN)
  getSubmissions(@Param('quizId') quizId: string) {
    return this.quizzesService.getSubmissions(quizId);
  }

  @Get(':quizId/my-submissions')
  @Roles(Role.STUDENT)
  getMySubmissions(@Request() req, @Param('quizId') quizId: string) {
    return this.quizzesService.getSubmissions(quizId, req.user.userId);
  }

  @Patch('submissions/:submissionId/date')
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  updateSubmissionDate(
    @Request() req,
    @Param('submissionId') submissionId: string,
    @Body('submitted_at') submittedAt: string,
  ) {
    return this.quizzesService.updateSubmissionDate(submissionId, new Date(submittedAt));
  }
}
