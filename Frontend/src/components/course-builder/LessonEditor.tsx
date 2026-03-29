import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { Video, FileText, Link as LinkIcon, Type, Clock, CheckCircle2, Eye, Save, X, UploadCloud, Loader2, BookOpen } from 'lucide-react';
import type { SectionItem, LectureContentType } from '@/types/courseBuilder';


interface LessonEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: SectionItem;
    onSave: (itemId: string, updates: Partial<SectionItem>) => Promise<void>;
    onSaveContent?: (itemId: string, content: any) => Promise<void>;
    loading?: boolean;
}

export function LessonEditor({
    open,
    onOpenChange,
    item,
    onSave,
    onSaveContent,
    loading
}: LessonEditorProps) {
    const [title, setTitle] = useState(item.title);
    const [duration, setDuration] = useState(item.duration_minutes?.toString() || '');
    const [isPreview, setIsPreview] = useState(item.is_preview || false);
    const [isMandatory, setIsMandatory] = useState(item.is_mandatory || false);

    // Content State
    // Content State - Track all independently
    const [textContent, setTextContent] = useState<string | object>('');
    const [videoUrl, setVideoUrl] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<string>(''); // 'uploading', 'processing', 'completed', 'error'

    useEffect(() => {
        if (open) {
            setTitle(item.title);
            setDuration(item.duration_minutes?.toString() || '');
            setIsPreview(item.is_preview || false);
            setIsMandatory(item.is_mandatory || false);
            setUploadProgress(0);
            setUploadStatus('');

            if (item.lecture_content) {
                const content = item.lecture_content;

                // Initialize all fields if they exist
                setVideoUrl(content.video_url || '');
                setAttachmentUrl(content.file_url || '');
                setPdfUrl(content.pdf_url || '');

                if (content.text_content) {
                    if (typeof content.text_content === 'object') {
                        setTextContent(content.text_content);
                    } else if (typeof content.text_content === 'string') {
                        try {
                            const parsed = JSON.parse(content.text_content);
                            if (typeof parsed === 'object' && parsed !== null) setTextContent(parsed);
                            else if (typeof parsed === 'string') setTextContent(parsed);
                            else setTextContent(content.text_content);
                        } catch (e) {
                            setTextContent(content.text_content);
                        }
                    }
                } else {
                    setTextContent('');
                }
            } else {
                setTextContent('');
                setVideoUrl('');
                setAttachmentUrl('');
                setPdfUrl(''); // Also clear PDF URL
            }
        }
    }, [open, item]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'VIDEO' | 'FILE' | 'PDF') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus('uploading');

        try {
            const { Uploads } = await import('@/lib/api');
            
            const response = await Uploads.upload(file, (progress) => {
                setUploadProgress(progress);
            });

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const url = response.url.startsWith('http') ? response.url : `${API_URL}${response.url}`;

            if (type === 'VIDEO') {
                setVideoUrl(url);
            } else if (type === 'PDF') {
                setPdfUrl(url);
            } else {
                setAttachmentUrl(url);
            }
            
            setUploadStatus('completed');
            setIsUploading(false);
            
        } catch (error) {
            console.error(error);
            setUploadStatus('error');
            setIsUploading(false);
            // toast.error('Upload failed');
        }
    };

    const handleSave = async () => {
        await onSave(item.id, {
            title,
            duration_minutes: parseInt(duration) || 0,
            is_preview: isPreview,
            is_mandatory: isMandatory,
        });

        if (onSaveContent && item.type === 'LECTURE') {
            await onSaveContent(item.id, {
                // We send 'MIXED' or just default 'TEXT' as primary, but backend should store all fields
                type: 'TEXT',
                content: JSON.stringify(textContent), // This is just for the 'content' param, but we need to send ALL data
                // The onSaveContent signature in props is: (itemId: string, content: { type: LectureContentType; content: string })
                // This signature is too limiting! It only accepts type and content string.
                // WE NEED TO UPDATE THE onSaveContent SIGNATURE in the interface AND the `handleSaveItemContent` in `useCourseBuilder`.

                // However, I can overload the `content` encoded string or pass an object if I change the type.
                // Let's modify the `onSaveContent` prop type in this file first to accept `any`.
            } as any);

            // Wait, I need to pass the full object.
            // The parent `CurriculumBuilder` calls `handleSaveItemContent`.
            // `handleSaveItemContent` calls `LectureContent.update`.
            // `LectureContent.update` accepts `any`.
            // So if I pass `{ text_content: ..., video_url: ..., file_url: ... }` it should work if I bypass the strict prop type.
        }

        onOpenChange(false);
    };

    // Custom wrapper to pass full data
    const handleSaveFull = async () => {
        await onSave(item.id, {
            title,
            duration_minutes: parseInt(duration) || 0,
            is_preview: isPreview,
            is_mandatory: isMandatory,
        });

        if (onSaveContent && item.type === 'LECTURE') {
            // Pass all data. The `content` arg in `onSaveContent` is passed to `handleSaveItemContent`.
            // logic: await handleSaveItemContent(id, content); 
            // We will pass the FULL Payload as the second argument.
            await onSaveContent(item.id, {
                text_content: typeof textContent === 'string' ? textContent : JSON.stringify(textContent),
                video_url: videoUrl,
                file_url: attachmentUrl,
                pdf_url: pdfUrl,
                content_type: 'TEXT' // Default, or maybe 'MIXED' if permitted
            } as any);
        }
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-xl">Edit Lesson: {item.title}</DialogTitle>
                    <DialogDescription>
                        Add content, video, and attachments to your lesson.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-2">
                            <Label htmlFor="title">Lesson Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="preview" checked={isPreview} onCheckedChange={setIsPreview} />
                            <Label htmlFor="preview" className="flex items-center gap-1 cursor-pointer">
                                <Eye className="w-4 h-4" /> Free Preview
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="mandatory" checked={isMandatory} onCheckedChange={setIsMandatory} />
                            <Label htmlFor="mandatory" className="flex items-center gap-1 cursor-pointer">
                                <CheckCircle2 className="w-4 h-4" /> Mandatory
                            </Label>
                        </div>
                    </div>

                    {/* Content Sections */}
                    {item.type === 'LECTURE' && (
                        <div className="space-y-8">

                            {/* Rich Text Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <Type className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">Lecture Content</h3>
                                </div>
                                <RichTextEditor
                                    content={textContent}
                                    onChange={setTextContent}
                                    placeholder="Write your lesson content here..."
                                />
                            </div>

                            {/* Video Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <Video className="h-5 w-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Video Resource</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Video URL (YouTube/Vimeo)</Label>
                                        <Input
                                            placeholder="https://..."
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Or Upload Video</Label>
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                accept="video/*"
                                                className="pl-10 pt-2"
                                                onChange={(e) => handleFileUpload(e, 'VIDEO')}
                                                disabled={isUploading}
                                            />
                                            {isUploading && uploadStatus !== 'completed' && uploadStatus !== 'error' ? (
                                                <Loader2 className="absolute left-3 top-3 h-4 w-4 text-blue-500 animate-spin" />
                                            ) : (
                                                <UploadCloud className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isUploading && (
                                    <div className={`space-y-1 p-4 rounded-lg border ${uploadStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex justify-between text-sm">
                                            <span className={`font-medium ${uploadStatus === 'error' ? 'text-red-700' : 'text-slate-700'}`}>
                                                {uploadStatus === 'uploading' ? 'Uploading to Microservice...' :
                                                    uploadStatus === 'processing' ? 'Compressing & Optimizing...' :
                                                        uploadStatus === 'error' ? 'Upload Failed' : 'Finalizing...'}
                                            </span>
                                            <span className="text-slate-500">{uploadStatus === 'uploading' ? `${uploadProgress}%` : ''}</span>
                                        </div>
                                        {uploadStatus !== 'error' && (
                                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${uploadStatus === 'processing' ? 'bg-purple-500 animate-pulse w-full' : 'bg-blue-500'}`}
                                                    style={{ width: uploadStatus === 'processing' ? '100%' : `${uploadProgress}%` }}
                                                />
                                            </div>
                                        )}
                                        <p className={`text-xs ${uploadStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                                            {uploadStatus === 'processing'
                                                ? "Video is being compressed in the background. This may take a moment."
                                                : uploadStatus === 'error'
                                                    ? "There was an error uploading or processing the video. Please try again."
                                                    : "Please keep this window open."}
                                        </p>
                                    </div>
                                )}

                                {videoUrl && !isUploading && (
                                    <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-600 break-all border border-blue-100">
                                        <Video className="h-4 w-4 shrink-0" />
                                        {videoUrl}
                                    </div>
                                )}
                            </div>

                            {/* PDF Flipbook Source Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <BookOpen className="h-5 w-5 text-red-600" />
                                    <h3 className="font-semibold text-gray-900">Upload PDF Source (Flipbook)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Upload PDF for Flipbook Viewer</Label>
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                accept="application/pdf"
                                                className="pl-10 pt-2"
                                                onChange={(e) => handleFileUpload(e, 'PDF')}
                                                disabled={isUploading}
                                            />
                                            <UploadCloud className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Or Paste PDF URL</Label>
                                        <Input
                                            placeholder="https://..."
                                            value={pdfUrl}
                                            onChange={(e) => setPdfUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {pdfUrl && (
                                    <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2 text-sm text-red-600 break-all">
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {pdfUrl}
                                        </a>
                                    </div>
                                )}
                            </div>



                            {/* Attachments Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <LinkIcon className="h-5 w-5 text-orange-600" />
                                    <h3 className="font-semibold text-gray-900">Downloadable Material</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Upload File (PDF, Zip, etc.)</Label>
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                className="pl-10 pt-2"
                                                onChange={(e) => handleFileUpload(e, 'FILE')}
                                                disabled={isUploading}
                                            />
                                            <UploadCloud className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                {attachmentUrl && (
                                    <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2 text-sm text-orange-600 break-all">
                                        <LinkIcon className="h-4 w-4 shrink-0" />
                                        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {attachmentUrl}
                                        </a>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveFull} disabled={loading || isUploading}>
                        {loading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
