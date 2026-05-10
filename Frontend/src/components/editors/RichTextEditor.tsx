import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Youtube as YoutubeIcon,
    Sparkles,
} from 'lucide-react';
import { AiContentGeneratorModal } from '@/components/common/AiContentGeneratorModal';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    content: string | object; // Allow JSON content
    onChange: (content: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [webGPUExists, setWebGPUExists] = useState(false);

    useEffect(() => {
        if ('gpu' in navigator) {
            setWebGPUExists(true);
        }
    }, []);


    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Youtube.configure({
                controls: true,
                nocookie: true,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 font-sans text-gray-700 leading-relaxed',
            },
        },
    });

    // Update editor content when content prop changes
    useEffect(() => {
        if (editor && content !== undefined) {
            const currentContent = editor.getHTML();
            // Prevent infinite loop by checking if content actually changed
            // However, comparing HTML strings vs JSON object is tricky.
            // Simplest is to just setContent if it's different.
            // But existing content prop might be clean or different format.
            // Let's rely on Tiptap's efficient update if possible, or just set it.
            // If we just set it, cursor position might be lost if typing.
            // But here we are fixing "stale content on open" or "reset".
            // The main issue is that initial `content` passed to useEditor is only used once.
            // If the parent updates `content` (like when data loads), we need to update editor.

            // We should check if editor is focused to avoid disrupting user typing if they are typing.
            // If the editor is focused, we assume the user is managing the state via typing.
            // We only want to force an update if the content prop changes externally (e.g. initial load, or reset),
            // NOT when the change originated from the editor's onChange event.

            if (!editor.isFocused) {
                // only update if content is different to avoid cursor jumps or internal reset
                // Tiptap's setContent handles parsing, but we want to avoid it if possible loop.
                // A simple way to break the loop for generic updates is checking focus.
                editor.commands.setContent(content);
            }
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    const addLink = () => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkUrl('');
            setLinkDialogOpen(false);
        }
    };

    const addImage = () => {
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl('');
            setImageDialogOpen(false);
        }
    };

    const addYoutube = () => {
        if (youtubeUrl) {
            editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
            setYoutubeUrl('');
            setYoutubeDialogOpen(false);
        }
    };

    const ToolbarButton = ({
        isActive = false,
        onClick,
        children,
        className
    }: {
        isActive?: boolean;
        onClick: () => void;
        children: React.ReactNode;
        className?: string;
    }) => (
        <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={onClick}
            className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                isActive
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                className
            )}
        >
            {children}
        </Button>
    );

    const Separator = () => (
        <div className="w-px h-5 bg-gray-200 mx-1" />
    );

    return (
        <Card className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
            {/* Toolbar */}
            <div className="border-b border-gray-100 bg-gray-50/50 p-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        isActive={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        isActive={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        isActive={editor.isActive('strike')}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        isActive={editor.isActive('code')}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    >
                        <Code className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        isActive={editor.isActive('heading', { level: 1 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        <Heading1 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        isActive={editor.isActive('heading', { level: 2 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        <Heading2 className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        isActive={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        isActive={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        isActive={editor.isActive('blockquote')}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                        <Quote className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => setLinkDialogOpen(true)}>
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => setImageDialogOpen(true)}>
                        <ImageIcon className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => setYoutubeDialogOpen(true)}>
                        <YoutubeIcon className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <Separator />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        className={!editor.can().undo() ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        <Undo className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        className={!editor.can().redo() ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        <Redo className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex-1" />

                {/* AI Assistant Button */}
                {webGPUExists ? (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAiModalOpen(true)}
                        className="h-8 gap-2 px-3 text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 rounded-full border border-purple-100 transition-all shadow-sm hover:shadow"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-medium">AI Agent</span>
                    </Button>
                ) : (
                    <div className="h-8 flex items-center px-3 text-xs text-gray-500 bg-gray-50 rounded-full border border-gray-100">
                        Use Chrome Browser to use AI Features
                    </div>
                )}
            </div>

            {/* Editor Content */}
            <div className="max-h-[600px] overflow-y-auto">
                <EditorContent editor={editor} className="min-h-[250px] bg-white text-base" />
            </div>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                onKeyDown={(e) => e.key === 'Enter' && addLink()}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkDialogOpen(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={addLink} className="rounded-xl">Insert Link</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Dialog */}
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Insert Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                onKeyDown={(e) => e.key === 'Enter' && addImage()}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImageDialogOpen(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={addImage} className="rounded-xl">Insert Image</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* YouTube Dialog */}
            <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Embed YouTube Video</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>YouTube URL</Label>
                            <Input
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                onKeyDown={(e) => e.key === 'Enter' && addYoutube()}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setYoutubeDialogOpen(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={addYoutube} className="rounded-xl">Embed Video</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Generator Modal */}
            <AiContentGeneratorModal
                open={aiModalOpen}
                onOpenChange={setAiModalOpen}
                onGenerate={(text) => editor.chain().focus().insertContent(text).run()}
            />
        </Card>
    );
}
