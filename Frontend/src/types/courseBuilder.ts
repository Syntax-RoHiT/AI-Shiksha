// Course Builder Type Definitions

export type CourseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';
export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

// Section Item Types
export type SectionItemType = 'LECTURE' | 'QUIZ' | 'ASSIGNMENT' | 'RESOURCE';
export type LectureContentType = 'VIDEO' | 'TEXT' | 'FILE' | 'LINK';
export type VideoProvider = 'UPLOAD' | 'YOUTUBE' | 'VIMEO';
export type QuizQuestionType = 'MCQ' | 'MULTIPLE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'DESCRIPTIVE' | 'CODE';
export type AssignmentSubmissionType = 'FILE' | 'CODE' | 'TEXT';

// Course with all new fields
export interface Course {
    id: string;
    title: string;
    subtitle?: string;
    slug: string;
    description?: string;
    price: number;
    level?: string;
    language?: string;
    thumbnail_url?: string;
    intro_video_url?: string;

    // Pricing
    is_free: boolean;
    original_price?: number;
    discount_percentage?: number;
    drip_enabled?: boolean;

    // Access Control
    is_private: boolean;
    password?: string;
    max_students?: number;

    // Approval Workflow
    status: CourseStatus;
    submitted_for_approval_at?: Date;
    approved_by?: string;
    approved_at?: Date;
    rejection_reason?: string;

    // Relations
    instructor_id: string;
    category_id?: string;
    instructor?: any;
    category?: any;
    sections?: CourseSection[];

    created_at: Date;
    updated_at: Date;
}

// Course Section
export interface CourseSection {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    order_index: number;
    is_collapsed: boolean;
    items: SectionItem[];
    created_at: Date;
    updated_at: Date;
}

// Section Item (Polymorphic)
export interface SectionItem {
    id: string;
    section_id: string;
    type: SectionItemType;
    title: string;
    description?: string;
    order_index: number;
    duration_minutes?: number;
    is_preview: boolean;
    is_mandatory: boolean;

    // Relations (only one will be populated based on type)
    lecture_content?: LectureContent;
    quiz_id?: string;
    quiz?: Quiz;
    assignment?: Assignment;

    created_at: Date;
    updated_at: Date;
}

// Lecture Content
export interface LectureContent {
    id: string;
    item_id: string;
    content_type: LectureContentType;

    // Video
    video_url?: string;
    video_provider?: VideoProvider;
    subtitles_url?: string;
    transcript?: string;

    // Text
    text_content?: any; // Rich text JSON

    // File
    file_url?: string;
    file_type?: string;
    file_size?: number;
    pdf_url?: string; // For Flipbook

    // Link
    external_link?: string;

    created_at: Date;
    updated_at: Date;
}

// Quiz
export interface Quiz {
    id: string;
    item_id: string;
    passing_score: number;
    time_limit_minutes?: number;
    attempts_allowed: number;
    randomize_questions: boolean;
    show_answers: boolean;
    auto_grade: boolean;

    questions: QuizQuestion[];
    submissions?: QuizSubmission[];

    created_at: Date;
    updated_at: Date;
}

// Quiz Question
export interface QuizQuestion {
    id?: string;
    quiz_id?: string;
    type: QuizQuestionType;
    question_text: string;
    question_image_url?: string;
    points: number;
    order_index: number;
    set_number?: number; // Added set_number
    options?: string[]; // JSON array for frontend
    correct_answers?: any[]; // JSON array
    correct_answer?: any; // Helper for single answer questions
    explanation?: string;
    code_template?: string;
    created_at?: string;
    updated_at?: string;
}

// Quiz Submission
export interface QuizSubmission {
    id: string;
    quiz_id: string;
    student_id: string;
    answers: Record<string, any>; // JSON
    score?: number;
    passed: boolean;
    time_taken_minutes?: number;
    submitted_at: Date;

    student?: {
        id: string;
        name: string;
        email: string;
    };
}

// Assignment
export interface Assignment {
    id: string;
    item_id: string;
    submission_type: AssignmentSubmissionType;
    max_file_size_mb: number;
    allowed_file_types?: string[]; // JSON array
    assignment_url?: string; // Optional PDF file link

    rubric?: string; // JSON
    enable_peer_review: boolean;

    deadline?: Date;
    late_penalty_percentage: number;

    submissions?: AssignmentSubmission[];

    created_at: Date;
    updated_at: Date;
}

// Assignment Submission
export interface AssignmentSubmission {
    id: string;
    assignment_id: string;
    student_id: string;

    submission_url?: string;
    code_submission?: string;
    text_submission?: string;

    grade?: number;
    feedback?: string;
    graded_by?: string;
    graded_at?: Date;

    submitted_at: Date;

    student?: {
        id: string;
        name: string;
        email: string;
    };
    grader?: {
        id: string;
        name: string;
        email: string;
    };
    assignment?: Assignment;
}

// DTOs for API calls
export interface CreateCourseDTO {
    title: string;
    subtitle?: string;
    slug: string;
    description?: string;
    price: number;
    level?: string;
    language?: string;
    thumbnail_url?: string;
    intro_video_url?: string;

    is_free?: boolean;
    original_price?: number;
    discount_percentage?: number;

    is_private?: boolean;
    password?: string;
    max_students?: number;

    category_id?: string;
    tag_ids?: string[];
    prerequisite_course_ids?: string[];
}

export interface CreateSectionDTO {
    title: string;
    description?: string;
    order_index: number;
}

export interface CreateSectionItemDTO {
    type: SectionItemType;
    title: string;
    description?: string;
    order_index: number;
    duration_minutes?: number;
    is_preview?: boolean;
    is_mandatory?: boolean;
    quiz_id?: string;
}

export interface CreateLectureContentDTO {
    content_type: LectureContentType;
    video_url?: string;
    video_provider?: VideoProvider;
    subtitles_url?: string;
    transcript?: string;
    text_content?: any;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    pdf_url?: string;
    external_link?: string;
}

export interface CreateQuizDTO {
    passing_score?: number;
    time_limit_minutes?: number;
    attempts_allowed?: number;
    randomize_questions?: boolean;
    show_answers?: boolean;
    auto_grade?: boolean;
}

export interface CreateQuizQuestionDTO {
    type: QuizQuestionType;
    question_text: string;
    question_image_url?: string;
    points?: number;
    order_index: number;
    options?: string[];
    correct_answers?: any[];
    explanation?: string;
    code_template?: string;
}

export interface CreateAssignmentDTO {
    submission_type: AssignmentSubmissionType;
    max_file_size_mb?: number;
    allowed_file_types?: string[];
    assignment_url?: string;
    rubric?: string;
    enable_peer_review?: boolean;
    deadline?: string;
    late_penalty_percentage?: number;
}
