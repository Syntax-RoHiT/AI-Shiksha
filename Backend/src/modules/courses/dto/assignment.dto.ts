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
  IsDateString,
} from 'class-validator';

// Assignment DTOs
export class CreateAssignmentDto {
  @IsString()
  @IsIn(['FILE', 'CODE', 'TEXT'])
  submission_type: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_file_size_mb?: number; // Default 10

  @IsArray()
  @IsOptional()
  allowed_file_types?: string[]; // ['pdf', 'docx', 'zip']

  @IsString()
  @IsOptional()
  rubric?: string; // JSON stringified rubric

  @IsBoolean()
  @IsOptional()
  enable_peer_review?: boolean;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  late_penalty_percentage?: number; // Default 0

  @IsString()
  @IsOptional()
  assignment_url?: string;
}

export class UpdateAssignmentDto {
  @IsString()
  @IsOptional()
  @IsIn(['FILE', 'CODE', 'TEXT'])
  submission_type?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_file_size_mb?: number;

  @IsArray()
  @IsOptional()
  allowed_file_types?: string[];

  @IsString()
  @IsOptional()
  rubric?: string;

  @IsBoolean()
  @IsOptional()
  enable_peer_review?: boolean;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  late_penalty_percentage?: number;

  @IsString()
  @IsOptional()
  assignment_url?: string;
}

// Assignment Submission DTOs
export class SubmitAssignmentDto {
  @IsString()
  @IsOptional()
  submission_url?: string; // For FILE type

  @IsString()
  @IsOptional()
  code_submission?: string; // For CODE type

  @IsString()
  @IsOptional()
  text_submission?: string; // For TEXT type
}

export class GradeAssignmentDto {
  @IsInt()
  @Min(0)
  @Max(100)
  grade: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class AssignmentSubmissionDto {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  submission_url?: string;
  code_submission?: string;
  text_submission?: string;
  grade?: number;
  feedback?: string;
  graded_by?: string;
  grader_name?: string;
  graded_at?: Date;
  submitted_at: Date;
  is_late: boolean;
  days_late?: number;
}
