import type { HelpSection, FAQ, TroubleshootingCategory } from "@/types/help";

// ============================================
// HELP SECTIONS — All 10 modules
// ============================================

export const helpSections: HelpSection[] = [
  // ── 1. Getting Started ──────────────────────────
  {
    id: "getting-started",
    title: "Getting Started",
    description:
      "Portal overview, authentication, dashboard navigation, and role-based access system.",
    icon: "Rocket",
    features: [
      "Portal overview and login",
      "Dashboard navigation",
      "Role-based access system (Admin, Instructor, Student, Franchise Manager)",
      "Admin workflow overview",
      "Student workflow overview",
      "Instructor workflow overview",
    ],
    workflow: [
      { step: 1, title: "Open LMS Portal", description: "Navigate to your organization's LMS URL in any modern browser." },
      { step: 2, title: "Enter Credentials", description: "Input your registered email and password on the login page." },
      { step: 3, title: "Click Login", description: "Press the Login button to authenticate. You will be redirected based on your role." },
      { step: 4, title: "Access Dashboard", description: "You will land on your role-specific dashboard — Admin, Instructor, or Student." },
    ],
    articles: [
      {
        id: "gs-dashboard",
        title: "Dashboard Overview",
        content:
          "The dashboard is your central hub. It provides quick access to all platform features through a well-organized layout.",
        tips: [
          "Use the Sidebar Navigation to switch between modules like Courses, Users, and Analytics.",
          "Analytics Cards at the top show key metrics — total users, revenue, active courses.",
          "User Management Access is available directly from the sidebar under the 'Users' section.",
          "Course Management Access lets you create, edit, approve, and publish courses.",
          "The Communication Panel handles notifications, announcements, and email broadcasts.",
          "Settings provide platform-level configuration including branding, payments, and SEO.",
        ],
      },
      {
        id: "gs-roles",
        title: "Understanding User Roles",
        content:
          "AI-Shiksha uses Role-Based Access Control (RBAC). Each role has specific permissions and dashboard views.",
        tips: [
          "Admin — Full platform control: manage users, approve courses, configure settings, view analytics.",
          "Instructor — Create and manage courses, view enrolled students, track revenue, respond to Q&A.",
          "Student — Browse courses, enroll, track progress, earn certificates, use AI assistant.",
          "Franchise Manager — Manage a specific franchise instance including its branding and users.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Login failed", solution: "Verify your email and password. If forgotten, use the 'Forgot Password' link on the login page." },
      { issue: "Session expired", solution: "For security, sessions expire after a period of inactivity. Simply log in again to resume." },
      { issue: "Dashboard not loading", solution: "Clear your browser cache and cookies, then reload. Ensure JavaScript is enabled." },
    ],
  },

  // ── 2. Franchise Setup ──────────────────────────
  {
    id: "franchise-setup",
    title: "Franchise Setup",
    description:
      "Manage franchise creation, configuration, branding, and permission assignment.",
    icon: "Building2",
    features: [
      "Create franchise",
      "Configure franchise details",
      "Assign users to franchise",
      "Manage branding (logo, colors, name)",
      "Configure permissions",
    ],
    workflow: [
      { step: 1, title: "Open Franchise Setup", description: "Navigate to 'Franchises' or 'Institutions' from the admin sidebar." },
      { step: 2, title: "Add Franchise Information", description: "Fill in the franchise name, domain, support email, and description." },
      { step: 3, title: "Configure Settings", description: "Set primary color, upload logo and favicon, configure SEO settings." },
      { step: 4, title: "Save Changes", description: "Click Save to persist all franchise configuration." },
      { step: 5, title: "Assign Managers/Users", description: "Assign a Franchise Admin and add users to the franchise." },
    ],
    articles: [
      {
        id: "fs-required",
        title: "Required Fields & Best Practices",
        content: "When creating a franchise, certain fields are mandatory to ensure proper operation.",
        tips: [
          "Franchise name and domain are required fields — domain must be unique across the platform.",
          "Use descriptive, professional franchise names — avoid abbreviations or internal codes.",
          "Always verify the domain before going live to avoid DNS-related issues.",
          "Assign at least one Franchise Admin immediately after creation.",
          "Upload a logo in PNG or SVG format for best quality across devices.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Permission issues after setup", solution: "Ensure the assigned Franchise Admin has the correct role. Re-assign the role from User Management." },
      { issue: "Domain not verified", solution: "Check your DNS records and ensure the CNAME/A record points to the correct server." },
      { issue: "Branding not updating", solution: "Clear browser cache after saving changes. Logo changes may take a few minutes to propagate." },
    ],
  },

  // ── 3. Basic Website Setup ──────────────────────
  {
    id: "website-setup",
    title: "Basic Website Setup",
    description:
      "Configure LMS website-level settings including branding, theme, SEO, and contact information.",
    icon: "Globe",
    features: [
      "Website branding",
      "Logo upload",
      "Theme customization",
      "Contact information",
      "Homepage setup",
      "SEO & basic configuration",
    ],
    workflow: [
      { step: 1, title: "Open Website Setup", description: "Navigate to 'Platform Settings' from the admin sidebar." },
      { step: 2, title: "Upload Branding Assets", description: "Upload your logo, favicon, and configure primary brand color." },
      { step: 3, title: "Configure Company Details", description: "Enter your organization name, contact email, phone, and address." },
      { step: 4, title: "Save Settings", description: "Click Save to apply all branding and configuration changes." },
      { step: 5, title: "Preview Changes", description: "Open the public-facing site in a new tab to verify your changes." },
    ],
    articles: [
      {
        id: "ws-seo",
        title: "SEO Configuration",
        content: "Proper SEO setup ensures your LMS is discoverable by search engines and appears professional in social media shares.",
        tips: [
          "Set a descriptive meta title (under 60 characters) that includes your brand name.",
          "Write a compelling meta description (under 160 characters) summarizing your platform.",
          "Upload an Open Graph image (1200×630px) for rich social media previews.",
          "Enable sitemap generation and robots.txt for search engine crawling.",
          "Use canonical tags to prevent duplicate content issues.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Logo upload failed", solution: "Ensure the image is under 2MB and in PNG, JPG, or SVG format." },
      { issue: "Invalid image size", solution: "Recommended logo dimensions: 200×60px minimum. Favicon: 32×32px or 64×64px." },
      { issue: "Theme not updating", solution: "Hard-refresh the browser (Ctrl+Shift+R). Theme changes apply immediately but may be cached." },
    ],
  },

  // ── 4. User Management ──────────────────────────
  {
    id: "user-management",
    title: "User Management",
    description:
      "Manage platform users, assign roles, control permissions, and handle account lifecycle.",
    icon: "Users",
    features: [
      "Add users",
      "Edit user profiles",
      "Delete / deactivate users",
      "Assign roles (Admin, Instructor, Student, Franchise Manager)",
      "Activate / deactivate accounts",
      "Manage permissions",
    ],
    workflow: [
      { step: 1, title: "Open User Management", description: "Navigate to 'Users' from the admin sidebar." },
      { step: 2, title: "Click Add User", description: "Use the 'Add User' button to open the user creation form." },
      { step: 3, title: "Enter User Details", description: "Fill in name, email, and optional fields like bio and avatar." },
      { step: 4, title: "Assign Role", description: "Select the appropriate role: Admin, Instructor, Student, or Franchise Manager." },
      { step: 5, title: "Save User", description: "Click Save. The user will receive a welcome email with login credentials." },
    ],
    articles: [
      {
        id: "um-roles",
        title: "User Roles Explained",
        content: "Each role provides different levels of access and functionality within the platform.",
        tips: [
          "Admin — Full access to platform settings, user management, course approval, and analytics.",
          "Instructor — Can create courses, manage content, view enrolled students, and track earnings.",
          "Student — Can browse courses, enroll, track progress, complete quizzes, and earn certificates.",
          "Franchise Manager — Can manage users and settings within their specific franchise scope.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Duplicate email issue", solution: "Each email must be unique within a franchise. Check if the user already exists under a different role." },
      { issue: "Permission denied", solution: "Verify the user's assigned role has the necessary permissions for the action they are attempting." },
      { issue: "User unable to login", solution: "Check if the account is active. Reset the password via User Management if needed." },
    ],
  },

  // ── 5. Course Management ────────────────────────
  {
    id: "course-management",
    title: "Course Management",
    description:
      "Create, edit, publish, and manage courses including modules, lessons, quizzes, and resources.",
    icon: "BookOpen",
    features: [
      "Create and edit courses",
      "Add sections and modules",
      "Upload video lessons and resources",
      "Configure quizzes and assignments",
      "Publish / unpublish courses",
      "Set pricing and discounts",
    ],
    workflow: [
      { step: 1, title: "Open Course Management", description: "Navigate to 'Courses' from the admin or instructor sidebar." },
      { step: 2, title: "Create New Course", description: "Click 'Create Course' and fill in the title, description, and category." },
      { step: 3, title: "Add Sections & Lessons", description: "Use the Course Builder to add sections, then add lectures, videos, and text content." },
      { step: 4, title: "Upload Resources", description: "Attach PDFs, documents, or downloadable files to relevant lessons." },
      { step: 5, title: "Configure Settings", description: "Set pricing, access controls, certificate settings, and SEO metadata." },
      { step: 6, title: "Publish Course", description: "Submit for approval (Instructor) or directly publish (Admin)." },
    ],
    articles: [
      {
        id: "cm-categories",
        title: "Course Categories & Enrollment",
        content: "Categories help students discover courses, and enrollment controls who can access your content.",
        tips: [
          "Assign each course to a relevant category for better discoverability.",
          "Enable 'Preview' on introductory lessons to attract prospective students.",
          "Set enrollment limits if you want to cap class sizes.",
          "Use drip content to release modules on a schedule.",
          "Track student progress from the course analytics dashboard.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Video upload failed", solution: "Check file size (max 500MB) and format (MP4, WebM recommended). Ensure stable internet connection." },
      { issue: "Course not visible to students", solution: "Verify the course status is 'Published' and not set to private. Check category assignment." },
      { issue: "Resource attachment issues", solution: "Supported formats: PDF, DOCX, ZIP, PPT. Maximum file size is 10MB per attachment." },
    ],
  },

  // ── 6. Razorpay Setup ──────────────────────────
  {
    id: "razorpay-setup",
    title: "Razorpay Setup",
    description:
      "Configure payment gateway integration for course purchases and enrollment fees.",
    icon: "CreditCard",
    features: [
      "Razorpay API key setup",
      "Payment configuration",
      "Test / live mode toggle",
      "Transaction tracking",
      "Payment verification",
    ],
    workflow: [
      { step: 1, title: "Open Razorpay Setup", description: "Navigate to 'Payments → Razorpay' from the admin sidebar." },
      { step: 2, title: "Add API Keys", description: "Enter your Razorpay Key ID and Key Secret from the Razorpay dashboard." },
      { step: 3, title: "Configure Environment", description: "Select Test mode for development or Live mode for production payments." },
      { step: 4, title: "Save Settings", description: "Click Save to persist your payment gateway configuration." },
      { step: 5, title: "Test Payment Flow", description: "Create a test purchase to verify the end-to-end payment flow works correctly." },
    ],
    articles: [
      {
        id: "rp-keys",
        title: "Getting Your Razorpay Keys",
        content: "You need API keys from Razorpay to enable payment processing.",
        tips: [
          "Log into your Razorpay Dashboard at dashboard.razorpay.com.",
          "Navigate to Settings → API Keys → Generate Key.",
          "Copy both the Key ID (starts with 'rzp_test_' or 'rzp_live_') and Key Secret.",
          "Never share your Key Secret publicly or commit it to version control.",
          "Use test keys during development; switch to live keys only for production.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Invalid API key", solution: "Double-check that you copied the full Key ID and Secret. Ensure there are no trailing spaces." },
      { issue: "Payment failed", solution: "Verify the currency setting matches your Razorpay account configuration (INR/USD)." },
      { issue: "Webhook issues", solution: "Ensure the webhook URL is publicly accessible and the webhook secret matches your Razorpay dashboard settings." },
      { issue: "Currency mismatch", solution: "Set the correct currency in Razorpay Settings. The platform and Razorpay must use the same currency." },
    ],
  },

  // ── 7. Communication ───────────────────────────
  {
    id: "communication",
    title: "Communication",
    description:
      "Handle notifications, email broadcasts, student announcements, and messaging workflows.",
    icon: "MessageSquare",
    features: [
      "Push notifications",
      "Email communication",
      "Student announcements",
      "Instructor communication",
      "Broadcast messaging",
    ],
    workflow: [
      { step: 1, title: "Open Communication Module", description: "Navigate to 'Announcements' or 'Messages' from the admin sidebar." },
      { step: 2, title: "Select Audience", description: "Choose the target group: all users, specific roles, or individual users." },
      { step: 3, title: "Compose Message", description: "Write your announcement or notification with optional rich text formatting." },
      { step: 4, title: "Send Notification", description: "Click Send to broadcast the message to the selected audience." },
    ],
    articles: [
      {
        id: "comm-best",
        title: "Communication Best Practices",
        content: "Effective communication keeps students engaged and informed about platform updates.",
        tips: [
          "Use clear, concise subject lines for email announcements.",
          "Schedule announcements for optimal engagement times.",
          "Segment your audience — don't send instructor-specific updates to students.",
          "Use the preview feature before sending to check formatting.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Emails not sending", solution: "Verify SMTP / email service configuration in Platform Settings. Check email service API keys." },
      { issue: "Notification delays", solution: "Notifications are processed asynchronously. Brief delays are normal under high load." },
      { issue: "Wrong recipient group", solution: "Double-check the audience selection before sending. Use the preview to verify recipients." },
    ],
  },

  // ── 8. AI Features ─────────────────────────────
  {
    id: "ai-features",
    title: "AI Features",
    description:
      "AI-powered content generation, smart assistance, recommendations, and workflow automation.",
    icon: "Brain",
    features: [
      "AI content generation",
      "AI-powered student assistant",
      "Smart automation tools",
      "AI-based recommendations",
      "AI workflow enhancements",
    ],
    workflow: [
      { step: 1, title: "Open AI Control", description: "Navigate to 'AI Control' from the admin sidebar." },
      { step: 2, title: "Configure API Keys", description: "Enter your OpenAI or Gemini API key in the configuration panel." },
      { step: 3, title: "Toggle AI Features", description: "Enable or disable AI features globally or per-franchise." },
      { step: 4, title: "Customize AI Behavior", description: "Adjust system prompts and AI tutor settings to match your educational goals." },
    ],
    articles: [
      {
        id: "ai-usage",
        title: "How AI Features Work",
        content: "The platform integrates AI capabilities to enhance both teaching and learning experiences.",
        tips: [
          "AI can help instructors generate course outlines, quiz questions, and lesson summaries.",
          "Students can use the AI Assistant to ask questions about course material.",
          "AI recommendations suggest relevant courses based on student behavior and preferences.",
          "Always review AI-generated content before publishing — it serves as a starting point, not a final product.",
          "Monitor API usage to manage costs effectively.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "AI response failed", solution: "Check that your API key is valid and has sufficient credits. Verify network connectivity." },
      { issue: "Timeout issue", solution: "Long prompts may cause timeouts. Try breaking down complex requests into shorter ones." },
      { issue: "Invalid prompt issue", solution: "Ensure prompts are clear and specific. Avoid overly long or ambiguous instructions." },
    ],
  },

  // ── 9. Maintenance Mode ────────────────────────
  {
    id: "maintenance-mode",
    title: "Maintenance Mode",
    description:
      "Control portal maintenance state, restrict access, and display maintenance messaging.",
    icon: "Wrench",
    features: [
      "Enable maintenance mode",
      "Disable maintenance mode",
      "Custom maintenance messaging",
      "Access restrictions for non-admin users",
    ],
    workflow: [
      { step: 1, title: "Open Maintenance Mode", description: "Navigate to 'Platform Settings' from the admin sidebar." },
      { step: 2, title: "Toggle Maintenance Status", description: "Switch the Maintenance Mode toggle ON to activate." },
      { step: 3, title: "Add Maintenance Message", description: "Enter a custom message explaining the downtime and expected return time." },
      { step: 4, title: "Save Changes", description: "Click Save. All non-admin users will see the maintenance page immediately." },
    ],
    articles: [
      {
        id: "mm-access",
        title: "Who Can Bypass Maintenance Mode",
        content: "Admin users retain full access during maintenance to perform necessary updates.",
        tips: [
          "Admins, Super Admins, and Franchise Admins can bypass maintenance mode automatically.",
          "Students and Instructors will see a maintenance page and cannot access any features.",
          "Always provide an estimated return time in your maintenance message.",
          "Test critical features before disabling maintenance mode.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Users still accessing portal", solution: "Ensure maintenance mode is saved and enabled. Clear CDN cache if using one." },
      { issue: "Maintenance page not visible", solution: "Hard-refresh the browser (Ctrl+Shift+R). Check that the setting was saved successfully." },
    ],
  },

  // ── 10. Analytics Setup ────────────────────────
  {
    id: "analytics-setup",
    title: "Analytics Setup",
    description:
      "Configure dashboard analytics, reporting, user metrics, course analytics, and revenue tracking.",
    icon: "BarChart3",
    features: [
      "Dashboard analytics overview",
      "Reporting setup and export",
      "User analytics and engagement",
      "Course analytics and completion rates",
      "Revenue tracking",
      "Engagement metrics",
    ],
    workflow: [
      { step: 1, title: "Open Analytics Setup", description: "Navigate to 'Analytics' from the admin sidebar." },
      { step: 2, title: "Configure Analytics Settings", description: "Select which metrics and data sources to display on your dashboard." },
      { step: 3, title: "Select Metrics", description: "Choose from total users, active students, revenue, completion rates, and more." },
      { step: 4, title: "Save Configuration", description: "Click Save to apply your analytics dashboard configuration." },
      { step: 5, title: "View Reports", description: "Access generated reports from the Reports section. Export as CSV or PDF." },
    ],
    articles: [
      {
        id: "an-dashboard",
        title: "Dashboard Metrics Explained",
        content: "Understanding your analytics dashboard helps you make data-driven decisions about your platform.",
        tips: [
          "Total Users — Shows the count of all registered users across all roles.",
          "Active Students — Students who accessed the platform in the last 30 days.",
          "Revenue Overview — Total revenue from course purchases, broken down by period.",
          "Course Completion Rate — Percentage of enrolled students who completed a course.",
          "Engagement Analytics — Tracks login frequency, session duration, and content interaction.",
        ],
      },
    ],
    troubleshooting: [
      { issue: "Data not updating", solution: "Analytics data refreshes periodically. Allow a few minutes for new data to reflect." },
      { issue: "Reports missing", solution: "Ensure the date range is set correctly. Some reports require a minimum data threshold." },
      { issue: "Metrics mismatch", solution: "Verify filters and date ranges match across different dashboard widgets." },
    ],
  },
];

// ============================================
// FAQ DATA
// ============================================

export const faqData: FAQ[] = [
  {
    id: "faq-1",
    question: "How do I reset my password?",
    answer:
      "Click 'Forgot Password' on the login page. Enter your registered email and you will receive a password reset link. Click the link in the email and set a new password. The reset link expires after 24 hours for security.",
  },
  {
    id: "faq-2",
    question: "How do I create a course?",
    answer:
      "Navigate to 'Courses' from the sidebar and click 'Create Course'. Fill in the course title, description, category, and pricing. Then use the Course Builder to add sections, lectures, quizzes, and resources. Once ready, submit for approval or publish directly if you are an Admin.",
  },
  {
    id: "faq-3",
    question: "Why are payments failing?",
    answer:
      "Payment failures can occur due to several reasons: invalid API keys in Razorpay/Stripe settings, currency mismatch between your gateway and platform configuration, expired test keys, or webhook URL not being publicly accessible. Navigate to Payment Settings to verify your configuration.",
  },
  {
    id: "faq-4",
    question: "How do I assign user roles?",
    answer:
      "Go to 'Users' in the admin sidebar. Find the user you want to modify, click on their profile, and use the role dropdown to assign a new role (Admin, Instructor, Student, or Franchise Manager). Click Save to apply the changes.",
  },
  {
    id: "faq-5",
    question: "Why are emails not sending?",
    answer:
      "Check your email service configuration in Platform Settings. Verify that SMTP credentials or email API keys (e.g., SendGrid, Nodemailer) are correctly configured. Also ensure the sender email address is verified with your email provider.",
  },
  {
    id: "faq-6",
    question: "How do I enable maintenance mode?",
    answer:
      "Navigate to 'Platform Settings' and toggle the Maintenance Mode switch ON. Add a custom maintenance message with estimated return time. Click Save. All non-admin users will immediately see the maintenance page. Admin users can still access the full dashboard.",
  },
  {
    id: "faq-7",
    question: "How do I publish a course?",
    answer:
      "If you are an Instructor, click 'Submit for Approval' in the Course Builder. An Admin will review and approve/reject the course. If you are an Admin, you can directly publish courses by changing the course status to 'Published' from the Course Approval or Course Management page.",
  },
  {
    id: "faq-8",
    question: "How do I configure analytics?",
    answer:
      "Navigate to 'Analytics' from the admin sidebar. Configure which metrics you want to track on your dashboard. Select date ranges, user segments, and course filters to customize your reports. You can export reports as CSV or PDF from the Reports section.",
  },
];

// ============================================
// TROUBLESHOOTING CATEGORIES
// ============================================

export const troubleshootingCategories: TroubleshootingCategory[] = [
  {
    id: "ts-auth",
    title: "Authentication Issues",
    icon: "ShieldAlert",
    items: [
      { issue: "Login failed", solution: "Verify email and password. Check if the account is active. Try resetting your password using the 'Forgot Password' link." },
      { issue: "Password reset not working", solution: "Ensure you are entering the correct registered email. Check spam/junk folder for the reset email. Reset links expire after 24 hours." },
      { issue: "Session expired", solution: "Sessions expire after a period of inactivity for security. Log in again to continue. Enable 'Remember Me' if available." },
    ],
  },
  {
    id: "ts-course",
    title: "Course Issues",
    icon: "BookX",
    items: [
      { issue: "Upload failed", solution: "Check file size limits (videos: 500MB, documents: 10MB). Ensure a stable internet connection. Try compressing the file." },
      { issue: "Video playback issue", solution: "Verify the video format is MP4 or WebM. Check browser compatibility. Try clearing browser cache." },
      { issue: "Course visibility issue", solution: "Ensure course status is 'Published'. Check if the course is set to private. Verify category assignment and pricing." },
    ],
  },
  {
    id: "ts-payment",
    title: "Payment Issues",
    icon: "CreditCard",
    items: [
      { issue: "Razorpay integration failed", solution: "Verify API keys are correct and not expired. Ensure the Razorpay account is activated. Check webhook URL configuration." },
      { issue: "Payment pending", solution: "Payment may be processing. Check transaction status in the Payments dashboard. Contact Razorpay support if stuck for more than 24 hours." },
      { issue: "Invalid API key", solution: "Re-generate API keys from the Razorpay dashboard. Ensure you are using Test keys for development and Live keys for production." },
    ],
  },
  {
    id: "ts-comm",
    title: "Communication Issues",
    icon: "MailX",
    items: [
      { issue: "Notification not delivered", solution: "Check notification settings for the target user group. Verify email service configuration. Check server logs for delivery errors." },
      { issue: "Email sending failed", solution: "Verify SMTP or email API configuration. Check if the sender email is verified. Ensure the email service is not rate-limited." },
    ],
  },
  {
    id: "ts-analytics",
    title: "Analytics Issues",
    icon: "BarChart3",
    items: [
      { issue: "Dashboard not updating", solution: "Analytics data refreshes periodically. Wait a few minutes and reload. Check if any filters are restricting the data view." },
      { issue: "Missing reports", solution: "Verify the date range and filters. Some reports need a minimum number of data points. Try expanding the date range." },
    ],
  },
];
