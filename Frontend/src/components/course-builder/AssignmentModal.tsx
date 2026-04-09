import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SectionItem } from '@/types/courseBuilder';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { Uploads } from '@/lib/api';

interface AssignmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: SectionItem;
    onSave: (itemId: string, updates: Partial<SectionItem>) => Promise<void>;
    onCreateAssignment: (itemId: string, data: any) => Promise<any>;
    onUpdateAssignment: (assignmentId: string, data: any) => Promise<any>;
}

export function AssignmentModal({
    open,
    onOpenChange,
    item,
    onSave,
    onCreateAssignment,
    onUpdateAssignment
}: AssignmentModalProps) {
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState(item.title);
    const [description, setDescription] = useState(item.description || '');

    // Assignment specific settings
    const [assignmentUrl, setAssignmentUrl] = useState('');
    const [uploadingAssignment, setUploadingAssignment] = useState(false);
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [maxFileSize, setMaxFileSize] = useState(10);
    const [allowedTypes, setAllowedTypes] = useState('pdf, docx, zip');
    const [submissionType, setSubmissionType] = useState('FILE'); // FILE, TEXT, CODE
    const [maxPoints, setMaxPoints] = useState(100);

    useEffect(() => {
        if (open) {
            setTitle(item.title);
            setDescription(item.description || '');

            // Load backend details if assignment exists
            if (item.assignment) {
                if (item.assignment.assignment_url) setAssignmentUrl(item.assignment.assignment_url);
                if (item.assignment.deadline) setDeadline(new Date(item.assignment.deadline));
                if (item.assignment.max_file_size_mb) setMaxFileSize(item.assignment.max_file_size_mb);

                if (item.assignment.allowed_file_types) {
                    const types = item.assignment.allowed_file_types as any;
                    if (typeof types === 'string') {
                        try {
                            const parsed = JSON.parse(types);
                            setAllowedTypes(Array.isArray(parsed) ? parsed.join(', ') : String(parsed));
                        } catch (e) {
                            setAllowedTypes(types);
                        }
                    } else if (Array.isArray(types)) {
                        setAllowedTypes(types.join(', '));
                    }
                }

                if (item.assignment.submission_type) setSubmissionType(item.assignment.submission_type);
            }
        }
    }, [open, item]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Save generic item details
            await onSave(item.id, {
                title,
                description,
            });

            // 2. Save assignment specific details
            const assignmentData = {
                deadline: deadline ? deadline.toISOString() : null,
                max_file_size_mb: maxFileSize,
                allowed_file_types: allowedTypes.split(',').map(t => t.trim()).filter(Boolean),
                submission_type: submissionType,
                assignment_url: assignmentUrl || null,
            };

            if (item.assignment?.id) {
                await onUpdateAssignment(item.assignment.id, assignmentData);
            } else {
                await onCreateAssignment(item.id, assignmentData);
            }

            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save assignment", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAssignment(true);
        try {
            const result = await Uploads.upload(file);
            if (result && result.url) {
                setAssignmentUrl(result.url);
            }
        } catch (error) {
            console.error("Failed to upload assignment file", error);
        } finally {
            setUploadingAssignment(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Assignment: {title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Instructions / Description</Label>
                        <RichTextEditor
                            content={description}
                            onChange={setDescription}
                            placeholder="Describe the assignment task..."
                        />
                    </div>

                    <div className="space-y-2 p-4 border rounded-lg bg-slate-50">
                        <Label>Assignment Reference File (Optional)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileUpload}
                                disabled={uploadingAssignment}
                                className="cursor-pointer"
                            />
                            {uploadingAssignment && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                        </div>
                        {assignmentUrl && (
                            <p className="text-sm text-green-600 font-medium">
                                File uploaded successfully: <a href={assignmentUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View File</a>
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Upload a PDF or document that students can download (e.g., assignment brief).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 flex flex-col">
                            <Label>Deadline</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !deadline && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[200]">
                                    <Calendar
                                        mode="single"
                                        selected={deadline}
                                        onSelect={setDeadline}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Submission Type</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={submissionType}
                                onChange={(e) => setSubmissionType(e.target.value)}
                            >
                                <option value="FILE">File Upload</option>
                                <option value="TEXT">Text / Link</option>
                                <option value="CODE">Code Snippet</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Max File Size (MB)</Label>
                            <Input
                                type="number"
                                value={maxFileSize}
                                onChange={(e) => setMaxFileSize(parseInt(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Allowed File Types</Label>
                            <Input
                                value={allowedTypes}
                                onChange={(e) => setAllowedTypes(e.target.value)}
                                placeholder="pdf, docx, zip"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Assignment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
