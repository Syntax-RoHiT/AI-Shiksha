import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CourseBuilderContainer } from './CourseBuilderContainer';
import { CourseBuilderLayout } from '../CourseBuilderLayout';
import { CurriculumBuilder } from '../CurriculumBuilder';
import { BasicInfoStep } from './BasicInfoStep';
import { SettingsStep } from './SettingsStep';
import { CertificateStep } from './CertificateStep';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Courses, CourseApproval } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CourseBuilderWizard() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('basic');
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const data = await Courses.getOne(courseId!);
            setCourse(data);
        } catch (error) {
            console.error('Failed to fetch course', error);
            toast.error("Failed to load course details");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBasicInfo = async (data: any, shouldNavigate: boolean = false) => {
        try {
            await Courses.update(courseId!, data);
            setCourse({ ...course, ...data });
            toast.success(shouldNavigate ? "Basic info saved, proceeding..." : "Basic info saved");

            if (shouldNavigate) {
                setActiveTab('curriculum');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save basic info");
        }
    };

    const handleSaveSettings = async (data: any, shouldNavigate: boolean = false) => {
        try {
            // Clean optional numeric fields - convert 0 to undefined
            const cleanedData = {
                ...data,
                original_price: data.original_price || undefined,
                discount_percentage: data.discount_percentage || undefined,
                max_students: data.max_students || undefined,
                // Convert empty strings to undefined for optional text fields
                password: data.password?.trim() || undefined,
                meta_title: data.meta_title?.trim() || undefined,
                meta_description: data.meta_description?.trim() || undefined,
                meta_keywords: data.meta_keywords?.trim() || undefined,
                // Keep course_features as-is (it's an object with booleans)
                course_features: data.course_features,
            };

            console.log('Saving course features:', cleanedData.course_features);
            console.log('Full settings payload:', JSON.stringify(cleanedData, null, 2));
            await Courses.update(courseId!, cleanedData);
            setCourse({ ...course, ...cleanedData }); // Update local state with cleaned data
            toast.success(shouldNavigate ? 'Settings saved, proceeding...' : 'Settings saved successfully');

            if (shouldNavigate) {
                setActiveTab('certificate');
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    };

    const handleSaveCertificate = async (data: any) => {
        try {
            await Courses.update(courseId!, data);
            setCourse({ ...course, ...data });
            toast.success("Certificate settings saved");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save certificate settings");
        }
    };

    const canPublish = () => {
        if (!course) return false;
        return !!(
            course.title &&
            course.description &&
            course.category_id &&
            course.slug &&
            // Check if sections > 0? Maybe unrelated for now
            true
        );
    };

    const handlePublish = async () => {
        if (!canPublish()) {
            toast.error("Please complete all required fields before publishing");
            return;
        }

        setPublishing(true);
        try {
            const isTeacher = user?.role === 'teacher';
            
            // If already pending or published, just save and exit
            if (course?.status === 'PENDING_APPROVAL' || course?.status === 'PUBLISHED') {
                toast.success("Course changes saved successfully!");
                navigate(isTeacher ? '/dashboard/my-courses' : '/dashboard/courses');
                return;
            }

            if (isTeacher) {
                await CourseApproval.submitForApproval(courseId!);
                toast.success("Course sent for approval successfully!");
            } else {
                await Courses.publish(courseId!);
                toast.success("Course published successfully!");
            }
            navigate(isTeacher ? '/dashboard/my-courses' : '/dashboard/courses');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to publish course");
        } finally {
            setPublishing(false);
        }
    };

    if (!courseId) return null;

    if (loading) {
        return (
            <CourseBuilderContainer>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CourseBuilderContainer>
        );
    }

    return (
        <CourseBuilderContainer>
            <CourseBuilderLayout
                title={course?.title || "Course Builder"}
                onSave={handlePublish}
                saving={publishing}
                disabled={!canPublish()}
                buttonText={course?.status === 'PUBLISHED' ? 'Update Course' : course?.status === 'PENDING_APPROVAL' ? 'Save Changes' : (user?.role === 'teacher' ? 'Send for Approval' : 'Publish Course')}
                onBack={() => navigate(user?.role === 'teacher' ? '/dashboard/my-courses' : '/dashboard/courses')}
                onPreview={() => window.open(`/dashboard/courses/${courseId}/preview`, '_blank')}
            >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b bg-white px-4 overflow-x-auto no-scrollbar">
                        <TabsList className="h-12 w-full justify-start gap-4 bg-transparent p-0 flex-nowrap min-w-max">
                            <TabsTrigger
                                value="basic"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-3"
                            >
                                Basic Info
                            </TabsTrigger>
                            <TabsTrigger
                                value="curriculum"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-3"
                            >
                                Curriculum
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-3"
                            >
                                Settings
                            </TabsTrigger>
                            <TabsTrigger
                                value="certificate"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-3"
                            >
                                Certificate
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6 bg-slate-50/50 min-h-[calc(100vh-180px)]">
                        <TabsContent value="basic" className="m-0 outline-none">
                            <BasicInfoStep
                                courseId={courseId}
                                initialData={course}
                                onSave={(data) => handleSaveBasicInfo(data, false)}
                                onSaveAndContinue={(data) => handleSaveBasicInfo(data, true)}
                            />
                        </TabsContent>

                        <TabsContent value="curriculum" className="m-0 outline-none">
                            <CurriculumBuilder
                                courseId={courseId}
                                onSave={() => { /* implicit save is handled within CurriculumBuilder, but we can trigger a refresh if needed */ }}
                                onNext={() => setActiveTab('settings')}
                                onBack={() => setActiveTab('basic')}
                            />
                        </TabsContent>

                        <TabsContent value="settings" className="m-0 outline-none">
                            <SettingsStep
                                courseId={courseId}
                                initialData={course}
                                onSave={(data) => handleSaveSettings(data, false)}
                                onSaveAndContinue={(data) => handleSaveSettings(data, true)}
                                onBack={() => setActiveTab('curriculum')}
                            />
                        </TabsContent>

                        <TabsContent value="certificate" className="m-0 outline-none">
                            <CertificateStep
                                courseId={courseId}
                                initialData={course}
                                onSave={handleSaveCertificate}
                                onBack={() => setActiveTab('settings')}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </CourseBuilderLayout>
        </CourseBuilderContainer>
    );
}
