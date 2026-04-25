import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Adjust if backend port differs
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('lms_token');
    const expiry = localStorage.getItem('lms_token_expiry');
    const isExpired = expiry ? Date.now() > parseInt(expiry, 10) : false;

    if (token && !isExpired) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['custom-franchise-domain'] = window.location.hostname;
    return config;
});

export const Courses = {
    getAll: async (includeUnpublished: boolean = false) => {
        const endpoint = includeUnpublished ? '/courses/admin/all' : '/courses';
        const { data } = await api.get(endpoint);
        return data;
    },
    getBySlug: async (slug: string) => {
        const { data } = await api.get(`/courses/slug/${slug}`);
        return data;
    },
    getOne: async (id: string) => {
        const { data } = await api.get(`/courses/${id}`);
        return data;
    },
    create: async (courseData: any) => {
        const { data } = await api.post("/courses", courseData);
        return data;
    },
    update: async (id: string, courseData: any) => {
        const { data } = await api.patch(`/courses/${id}`, courseData);
        return data;
    },
    publish: async (id: string) => {
        const { data } = await api.post(`/courses/${id}/publish`);
        return data;
    },
    getMyCourses: async () => {
        const { data } = await api.get("/courses/my");
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/courses/${id}`);
        return data;
    },
};

export const Cart = {
    get: async () => {
        const { data } = await api.get('/cart');
        return data;
    },
    add: async (courseId: string) => {
        const { data } = await api.post('/cart/add', { course_id: courseId });
        return data;
    },
    remove: async (courseId: string) => {
        const { data } = await api.delete(`/cart/${courseId}`);
        return data;
    },
    clear: async () => {
        const { data } = await api.delete('/cart');
        return data;
    },
    getCount: async () => {
        const { data } = await api.get('/cart/count');
        return data;
    },
};

export const Categories = {
    getAll: async () => {
        const { data } = await api.get("/categories");
        return data;
    },
    create: async (categoryData: { name: string; description?: string; icon?: string }) => {
        const { data } = await api.post("/categories", categoryData);
        return data;
    },
    update: async (id: string, categoryData: { name: string; description?: string; icon?: string }) => {
        const { data } = await api.patch(`/categories/${id}`, categoryData);
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/categories/${id}`);
        return data;
    },
};

export const Tags = {
    getAll: async () => {
        const { data } = await api.get("/tags");
        return data;
    },
    create: async (tagData: { name: string }) => {
        const { data } = await api.post("/tags", tagData);
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/tags/${id}`);
        return data;
    },
};

export const Upload = {
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
};

export const SystemSettings = {
    getTerms: async () => {
        const { data } = await api.get('/system-settings/terms');
        return data;
    },
    updateTerms: async (content: string) => {
        const { data } = await api.put('/system-settings/terms', { content });
        return data;
    },
    getFranchiseServerInfo: async () => {
        const { data } = await api.get('/system-settings/franchise-server');
        return data;
    },
    updateFranchiseServerInfo: async (info: { ip: string; cname: string; instructions: string }) => {
        const { data } = await api.put('/system-settings/franchise-server', info);
        return data;
    },
};

export const Enrollments = {
    getAll: async (search?: string, status?: string) => {
        const { data } = await api.get("/enrollments", { params: { search, status } });
        return data;
    },
    getStats: async () => {
        const { data } = await api.get("/enrollments/stats");
        return data;
    },
    adminEnroll: async (studentEmail: string, courseId: string) => {
        const { data } = await api.post("/enrollments/admin/enroll", { studentEmail, courseId });
        return data;
    },
    bulkEnroll: async (studentIds: string[], courseIds: string[]) => {
        const { data } = await api.post("/enrollments/admin/bulk-enroll", { studentIds, courseIds });
        return data;
    },
    updateStatus: async (id: string, status: string) => {
        const { data } = await api.patch(`/enrollments/${id}/status`, { status });
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/enrollments/${id}`);
        return data;
    },
    // Course completion management
    getCourseStudents: async (courseId: string) => {
        const { data } = await api.get(`/enrollments/course/${courseId}/students`);
        return data;
    },
    bulkComplete: async (enrollmentIds: string[], completionDate?: string) => {
        const { data } = await api.post('/enrollments/bulk-complete', {
            enrollment_ids: enrollmentIds,
            completion_date: completionDate,
        });
        return data;
    },
    updateCompletionDate: async (enrollmentId: string, completionDate: string) => {
        const { data } = await api.patch(`/enrollments/${enrollmentId}/completion-date`, {
            completion_date: completionDate,
        });
        return data;
    },
    manualComplete: async (enrollmentId: string, completionDate?: string) => {
        const { data } = await api.post(`/enrollments/${enrollmentId}/complete`, {
            completion_date: completionDate,
        });
        return data;
    },
    bulkUpdateDates: async (enrollmentIds: string[], enrollmentDate?: string, completionDate?: string) => {
        const { data } = await api.post('/enrollments/admin/bulk-update-dates', {
            enrollment_ids: enrollmentIds,
            enrollment_date: enrollmentDate,
            completion_date: completionDate,
        });
        return data;
    },
    bulkIncomplete: async (enrollmentIds: string[]) => {
        const { data } = await api.post('/enrollments/admin/bulk-incomplete', {
            enrollment_ids: enrollmentIds,
        });
        return data;
    },
    getMyEnrollments: async () => {
        const { data } = await api.get("/enrollments/my");
        return data;
    },
    acceptTerms: async (courseId: string) => {
        const { data } = await api.post(`/enrollments/${courseId}/accept-terms`);
        return data;
    },
};

export const Completions = {
    markLessonComplete: async (lessonId: string) => {
        const { data } = await api.post('/completions/lesson', { lessonId });
        return data;
    },
    updateTimeSpent: async (minutes: number, courseId?: string) => {
        const { data } = await api.post('/completions/tracking/time', { minutes, courseId });
        return data;
    },
    logAccess: async (courseId: string, itemId: string) => {
        if (!courseId || !itemId || courseId === 'undefined' || itemId === 'undefined') return; // Prevent 400 errors
        const { data } = await api.post('/completions/tracking/access', { courseId, itemId });
        return data;
    },
};

export const Users = {
    getAll: async (role?: string) => {
        // Add timestamp to prevent caching
        const { data } = await api.get("/users", {
            params: { role, _t: Date.now() }
        });
        return data;
    },
    create: async (userData: any) => {
        const { data } = await api.post("/users", userData);
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/users/${id}`);
        return data;
    },
    getStudentStats: async () => {
        const { data } = await api.get("/users/stats/students");
        return data;
    },
    getTeacherStats: async () => {
        const { data } = await api.get("/users/stats/teachers");
        return data;
    },
    updateProfile: async (data: any) => {
        const { data: response } = await api.post('/users/profile', data);
        return response;
    },
    deleteAvatar: async () => {
        const { data } = await api.delete('/users/profile/avatar');
        return data;
    },
    changePassword: async (data: any) => {
        const { data: response } = await api.post('/users/change-password', data);
        return response;
    },
    updateJoiningDate: async (id: string, createdAt: string) => {
        const { data } = await api.patch(`/users/${id}/joining-date`, { created_at: createdAt });
        return data;
    },
    toggleInstructorVerification: async (instructorProfileId: string) => {
        const { data } = await api.patch(`/instructors/${instructorProfileId}/verify`);
        return data;
    },
};

// ============================================
// COURSE BUILDER APIs
// ============================================

// Approval Workflow
export const CourseApproval = {
    submitForApproval: async (courseId: string) => {
        const { data } = await api.post(`/courses/${courseId}/submit-approval`);
        return data;
    },
    approve: async (courseId: string) => {
        const { data } = await api.post(`/courses/${courseId}/approve`);
        return data;
    },
    reject: async (courseId: string, reason: string) => {
        const { data } = await api.post(`/courses/${courseId}/reject`, { rejection_reason: reason });
        return data;
    },
    publish: async (courseId: string) => {
        const { data } = await api.post(`/courses/${courseId}/publish`);
        return data;
    },
    getPending: async () => {
        const { data } = await api.get('/courses/pending-approval/list');
        return data;
    },
};

// Sections Management
export const Sections = {
    getByCourse: async (courseId: string) => {
        const { data } = await api.get(`/courses/${courseId}/sections`);
        return data;
    },
    create: async (courseId: string, sectionData: any) => {
        const { data } = await api.post(`/courses/${courseId}/sections`, sectionData);
        return data;
    },
    update: async (sectionId: string, sectionData: any) => {
        const { data } = await api.patch(`/sections/${sectionId}`, sectionData);
        return data;
    },
    delete: async (sectionId: string) => {
        const { data } = await api.delete(`/sections/${sectionId}`);
        return data;
    },
    reorder: async (courseId: string, orders: { id: string; order_index: number }[]) => {
        const { data } = await api.post(`/courses/${courseId}/sections/reorder`, { section_orders: orders });
        return data;
    },
};

// Section Items (Lectures, Quizzes, Assignments)
export const SectionItems = {
    getBySlug: async (courseSlug: string, lessonSlug: string) => {
        const { data } = await api.get(`/courses/${courseSlug}/lessons/${lessonSlug}`);
        return data;
    },
    create: async (sectionId: string, itemData: any) => {
        const { data } = await api.post(`/sections/${sectionId}/items`, itemData);
        return data;
    },
    update: async (itemId: string, itemData: any) => {
        const { data } = await api.patch(`/items/${itemId}`, itemData);
        return data;
    },
    delete: async (itemId: string) => {
        const { data } = await api.delete(`/items/${itemId}`);
        return data;
    },
    reorder: async (orders: { id: string; order_index: number }[]) => {
        const { data } = await api.post('/items/reorder', { item_orders: orders });
        return data;
    },
};

// Lecture Content
export const LectureContent = {
    create: async (itemId: string, contentData: any) => {
        const { data } = await api.post(`/items/${itemId}/content`, contentData);
        return data;
    },
    update: async (itemId: string, contentData: any) => {
        const { data } = await api.patch(`/items/${itemId}/content`, contentData);
        return data;
    },
    get: async (itemId: string) => {
        const { data } = await api.get(`/items/${itemId}/content`);
        return data;
    },
    getPreview: async (itemId: string) => {
        const { data } = await api.get(`/courses/public/items/${itemId}/preview`);
        return data;
    },
};

// Quizzes
export const Quizzes = {
    create: async (itemId: string, quizData: any) => {
        const { data } = await api.post(`/items/${itemId}/quiz`, quizData);
        return data;
    },
    update: async (quizId: string, quizData: any) => {
        const { data } = await api.patch(`/quizzes/${quizId}`, quizData);
        return data;
    },
    get: async (quizId: string) => {
        const { data } = await api.get(`/quizzes/${quizId}`);
        return data;
    },
    // Questions
    addQuestion: async (quizId: string, questionData: any) => {
        const { data } = await api.post(`/quizzes/${quizId}/questions`, questionData);
        return data;
    },
    updateQuestion: async (questionId: string, questionData: any) => {
        const { data } = await api.patch(`/questions/${questionId}`, questionData);
        return data;
    },
    deleteQuestion: async (questionId: string) => {
        const { data } = await api.delete(`/questions/${questionId}`);
        return data;
    },
    reorderQuestions: async (quizId: string, orders: { id: string; order_index: number }[]) => {
        const { data } = await api.post(`/quizzes/${quizId}/questions/reorder`, { question_orders: orders });
        return data;
    },
    // Submissions
    submit: async (quizId: string, answers: any, timeTaken?: number) => {
        const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers, time_taken_minutes: timeTaken });
        return data;
    },
    getSubmissions: async (quizId: string) => {
        const { data } = await api.get(`/quizzes/${quizId}/submissions`);
        return data;
    },
    getMySubmissions: async (quizId: string) => {
        const { data } = await api.get(`/quizzes/${quizId}/my-submissions`);
        return data;
    },
    updateSubmissionDate: async (submissionId: string, submittedAt: string) => {
        const { data } = await api.patch(`/quizzes/submissions/${submissionId}/date`, { submitted_at: submittedAt });
        return data;
    },
};

// Assignments
export const Assignments = {
    create: async (itemId: string, assignmentData: any) => {
        const { data } = await api.post(`/items/${itemId}/assignment`, assignmentData);
        return data;
    },
    update: async (assignmentId: string, assignmentData: any) => {
        const { data } = await api.patch(`/assignments/${assignmentId}`, assignmentData);
        return data;
    },
    get: async (assignmentId: string) => {
        const { data } = await api.get(`/assignments/${assignmentId}`);
        return data;
    },
    // Submissions
    submit: async (assignmentId: string, submissionData: any) => {
        const { data } = await api.post(`/assignments/${assignmentId}/submit`, submissionData);
        return data;
    },
    grade: async (submissionId: string, grade: number, feedback?: string) => {
        const { data } = await api.post(`/submissions/${submissionId}/grade`, { grade, feedback });
        return data;
    },
    getSubmissions: async (assignmentId: string) => {
        const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
        return data;
    },
    getMySubmissions: async (assignmentId: string) => {
        const { data } = await api.get(`/assignments/${assignmentId}/my-submissions`);
        return data;
    },
    getSubmission: async (submissionId: string) => {
        const { data } = await api.get(`/submissions/${submissionId}`);
        return data;
    },
    updateSubmissionDate: async (submissionId: string, submittedAt: string) => {
        const { data } = await api.patch(`/submissions/${submissionId}/date`, { submitted_at: submittedAt });
        return data;
    },
};


// Certificate Templates
export const CertificateTemplates = {
    getAll: async () => {
        const { data } = await api.get("/certificate-templates");
        return data;
    },
    getOne: async (id: string) => {
        const { data } = await api.get(`/certificate-templates/${id}`);
        return data;
    },
    getDefault: async () => {
        const { data } = await api.get("/certificate-templates/default");
        return data;
    },
    create: async (templateData: any) => {
        const { data } = await api.post("/certificate-templates", templateData);
        return data;
    },
    update: async (id: string, templateData: any) => {
        const { data } = await api.patch(`/certificate-templates/${id}`, templateData);
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/certificate-templates/${id}`);
        return data;
    },
    setDefault: async (id: string) => {
        const { data } = await api.post(`/certificate-templates/${id}/set-default`);
        return data;
    },
};

export const AI = {
    generateText: async (prompt: string, context?: string) => {
        // Mock implementation for now
        // const { data } = await api.post('/ai/generate', { prompt, context });
        // return data;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    text: `[AI Generated Content for "${prompt}"]\n\nHere is a detailed explanation based on your request. This content is generated to demonstrate the AI capabilities of the platform.`
                });
            }, 1500);
        });
    },
    chat: async (message: string, courseId?: string, lessonId?: string) => {
        const { data } = await api.post('/ai/chat', { message, courseId, lessonId });
        return data;
    },
    publicChat: async (message: string) => {
        const { data } = await api.post('/ai/public/chat', { message });
        return data;
    }
};

export const Uploads = {
    upload: async (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
        return data;
    }
};

export const Videos = {
    uploadToMicroservice: async (file: File, videoId: string, organizationId: string, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('video_id', videoId);
        formData.append('organization_id', organizationId);

        // Access environment variables securely
        const MICROSERVICE_URL = import.meta.env.VITE_VIDEO_SERVICE_URL || 'http://localhost:8000';
        const SERVICE_KEY = import.meta.env.VITE_INTERNAL_SERVICE_KEY || 'dev-key';

        const response = await axios.post(`${MICROSERVICE_URL}/video/receive`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'x-internal-service-key': SERVICE_KEY,
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
        return response.data;
    },
    checkStatus: async (videoId: string) => {
        // Poll the Backend for the status, not the Microservice directly (as microservice might clean up)
        // OR poll the Microservice first? 
        // Our backend now has a check-status endpoint.
        const { data } = await api.post('/upload/check-status', { video_id: videoId });
        return data;
    }
};

export const Support = {
    createTicket: async (data: any) => {
        const response = await api.post('/support/tickets', data);
        return response.data;
    },
    getStudentTickets: async () => {
        const response = await api.get('/support/tickets/student');
        return response.data;
    },
    getAdminTickets: async () => {
        const response = await api.get('/support/tickets/admin');
        return response.data;
    },
    getTicketDetails: async (id: string) => {
        const response = await api.get(`/support/tickets/${id}`);
        return response.data;
    },
    addMessage: async (id: string, data: { message: string; image_url?: string }) => {
        const response = await api.post(`/support/tickets/${id}/messages`, data);
        return response.data;
    },
    closeTicket: async (id: string) => {
        const response = await api.patch(`/support/tickets/${id}/close`);
        return response.data;
    }
};

export const Announcements = {
    create: async (data: any) => {
        const response = await api.post('/announcements', data);
        return response.data;
    },
    getAdminAll: async () => {
        const response = await api.get('/announcements');
        return response.data;
    },
    getStudentActive: async () => {
        const response = await api.get('/announcements/student');
        return response.data;
    },
    toggleStatus: async (id: string) => {
        const response = await api.patch(`/announcements/${id}/toggle-status`);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/announcements/${id}`);
        return response.data;
    }
};

export const Settings = {
    getPlatformSettings: async () => {
        const response = await api.get('/franchises/me/settings');
        return response.data;
    },
    updatePlatformSettings: async (data: any) => {
        const response = await api.patch('/franchises/me/settings', data);
        return response.data;
    }
};

export const EmailTemplates = {
    getAll: async () => {
        const { data } = await api.get('/mail/templates');
        return data;
    },
    update: async (type: string, payload: { subject: string; body: string }) => {
        const { data } = await api.put(`/mail/templates/${type}`, payload);
        return data;
    }
};

export const AdminSettings = {
    getAiSettings: async () => {
        const { data } = await api.get('/admin/ai-settings');
        return data;
    },
    updateAiSettings: async (settings: { gemini_api_key?: string; global_ai_control?: boolean }) => {
        const { data } = await api.put('/admin/ai-settings', settings);
        return data;
    }
};

export const Reviews = {
    submit: async (courseId: string, rating: number, comment?: string) => {
        const { data } = await api.post('/reviews', { course_id: courseId, rating, comment });
        return data;
    },
    getStats: async (courseId: string) => {
        const { data } = await api.get(`/reviews/course/${courseId}/stats`);
        return data;
    },
    getForCourse: async (courseId: string) => {
        const { data } = await api.get(`/reviews/course/${courseId}`);
        return data;
    },
    getMyReview: async (courseId: string) => {
        const { data } = await api.get(`/reviews/me/${courseId}`);
        return data;
    }
};

export const QA = {
    askQuestion: async (lessonId: string, question: string) => {
        const { data } = await api.post(`/qa/lesson`, { lesson_id: lessonId, question });
        return data;
    },
    getLessonQuestions: async (lessonId: string) => {
        const { data } = await api.get(`/qa/lesson/${lessonId}`);
        return data;
    },
    getAdminCourses: async () => {
        const { data } = await api.get(`/qa/admin/courses`);
        return data;
    },
    getCourseQuestions: async (courseId: string) => {
        const { data } = await api.get(`/qa/admin/course/${courseId}`);
        return data;
    },
    replyQuestion: async (qaId: string, reply: string) => {
        const { data } = await api.post(`/qa/admin/${qaId}/reply`, { reply });
        return data;
    },
    studentReply: async (qaId: string, reply: string) => {
        const { data } = await api.post(`/qa/${qaId}/reply`, { reply });
        return data;
    }
};

export const Instructors = {
    getDashboardStats: async () => {
        const { data } = await api.get('/instructors/dashboard/stats');
        return data;
    },
    getStudents: async () => {
        const { data } = await api.get('/instructors/dashboard/students');
        return data;
    },
    getReviews: async () => {
        const { data } = await api.get('/instructors/dashboard/reviews');
        return data;
    },
    getQA: async () => {
        const { data } = await api.get('/instructors/dashboard/qa');
        return data;
    }
};

export const Feedback = {
    submit: async (content: string) => {
        const { data } = await api.post('/feedback', { content });
        return data;
    },
    getAdminFeedback: async () => {
        const { data } = await api.get('/feedback/admin');
        return data;
    },
    updateStatus: async (id: string, status: string) => {
        const { data } = await api.patch(`/feedback/${id}/status`, { status });
        return data;
    }
};

export default api;
