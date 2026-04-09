import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  IsIn,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// Quiz DTOs
// Quiz DTOs
export class CreateQuizDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passing_score?: number; // Default 70

  @IsInt()
  @IsOptional()
  @Min(0)
  time_limit_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  attempts_allowed?: number; // 0 = unlimited

  @IsBoolean()
  @IsOptional()
  randomize_questions?: boolean;

  @IsBoolean()
  @IsOptional()
  show_answers?: boolean;

  @IsBoolean()
  @IsOptional()
  auto_grade?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  total_sets?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  questions_per_set?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}

export class UpdateQuizDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passing_score?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  time_limit_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  attempts_allowed?: number;

  @IsBoolean()
  @IsOptional()
  randomize_questions?: boolean;

  @IsBoolean()
  @IsOptional()
  show_answers?: boolean;

  @IsBoolean()
  @IsOptional()
  auto_grade?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  total_sets?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  questions_per_set?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}

// Quiz Question DTOs
export class CreateQuizQuestionDto {
  @IsString()
  @IsIn(['MCQ', 'MULTIPLE', 'TRUE_FALSE', 'FILL_BLANK', 'DESCRIPTIVE', 'CODE'])
  type: string;

  @IsString()
  question_text: string;

  @IsString()
  @IsOptional()
  question_image_url?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number; // Default 1

  @IsInt()
  @Min(0)
  order_index: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  set_number?: number;

  @IsArray()
  @IsOptional()
  options?: string[]; // For MCQ, MULTIPLE

  @IsArray()
  @IsOptional()
  correct_answers?: any[]; // Can be indices or strings

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  code_template?: string; // For CODE type
}

export class UpdateQuizQuestionDto {
  @IsString()
  @IsOptional()
  @IsIn(['MCQ', 'MULTIPLE', 'TRUE_FALSE', 'FILL_BLANK', 'DESCRIPTIVE', 'CODE'])
  type?: string;

  @IsString()
  @IsOptional()
  question_text?: string;

  @IsString()
  @IsOptional()
  question_image_url?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  order_index?: number;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsArray()
  @IsOptional()
  correct_answers?: any[];

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  code_template?: string;
}

export class ReorderQuestionsDto {
  @IsArray()
  question_orders: { id: string; order_index: number }[];
}

// Quiz Submission DTOs
export class SubmitQuizDto {
  @IsObject()
  @IsOptional()
  answers?: Record<string, any>; // { questionId: answer }

  @IsInt()
  @IsOptional()
  time_taken_minutes?: number;
}

export class QuizResultDto {
  quiz_id: string;
  student_id: string;
  score: number;
  passed: boolean;
  total_questions: number;
  correct_answers: number;
  time_taken_minutes?: number;
  submitted_at: Date;
  answers: Record<string, any>;
  detailed_results?: {
    question_id: string;
    question_text: string;
    student_answer: any;
    correct_answer: any;
    is_correct: boolean;
    points_earned: number;
    points_possible: number;
  }[];
}
