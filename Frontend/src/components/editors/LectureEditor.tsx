import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';
import { VideoUpload, DocumentUpload } from './FileUpload';
import { Video, FileText, Link as LinkIcon, Type } from 'lucide-react';
import type { LectureContentType } from '@/types/courseBuilder';


interface LectureEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemTitle: string;
    initialContent?: {
        type: LectureContentType;
        content: string;
    };
    onSave: (content: { type: LectureContentType; content: string }) => Promise<void>;
    saving?: boolean;
}

export function LectureEditor({
    open,
    onOpenChange,
    itemTitle,
    initialContent,
    onSave,
    saving,
}: LectureEditorProps) {
    const [contentType, setContentType] = useState<LectureContentType>(
        initialContent?.type || 'TEXT'
    );
    const [textContent, setTextContent] = useState(
        initialContent?.type === 'TEXT' ? initialContent.content : ''
    );
    const [videoUrl, setVideoUrl] = useState(
        initialContent?.type === 'VIDEO' ? initialContent.content : ''
    );
    const [fileUrl, setFileUrl] = useState(
        initialContent?.type === 'FILE' ? initialContent.content : ''
    );
    const [linkUrl, setLinkUrl] = useState(
        initialContent?.type === 'LINK' ? initialContent.content : ''
    );

    const handleSave = async () => {
        let content = '';

        switch (contentType) {
            case 'TEXT':
                content = textContent;
                break;
            case 'VIDEO':
                content = videoUrl;
                break;
            case 'FILE':
                content = fileUrl;
                break;
            case 'LINK':
                content = linkUrl;
                break;
        }

        await onSave({ type: contentType, content });
        onOpenChange(false);
    };

    const handleVideoUpload = async (files: File[]) => {
        try {
            const { Uploads } = await import('@/lib/api');
            // Assuming Uploads.upload now takes an onProgress callback if you want to use it
            const response = await Uploads.upload(files[0]);

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const url = response.url.startsWith('http') ? response.url : `${API_URL}${response.url}`;
            
            return [url];
        } catch (error) {
            console.error('Video upload failed', error);
            throw error;
        }
    };

    const handleFileUpload = async (files: File[]) => {
        // In production, upload to cloud storage
        return [URL.createObjectURL(files[0])];
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Lecture Content</DialogTitle>
                    <DialogDescription>{itemTitle}</DialogDescription>
                </DialogHeader>

                <Tabs value={contentType} onValueChange={(v) => setContentType(v as LectureContentType)}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="TEXT">
                            <Type className="h-4 w-4 mr-2" />
                            Text
                        </TabsTrigger>
                        <TabsTrigger value="VIDEO">
                            <Video className="h-4 w-4 mr-2" />
                            Video
                        </TabsTrigger>
                        <TabsTrigger value="FILE">
                            <FileText className="h-4 w-4 mr-2" />
                            File
                        </TabsTrigger>
                        <TabsTrigger value="LINK">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Link
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="TEXT" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Lecture Content (Rich Text)</Label>
                            <RichTextEditor
                                content={textContent}
                                onChange={setTextContent}
                                placeholder="Write your lecture content here..."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="VIDEO" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Video URL or Upload</Label>
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=... or upload below"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Or Upload Video</Label>
                                <VideoUpload
                                    onUpload={handleVideoUpload}
                                    maxSize={500 * 1024 * 1024} // 500MB
                                    onChange={(url) => typeof url === 'string' && setVideoUrl(url)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="FILE" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>File URL or Upload</Label>
                                <Input
                                    value={fileUrl}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                    placeholder="https://example.com/file.pdf or upload below"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Or Upload File (PDF, PPT, ZIP, etc.)</Label>
                                <DocumentUpload
                                    onUpload={handleFileUpload}
                                    maxSize={100 * 1024 * 1024} // 100MB
                                    onChange={(url) => typeof url === 'string' && setFileUrl(url)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="LINK" className="space-y-4">
                        <div className="space-y-2">
                            <Label>External Link URL</Label>
                            <Input
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com/resource"
                            />
                            <p className="text-sm text-muted-foreground">
                                Link to external resources, documentation, or websites
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Lecture'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
