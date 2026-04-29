import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api"; // Assuming default export based on likely error
import { QuizBuilder } from "@/components/editors/QuizBuilder";
import { QuizQuestion } from "@/types/courseBuilder";

export default function QuizCreator() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    // Quiz Meta State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [totalSets, setTotalSets] = useState(1);
    const [questionsPerSet, setQuestionsPerSet] = useState(10);
    const [passingScore, setPassingScore] = useState(75);
    const [attemptsAllowed, setAttemptsAllowed] = useState(3);
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [randomize, setRandomize] = useState(false);
    const [showAnswers, setShowAnswers] = useState(true);
    const [autoGrade, setAutoGrade] = useState(true);

    // Questions State
    // We keep a flat list of questions, each with a set_number
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [activeSetTab, setActiveSetTab] = useState("set-1");

    useEffect(() => {
        if (isEditMode) {
            fetchQuiz();
        }
    }, [id]);

    const fetchQuiz = async () => {
        try {
            const response = await api.get(`/quizzes/${id}`);
            const quiz = response.data;
            setTitle(quiz.title);
            setDescription(quiz.description || "");
            setTotalSets(quiz.total_sets);
            setQuestionsPerSet(quiz.questions_per_set);
            setPassingScore(quiz.passing_score);
            setAttemptsAllowed(quiz.attempts_allowed);
            setTimeLimit(quiz.time_limit_minutes);
            setRandomize(quiz.randomize_questions);
            setShowAnswers(quiz.show_answers);
            setAutoGrade(quiz.auto_grade);
            // Map backend format → frontend format:
            // Backend always stores correct_answers as a JSON array.
            // Frontend QuizBuilder uses:
            //   - correct_answer (string) for MCQ and TRUE_FALSE
            //   - correct_answers (string[]) for MULTIPLE
            const mappedQuestions = (quiz.questions || []).map((q: any) => {
                if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
                    return {
                        ...q,
                        correct_answer: Array.isArray(q.correct_answers) && q.correct_answers.length > 0
                            ? q.correct_answers[0]
                            : (q.correct_answer || undefined),
                        correct_answers: undefined,
                    };
                }
                // MULTIPLE — keep correct_answers array as-is
                return { ...q, correct_answer: undefined };
            });
            setQuestions(mappedQuestions);
        } catch (error) {
            console.error("Failed to fetch quiz:", error);
            toast({
                title: "Error",
                description: "Failed to load quiz details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!title) {
                toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
                return;
            }
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleSaveQuiz = async () => {
        if (!title) return;
        setSaving(true);
        try {
            if (questions.length === 0) {
                toast({ title: "Warning", description: "You might want to add some questions first.", variant: "default" });
            }

            const payload = {
                title,
                description,
                total_sets: totalSets,
                questions_per_set: questionsPerSet,
                passing_score: passingScore,
                attempts_allowed: attemptsAllowed,
                time_limit_minutes: timeLimit && timeLimit > 0 ? timeLimit : undefined,
                randomize_questions: randomize,
                show_answers: showAnswers,
                auto_grade: autoGrade,
                questions: questions.map((q, index) => {
                    // Map frontend format → backend format:
                    // Backend DTO only knows correct_answers (array).
                    // For MCQ/TRUE_FALSE: wrap correct_answer into [correct_answer].
                    // For MULTIPLE: pass correct_answers array directly.
                    const { correct_answer, correct_answers, id, ...rest } = q;
                    let backendCorrectAnswers: string[] | undefined;
                    if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
                        backendCorrectAnswers = correct_answer ? [correct_answer] : [];
                    } else if (q.type === 'MULTIPLE') {
                        backendCorrectAnswers = correct_answers || [];
                    } else {
                        // FILL_BLANK: correct_answer is a plain string answer
                        backendCorrectAnswers = correct_answer ? [correct_answer] : [];
                    }
                    return {
                        ...rest,
                        order_index: index,
                        correct_answers: backendCorrectAnswers,
                    };
                }),
            };

            if (isEditMode) {
                await api.patch(`/quizzes/${id}`, payload);
                toast({ title: "Success", description: "Quiz updated successfully" });
            } else {
                await api.post("/quizzes", payload);
                toast({ title: "Success", description: "Quiz created successfully" });
            }
            navigate("/dashboard/quizzes");
        } catch (error) {
            console.error("Failed to save quiz:", error);
            toast({
                title: "Error",
                description: "Failed to save quiz",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSetQuestionsChange = (newSetQuestions: QuizQuestion[], setNum: number) => {
        // Merge logic:
        // Remove all questions for this set from main state
        // Add new questions for this set

        const otherQuestions = questions.filter(q => (q.set_number || 1) !== setNum);

        // Ensure new questions have correct set_number
        const updatedSetQuestions = newSetQuestions.map(q => ({
            ...q,
            set_number: setNum
        }));

        setQuestions([...otherQuestions, ...updatedSetQuestions]);
    };

    if (loading) {
        return (
            <AdminDashboardLayout title="Loading..." subtitle="Please wait">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AdminDashboardLayout>
        )
    }

    return (
        <AdminDashboardLayout
            title={isEditMode ? "Edit Quiz" : "Create New Quiz"}
            subtitle={isEditMode ? "Modify existing quiz" : "Setup quiz details and questions"}
        >
            <div className="max-w-5xl mx-auto">
                {/* Progress Stepper */}
                <div className="mb-8 flex items-center justify-center">
                    <div className={`flex items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                            1
                        </div>
                        <span className="ml-2 font-medium">Settings</span>
                    </div>
                    <div className={`w-16 h-0.5 mx-4 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
                    <div className={`flex items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                            2
                        </div>
                        <span className="ml-2 font-medium">Questions</span>
                    </div>
                </div>

                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Settings</CardTitle>
                            <CardDescription>Configure the basic settings for your quiz.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Quiz Title *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Final Exam: Advanced React"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of what this quiz covers..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="totalSets">Total Sets</Label>
                                    <Input
                                        id="totalSets"
                                        type="number"
                                        min={1}
                                        value={totalSets}
                                        onChange={(e) => setTotalSets(parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">Number of unique question sets available.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="questionsPerSet">Questions per Set</Label>
                                    <Input
                                        id="questionsPerSet"
                                        type="number"
                                        min={1}
                                        value={questionsPerSet}
                                        onChange={(e) => setQuestionsPerSet(parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">How many questions shown to student.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                                    <Input
                                        id="passingScore"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={passingScore}
                                        onChange={(e) => setPassingScore(parseInt(e.target.value) || 75)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="attemptsAllowed">Attempts Allowed</Label>
                                    <Input
                                        id="attemptsAllowed"
                                        type="number"
                                        min={0}
                                        value={attemptsAllowed}
                                        onChange={(e) => setAttemptsAllowed(parseInt(e.target.value) || 3)}
                                    />
                                    <p className="text-xs text-muted-foreground">0 for unlimited attempts.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timeLimit">Time Limit (Minutes)</Label>
                                    <Input
                                        id="timeLimit"
                                        type="number"
                                        min={0}
                                        value={timeLimit || ''}
                                        onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="randomize" className="flex flex-col space-y-1">
                                        <span>Randomize Questions</span>
                                        <span className="font-normal text-xs text-muted-foreground">Shuffle questions within a set</span>
                                    </Label>
                                    <Switch id="randomize" checked={randomize} onCheckedChange={setRandomize} />
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="showAnswers" className="flex flex-col space-y-1">
                                        <span>Show Answers</span>
                                        <span className="font-normal text-xs text-muted-foreground">Show correct answers after submission</span>
                                    </Label>
                                    <Switch id="showAnswers" checked={showAnswers} onCheckedChange={setShowAnswers} />
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="autoGrade" className="flex flex-col space-y-1">
                                        <span>Auto Grade</span>
                                        <span className="font-normal text-xs text-muted-foreground">Automatically grade objective questions</span>
                                    </Label>
                                    <Switch id="autoGrade" checked={autoGrade} onCheckedChange={setAutoGrade} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button onClick={handleNext} className="w-full md:w-auto">
                                    Next: Add Questions
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Settings
                            </Button>
                            <Button onClick={handleSaveQuiz} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Quiz
                                    </>
                                )}
                            </Button>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Questions</CardTitle>
                                <CardDescription>
                                    Create questions for each set. You have {totalSets} set(s) configured.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeSetTab} onValueChange={setActiveSetTab} className="w-full">
                                    <TabsList className="mb-4">
                                        {Array.from({ length: totalSets }).map((_, i) => (
                                            <TabsTrigger key={`set-${i + 1}`} value={`set-${i + 1}`}>
                                                Set {i + 1}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {Array.from({ length: totalSets }).map((_, i) => {
                                        const setNum = i + 1;
                                        const setQuestions = questions.filter(q => (q.set_number || 1) === setNum);

                                        return (
                                            <TabsContent key={`set-${setNum}`} value={`set-${setNum}`}>
                                                <div className="bg-muted/10 p-4 rounded-lg border">
                                                    <QuizBuilder
                                                        questions={setQuestions}
                                                        onChange={(qs) => handleSetQuestionsChange(qs, setNum)}
                                                    />
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AdminDashboardLayout>
    );
}
