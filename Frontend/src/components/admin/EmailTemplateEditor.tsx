import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Save, FileCode2 } from "lucide-react";
import { EmailTemplates } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface EmailTemplateEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateType: string;
    onSaved: () => void;
    initialData: { subject: string; body: string } | null;
}

export function EmailTemplateEditor({ open, onOpenChange, templateType, onSaved, initialData }: EmailTemplateEditorProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    // Default template fallbacks
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
        WELCOME: {
            subject: "Welcome to <%= brandName %>!",
            body: `<h2>Hello <%= name %>,</h2>\n<p>Welcome to <strong><%= brandName %></strong>! We are thrilled to have you join our learning community.</p>\n<p>You can now browse our catalog and start enrolling in courses designed to help you succeed.</p>\n<p>If you have any questions, feel free to reply directly to this email.</p>\n<a href="#" class="button">Explore Courses</a>\n<p>Best regards,<br>The <%= brandName %> Team</p>`
        },
        ADMIN_ADDED_USER: {
            subject: "Your Account Details for <%= brandName %>",
            body: `<h2>Hello <%= name %>,</h2>\n<p>An administrator has created an account for you on <strong><%= brandName %></strong>.</p>\n<p>Here are your login details:</p>\n<ul>\n  <li><strong>Email:</strong> <%= email %></li>\n  <li><strong>Temporary Password:</strong> <%= password %></li>\n</ul>\n<p>Please log in using the button below and change your password immediately.</p>\n<a href="<%= loginUrl %>" class="button">Log In Now</a>\n<p>If you have any questions, feel free to reply directly to this email.</p>\n<p>Best regards,<br>The <%= brandName %> Team</p>`
        },
        ENROLLMENT: {
            subject: "You're enrolled in: <%= courseTitle %>",
            body: `<h2>Hello <%= name %>,</h2>\n<p>Great news! You have successfully enrolled in <strong><%= courseTitle %></strong>.</p>\n<p>You can start learning right away by logging into your dashboard and accessing the course materials.</p>\n<p>We're excited to see what you achieve!</p>\n<a href="#" class="button">Go to Course</a>\n<p>Best regards,<br>The <%= brandName %> Team</p>`
        },
        PURCHASE_USER: {
            subject: "Purchase Confirmation: <%= courseTitle %>",
            body: `<h2>Hello <%= name %>,</h2>\n<p>Thank you for your purchase!</p>\n<p>We have successfully processed your payment for:</p>\n<ul>\n  <li><strong>Course:</strong> <%= courseTitle %></li>\n  <li><strong>Amount Paid:</strong> <%= amount %></li>\n</ul>\n<p>You have automatically been enrolled in the course and can start learning immediately.</p>\n<a href="#" class="button">Access Course</a>\n<p>If you have any questions about this purchase, please reply to this email.</p>\n<p>Best regards,<br>The <%= brandName %> Team</p>`
        },
        PASSWORD_RESET: {
            subject: "Password Reset Request - <%= brandName %>",
            body: `<h2>Hello <%= name %>,</h2>\n<p>We received a request to reset your password for your <strong><%= brandName %></strong> account.</p>\n<p>Click the button below to set a new password. This link will expire in 1 hour.</p>\n<a href="<%= resetLink %>" class="button">Reset Password</a>\n<p>If you did not request a password reset, you can safely ignore this email.</p>\n<p>Best regards,<br>The <%= brandName %> Team</p>`
        },
        CERTIFICATE: {
            subject: "Your Certificate is Ready: <%= courseTitle %>",
            body: `<h2>Hello <%= name %>,</h2>\n<p>Congratulations! You have successfully completed <strong><%= courseTitle %></strong>.</p>\n<p>Your certificate of completion is now available.</p>\n<p>You can view and download your certificate by clicking the button below:</p>\n<br>\n<a href="<%= certificateUrl %>" class="button">View Certificate</a>\n<p>We are very proud of your achievement!</p>\n<p>Best regards,<br>The <%= brandName %> Team</p>`
        }
    };

    useEffect(() => {
        if (open) {
            const defaultData = DEFAULT_TEMPLATES[templateType] || { subject: "Your Template Subject", body: "<h2>Hello <%= name %>,</h2>\n<p>Start customizing your email here...</p>" };
            setSubject(initialData?.subject || defaultData.subject);
            setBody(initialData?.body || defaultData.body);
        }
    }, [open, initialData, templateType]);

    const handleSave = async () => {
        if (!subject || !body) {
            toast({ title: "Validation Error", description: "Subject and Body are required.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await EmailTemplates.update(templateType, { subject, body });
            toast({ title: "Template Saved", description: "Your custom email template has been saved successfully." });
            onSaved();
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Failed to save", description: "An error occurred while saving the template.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCode2 className="h-5 w-5 text-primary" />
                        Edit Template: {templateType.replace(/_/g, ' ')}
                    </DialogTitle>
                    <DialogDescription>
                        Customize the subject and HTML/EJS body for this email template.
                        The Header and Footer (including logo & color) are appended automatically!
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Subject</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g., Welcome to <%= brandName %>!"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>HTML Body</Label>
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="min-h-[300px] font-mono text-sm"
                                placeholder="Write html code here..."
                            />
                        </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg text-sm">
                        <h4 className="font-semibold mb-2">Available Variables (Cheat sheet)</h4>
                        <ul className="grid grid-cols-2 gap-2 text-muted-foreground w-full">
                            <li><code>&lt;%= name %&gt;</code> - User's name</li>
                            <li><code>&lt;%= email %&gt;</code> - User's email</li>
                            <li><code>&lt;%= brandName %&gt;</code> - LMS Name</li>
                            <li><code>&lt;%= supportEmail %&gt;</code> - Support Email</li>
                            <li className="col-span-2 mt-2 pt-2 border-t border-border/50 text-xs">
                                Note: Additional variables exist depending on the template (e.g., <code>&lt;%= courseTitle %&gt;</code>, <code>&lt;%= resetLink %&gt;</code>, <code>&lt;%= amount %&gt;</code>).
                            </li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
