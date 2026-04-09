import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { QA, Courses } from '@/lib/api';
import { Loader2, Reply } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedDashboard } from '@/components/layout/UnifiedDashboard';
import { AdminDashboardLayout } from '@/components/layout/AdminDashboardLayout';

export default function QAManagement() {
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [questions, setQuestions] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingQA, setLoadingQA] = useState(false);
    
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [submittingReply, setSubmittingReply] = useState<string | null>(null);
    
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            let data = [];
            if (user?.role === 'teacher') {
                data = await Courses.getMyCourses();
                // Filter courses that have QA questions or just show all of them?
                // For teachers it's fine to show all their courses, but it's better to show ones with enrollments
            } else {
                data = await QA.getAdminCourses();
            }
            setCourses(data);
            if (data.length > 0) {
                setSelectedCourse(data[0].id);
                loadQuestions(data[0].id);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
        } finally {
            setLoadingCourses(false);
        }
    };

    const loadQuestions = async (courseId: string) => {
        if (!courseId) return;
        setLoadingQA(true);
        try {
            const data = await QA.getCourseQuestions(courseId);
            setQuestions(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load Q/A', variant: 'destructive' });
        } finally {
            setLoadingQA(false);
        }
    };

    const handleCourseChange = (courseId: string) => {
        setSelectedCourse(courseId);
        loadQuestions(courseId);
    };

    const handleReply = async (qaId: string) => {
        const text = replyText[qaId];
        if (!text || !text.trim()) return;

        setSubmittingReply(qaId);
        try {
            const reply = await QA.replyQuestion(qaId, text);
            // Update local state
            setQuestions(questions.map(q => {
                if (q.id === qaId) {
                    return {
                        ...q,
                        status: 'ANSWERED',
                        replies: [...(q.replies || []), {
                            ...reply,
                            user: {
                                name: user?.name,
                                avatar_url: user?.avatar_url,
                                role: user?.role
                            }
                        }]
                    };
                }
                return q;
            }));
            
            setReplyText(prev => ({ ...prev, [qaId]: '' }));
            toast({ title: 'Success', description: 'Reply sent successfully. Student has been notified.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
        } finally {
            setSubmittingReply(null);
        }
    };

    if (loadingCourses) {
        return <div className="flex justify-center items-center py-20 bg-background"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/></div>;
    }

    const content = (
        <div className={user?.role === 'teacher' ? "p-6 max-w-7xl mx-auto space-y-6 font-sans" : "space-y-6 animate-in fade-in duration-500"}>

            <Card>
                <CardHeader>
                    <CardTitle>Select Course</CardTitle>
                    <CardDescription>View questions for a specific course.</CardDescription>
                </CardHeader>
                <CardContent>
                    {courses.length === 0 ? (
                        <div className="text-muted-foreground">No questions have been asked in your courses yet.</div>
                    ) : (
                        <Select value={selectedCourse} onValueChange={handleCourseChange}>
                            <SelectTrigger className="w-full md:w-[400px]">
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title} ({course._count?.qa_questions || 0})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {selectedCourse && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Questions ({questions.length})</h3>
                    {loadingQA ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>
                    ) : questions.length === 0 ? (
                        <Card><CardContent className="py-8 text-center text-muted-foreground">No questions found for this course.</CardContent></Card>
                    ) : (
                        questions.map(qa => (
                            <Card key={qa.id}>
                                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                                    <div className="flex gap-4">
                                        <Avatar>
                                            <AvatarImage src={qa.student?.avatar_url} />
                                            <AvatarFallback>{qa.student?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{qa.student?.name}</CardTitle>
                                            <CardDescription>
                                                Lesson: {qa.lesson?.title} <br/> {new Date(qa.created_at).toLocaleDateString()} at {new Date(qa.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={qa.status === 'OPEN' ? 'destructive' : 'secondary'} className="ml-2">
                                        {qa.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted p-4 rounded-lg text-sm text-gray-800">
                                        <div className="font-medium mb-1 text-muted-foreground text-xs uppercase tracking-wide">Question</div>
                                        {qa.question}
                                    </div>

                                    {/* Replies */}
                                    {qa.replies && qa.replies.length > 0 && (
                                        <div className="pl-6 space-y-3 border-l-2 border-primary/20">
                                            {qa.replies.map((reply: any) => (
                                                <div key={reply.id} className="bg-primary/5 p-3 rounded-lg text-sm">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold">{reply.user?.name} <Badge variant="outline" className="ml-1 text-[10px] h-4 leading-none">Admin</Badge></span>
                                                        <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div>{reply.reply}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply Box */}
                                    <div className="mt-4 flex gap-3">
                                        <Textarea 
                                            placeholder="Write your reply to the student..."
                                            value={replyText[qa.id] || ''}
                                            onChange={e => setReplyText({ ...replyText, [qa.id]: e.target.value })}
                                            className="resize-none h-10 min-h-0 py-2 focus-visible:ring-1"
                                        />
                                        <Button 
                                            onClick={() => handleReply(qa.id)}
                                            disabled={submittingReply === qa.id || !(replyText[qa.id]?.trim())}
                                        >
                                            {submittingReply === qa.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Reply className="w-4 h-4 mr-2" />}
                                            Reply
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );

    if (user?.role === 'teacher') {
        return (
            <UnifiedDashboard title="Q/A Management" subtitle="Respond to your students">
                {content}
            </UnifiedDashboard>
        );
    }

    return (
        <AdminDashboardLayout title="Q/A Management" subtitle="Answer student questions from franchise courses.">
            {content}
        </AdminDashboardLayout>
    );
}
