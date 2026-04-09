import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UploadCloud, FileText, CheckCircle2, Download } from "lucide-react";
import { Assignments, Uploads } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AssignmentPlayerProps {
    assignmentId: string;
    onComplete: () => void;
}

export default function AssignmentPlayer({ assignmentId, onComplete }: AssignmentPlayerProps) {
    const { toast } = useToast();
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Submission State
    const [file, setFile] = useState<File | null>(null);
    const [textSubmission, setTextSubmission] = useState("");

    const [submission, setSubmission] = useState<any>(null);

    useEffect(() => {
        loadAssignment();
    }, [assignmentId]);

    const loadAssignment = async () => {
        try {
            setLoading(true);
            const data = await Assignments.get(assignmentId);
            setAssignment(data);

            // Check for previous submission
            const submissions = await Assignments.getMySubmissions(assignmentId);
            if (submissions && submissions.length > 0) {
                setCompleted(true);
                setSubmission(submissions[0]);
            }
        } catch (error) {
            console.error("Failed to load assignment:", error);
            toast({
                title: "Error",
                description: "Failed to load assignment details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!assignment) return;

        try {
            setSubmitting(true);

            let submissionUrl = "";
            if (file) {
                const uploadRes = await Uploads.upload(file);
                submissionUrl = uploadRes.url;
            }

            const newSubmission = await Assignments.submit(assignment.id, {
                submission_url: submissionUrl,
                text_submission: textSubmission,
                submission_type: assignment.submission_type
            });

            setCompleted(true);
            setSubmission(newSubmission);
            onComplete();
            toast({
                title: "Assignment Submitted",
                description: "Your assignment has been successfully submitted.",
            });

        } catch (error) {
            console.error("Failed to submit assignment:", error);
            toast({
                title: "Error",
                description: "Failed to submit assignment",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (completed && submission?.grade !== null && submission?.grade !== undefined) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-blue-100 bg-blue-50">
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-blue-900">Assignment Graded</h3>
                            <div className="mt-2 text-3xl font-bold text-blue-700">
                                {submission.grade} / 100
                            </div>
                            {submission.feedback && (
                                <div className="mt-4 p-4 bg-white rounded-md border border-blue-100 text-left">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Feedback:</p>
                                    <p className="text-gray-600">{submission.feedback}</p>
                                </div>
                            )}
                        </div>
                        <Button onClick={() => onComplete()} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100 mt-4">
                            Continue Learning
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-green-100 bg-green-50">
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-green-900">Assignment Submitted</h3>
                            <p className="text-green-700 mt-1">
                                Your submission has been received and is pending grade.
                            </p>
                        </div>
                        <Button onClick={() => onComplete()} variant="outline" className="border-green-200 text-green-700 hover:bg-green-100">
                            Continue Learning
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            {/* Left Column: Assignment Details */}
            <div className="md:col-span-2 space-y-6">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-medium text-gray-900">
                            {assignment?.item?.title || "Assignment"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pl-14">
                        <span>{assignment?.max_points || 100} points</span>
                        {assignment?.deadline && (
                            <>
                                <span>•</span>
                                <span className="font-medium text-gray-700">Due {new Date(assignment.deadline).toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                    {assignment?.assignment_url && (
                        <div className="mb-6 pl-14">
                            <a href={assignment.assignment_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Download className="w-4 h-4" />
                                    Download Assignment reference
                                </Button>
                            </a>
                        </div>
                    )}
                    <div className="border-t border-gray-200" />
                </div>

                <div className="pl-14">
                    <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: assignment?.item?.description || "<p>No instructions provided.</p>" }} />
                </div>
            </div>

            {/* Right Column: Your Work (Google Classroom Style) */}
            <div className="md:col-span-1">
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/50">
                        <CardTitle className="text-xl font-medium text-gray-800">Your Work</CardTitle>
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Assigned</span>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {!file && !textSubmission && (
                            <div className="text-center py-6">
                                <UploadCloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Add or create work</p>
                            </div>
                        )}

                        {/* File Upload Section */}
                        {(assignment?.submission_type === "FILE" || !assignment?.submission_type) && (
                            <div className="space-y-3">
                                <Label className="sr-only">Upload File</Label>
                                <div className={cn(
                                    "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                                    file ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                )}>
                                    <Input
                                        type="file"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                    />
                                    <Label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-2">
                                        {file ? (
                                            <>
                                                <FileText className="w-8 h-8 text-primary mb-2" />
                                                <span className="text-sm font-medium text-primary break-all px-2">{file.name}</span>
                                                <span className="text-xs text-muted-foreground mt-1">Click to change</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="bg-white border rounded-full px-4 py-2 text-sm font-medium text-primary shadow-sm mb-2">
                                                    + Add File
                                                </span>
                                                <p className="text-xs text-muted-foreground">Max size: {assignment?.max_file_size_mb || 10}MB</p>
                                            </>
                                        )}
                                    </Label>
                                </div>
                            </div>
                        )}

                        {/* Text Submission Section */}
                        {(assignment?.submission_type === "TEXT" || assignment?.submission_type === "CODE") && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Text Response</Label>
                                <Textarea
                                    placeholder="Type your answer here..."
                                    className="min-h-[150px] resize-none rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                                    value={textSubmission}
                                    onChange={(e) => setTextSubmission(e.target.value)}
                                />
                            </div>
                        )}

                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || (!file && !textSubmission)}
                            className="w-full h-11 rounded-lg text-md shadow-md"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Turn in"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
