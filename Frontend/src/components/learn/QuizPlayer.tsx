import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, ChevronRight, RotateCcw } from "lucide-react";
import { Quizzes } from "@/lib/api";
import { cn } from "@/lib/utils";

interface QuizPlayerProps {
    quizId: string;
    onComplete: () => void;
}

interface Question {
    id: string;
    question_text: string;
    type: string;
    options?: string | string[]; // JSON string, comma-separated, or Array
    points: number;
    set_number?: number;
}

interface QuizData {
    id: string;
    title: string;
    description: string;
    passing_score: number;
    time_limit_minutes: number;
    attempts_allowed: number;
    questions: Question[];
    total_sets?: number;
}

export default function QuizPlayer({ quizId, onComplete }: QuizPlayerProps) {
    const { toast } = useToast();
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Quiz State
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    // Result State
    const [result, setResult] = useState<any>(null);
    const [attemptsUsed, setAttemptsUsed] = useState(0);
    const [bestSubmission, setBestSubmission] = useState<any>(null);

    useEffect(() => {
        loadQuiz();
    }, [quizId]);

    useEffect(() => {
        if (started && timeRemaining !== null && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev !== null && prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [started, timeRemaining]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const [quizData, submissions] = await Promise.all([
                Quizzes.get(quizId),
                Quizzes.getMySubmissions(quizId).catch(() => []) // Handle error gracefully
            ]);

            // Determine active set
            // If failed previous attempt, move to next set
            const failedAttempts = submissions.filter((s: any) => !s.passed).length;
            setAttemptsUsed(submissions.length);

            const totalSets = quizData.total_sets || 1;
            const currentSet = (failedAttempts % totalSets) + 1;

            // Filter questions for the current set
            // Ensure we handle potential string/number mismatches
            let activeQuestions = quizData.questions.filter((q: Question) => {
                const qSet = q.set_number ? Number(q.set_number) : 1;
                return qSet === currentSet;
            });

            // Fallback: If no questions found for the current set, try set 1, then all questions
            if (activeQuestions.length === 0) {
                activeQuestions = quizData.questions.filter((q: Question) => {
                    const qSet = q.set_number ? Number(q.set_number) : 1;
                    return qSet === 1;
                });
                if (activeQuestions.length === 0) {
                    activeQuestions = quizData.questions;
                }
            }

            setQuiz({
                ...quizData,
                questions: activeQuestions
            });

            // ── Key fix: if the student already has a passing submission,
            // show the pass result screen immediately instead of the start screen.
            const passingSubmission = submissions.find((s: any) => s.passed);
            if (passingSubmission) {
                setBestSubmission(passingSubmission);
                setResult(passingSubmission); // jump straight to result view
            }
} catch (error) {
            console.error("Failed to load quiz:", error);
            toast({
                title: "Error",
                description: "Failed to load quiz content",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        setStarted(true);
        if (quiz?.time_limit_minutes) {
            setTimeRemaining(quiz.time_limit_minutes * 60);
        }
    };

    const handleAnswer = (value: string) => {
        if (!quiz) return;
        const currentQuestion = quiz.questions[currentQuestionIndex];
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: value
        }));
    };

    const handleNext = () => {
        if (!quiz) return;
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!quiz || submitting) return;

        try {
            setSubmitting(true);
            const timeTaken = quiz.time_limit_minutes
                ? (quiz.time_limit_minutes * 60) - (timeRemaining || 0)
                : 0; // consistent calculation needed, simplistic for now

            const submission = await Quizzes.submit(quiz.id, answers, Math.ceil(timeTaken / 60));
            setResult(submission);
            if (submission.passed) {
                onComplete();
                toast({
                    title: "Quiz Completed!",
                    description: `You scored ${submission.score}%`,
                });
            } else {
                toast({
                    title: "Quiz Failed",
                    description: `You scored ${submission.score}%. Passing score is ${quiz.passing_score}%`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to submit quiz:", error);
            toast({
                title: "Error",
                description: "Failed to submit quiz",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!quiz) return null;

    // Result View
    if (result) {
        const isPassed = result.passed;
        const isPreloaded = !!bestSubmission && result === bestSubmission; // came from a previous session
        const correctCount = result.correct_answers ?? result.correctAnswers ?? null;
        const totalQuestions = result.total_questions ?? result.totalQuestions ?? (quiz?.questions?.length ?? null);
        const attemptsLeft = quiz ? Math.max(0, quiz.attempts_allowed - attemptsUsed) : 0;

        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 py-4">
                {/* Already passed banner */}
                {isPreloaded && isPassed && (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        You already passed this quiz — your best result is shown below.
                    </div>
                )}

                <Card className={cn("border-t-4 shadow-xl shadow-black/5 rounded-2xl overflow-hidden", isPassed ? "border-t-emerald-500" : "border-t-red-500")}>
                    {/* Header */}
                    <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-b from-muted/20 to-transparent">
                        <div className="flex justify-center mb-4">
                            <div className={cn(
                                "w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-inner",
                                isPassed
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                    : "border-red-200 bg-red-50 text-red-600"
                            )}>
                                <span className="text-3xl font-black leading-none">{result.score}%</span>
                                <span className="text-[10px] font-semibold uppercase tracking-widest mt-1 opacity-70">Score</span>
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {isPassed ? "🎉 Quiz Passed!" : "Quiz Not Passed"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isPassed
                                ? "Excellent work! You've successfully cleared this quiz."
                                : `You need ${quiz?.passing_score}% to pass. Keep practicing!`}
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-4 px-6 pb-6">
                        {/* Stats row */}
                        <div className={cn("grid gap-3", correctCount !== null ? "grid-cols-4" : "grid-cols-3")}>
                            {/* Score */}
                            <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl text-center">
                                <span className="text-2xl font-black text-gray-900">{result.score}%</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Your Score</span>
                            </div>
                            {/* Marks */}
                            {correctCount !== null && (
                                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl text-center">
                                    <span className="text-2xl font-black text-gray-900">{correctCount}/{totalQuestions}</span>
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Correct</span>
                                </div>
                            )}
                            {/* Passing */}
                            <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl text-center">
                                <span className="text-2xl font-black text-gray-900">{quiz?.passing_score}%</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Required</span>
                            </div>
                            {/* Status */}
                            <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl text-center">
                                <Badge
                                    className={cn(
                                        "text-xs font-bold uppercase tracking-wide border-0 mt-1",
                                        isPassed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                    )}
                                >
                                    {isPassed ? "PASSED" : "FAILED"}
                                </Badge>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5">Status</span>
                            </div>
                        </div>

                        {/* Attempts info */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                            <span>Attempts used: <strong className="text-gray-700">{attemptsUsed}</strong> / {quiz?.attempts_allowed}</span>
                            {attemptsLeft > 0 && !isPassed && (
                                <span className="text-amber-600 font-medium">{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</span>
                            )}
                        </div>

                        {/* Max attempts message */}
                        {!isPassed && attemptsUsed >= (quiz?.attempts_allowed ?? Infinity) && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center font-medium">
                                Maximum attempts reached. You cannot retry this quiz.
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="justify-center gap-3 pb-6 border-t bg-muted/10 pt-4">
                        {/* Retry if failed and attempts remain */}
                        {!isPassed && attemptsUsed < (quiz?.attempts_allowed ?? Infinity) && (
                            <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => {
                                setResult(null);
                                setBestSubmission(null);
                                setStarted(false);
                                setAnswers({});
                                setCurrentQuestionIndex(0);
                                loadQuiz();
                            }}>
                                <RotateCcw className="w-3.5 h-3.5" />
                                Retry Quiz
                            </Button>
                        )}
                        {/* Continue if passed */}
                        {isPassed && (
                            <Button size="sm" className="rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100" onClick={() => onComplete()}>
                                <CheckCircle2 className="w-4 h-4" />
                                Continue Learning
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        )}
                        {/* Retake for practice if passed and attempts remain */}
                        {isPassed && attemptsLeft > 0 && (
                            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground gap-2" onClick={() => {
                                setResult(null);
                                setBestSubmission(null);
                                setStarted(false);
                                setAnswers({});
                                setCurrentQuestionIndex(0);
                                loadQuiz();
                            }}>
                                <RotateCcw className="w-3.5 h-3.5" />
                                Retake for Practice
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Start Screen
    // Start Screen - Modernized
    // Start Screen - Compact & Centered
    if (!started) {
        const isLimitReached = attemptsUsed >= quiz.attempts_allowed;

        return (
            <div className="flex flex-col items-center justify-center p-4 h-full">
                <Card className="w-full max-w-2xl border-none shadow-lg rounded-2xl overflow-hidden bg-white/95 backdrop-blur">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Left Side - Hero / Info */}
                        <div className="p-6 flex flex-col justify-between bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
                            <div className="space-y-4">
                                <Badge className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full w-fit">
                                    Quiz
                                </Badge>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
                                    {quiz.title}
                                </h1>
                                {quiz.description && (
                                    <div className="prose prose-sm prose-gray text-muted-foreground leading-snug line-clamp-3"
                                        dangerouslySetInnerHTML={{ __html: quiz.description }} />
                                )}
                            </div>

                            <div className="mt-8 space-y-2">
                                {isLimitReached ? (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium text-center">
                                        Maximum attempts ({quiz.attempts_allowed}) reached.
                                    </div>
                                ) : (
                                    <Button size="default" className="w-full rounded-full font-semibold shadow-md transition-all" onClick={handleStart}>
                                        Start Quiz
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Stats Grid */}
                        <div className="p-6 bg-white flex flex-col justify-center">
                            <h3 className="text-xs font-semibold mb-4 text-gray-400 uppercase tracking-wider">Details</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{quiz.passing_score}%</div>
                                        <div className="text-xs text-gray-500 font-medium">Passing</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">
                                            {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : "No Limit"}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">Time</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{attemptsUsed}/{quiz.attempts_allowed}</div>
                                        <div className="text-xs text-gray-500 font-medium">Attempts</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                                        <RotateCcw className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{quiz.questions.length}</div>
                                        <div className="text-xs text-gray-500 font-medium">Questions</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Question View
    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h3 className="text-xl font-semibold">Error Loading Question</h3>
                <p className="text-muted-foreground">Detailed question data could not be found.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Reload Lesson</Button>
            </div>
        );
    }

    const parseOptions = (optionsData: string | string[] | undefined) => {
        if (!optionsData) return [];

        // If it's already an array, return it
        if (Array.isArray(optionsData)) {
            return optionsData;
        }

        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(optionsData);
            if (Array.isArray(parsed)) return parsed;
            return [];
        } catch (e) {
            // Fallback: If it's a comma-separated string, split it
            if (typeof optionsData === 'string') {
                return optionsData.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
            }
            return [];
        }
    };

    const options = parseOptions(currentQuestion.options);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 w-full">
            <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Quiz Header - Clean & Centered */}
                <div className="flex items-center justify-between">
                    <div>
                        <Badge variant="outline" className="mb-2 uppercase tracking-wider text-xs font-bold text-muted-foreground px-2 py-0.5">
                            Quiz • {currentQuestionIndex + 1} of {quiz.questions.length}
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{quiz.title}</h2>
                    </div>
                    {timeRemaining !== null && (
                        <div className={cn(
                            "flex items-center gap-2 font-mono text-base font-medium px-4 py-2 bg-secondary/50 rounded-full transition-colors",
                            timeRemaining < 60 && "text-red-600 bg-red-50 animate-pulse"
                        )}>
                            <Clock className="w-5 h-5" />
                            {formatTime(timeRemaining)}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                    />
                </div>

                {/* Question Card */}
                <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-10 md:p-14 space-y-12">
                        <div className="space-y-6">
                            <h3 className="text-2xl md:text-4xl font-medium leading-normal text-gray-800 tracking-tight">
                                {currentQuestion.question_text}
                            </h3>
                        </div>

                        <RadioGroup
                            value={answers[currentQuestion.id] || ""}
                            onValueChange={handleAnswer}
                            className="space-y-4"
                        >
                            {options.map((option: string, index: number) => {
                                const isSelected = answers[currentQuestion.id] === option;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleAnswer(option)}
                                        className={cn(
                                            "flex items-center space-x-4 border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                            isSelected
                                                ? "border-primary bg-primary/5 shadow-inner"
                                                : "border-transparent bg-secondary/30 hover:bg-secondary/60 hover:scale-[1.01]"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                            isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 group-hover:border-muted-foreground"
                                        )}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                        </div>
                                        <Label className="flex-1 cursor-pointer text-lg font-normal text-gray-700 group-hover:text-gray-900">
                                            {option}
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </CardContent >

                    <CardFooter className="flex justify-between items-center p-8 bg-muted/5 border-t">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            disabled={currentQuestionIndex === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            size="lg"
                            className="px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold text-lg h-12"
                            onClick={handleNext}
                            disabled={submitting}
                        >
                            {currentQuestionIndex === quiz.questions.length - 1 ? (
                                submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Submit Quiz"
                            ) : (
                                <>
                                    Next <ChevronRight className="w-5 h-5 ml-1" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card >
            </div>
        </div>
    );
}
