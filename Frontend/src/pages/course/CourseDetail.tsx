import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Clock,
  Users,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  GraduationCap,
  Share2,
  Heart,
  BookOpen,
  FileText,
  Globe,
  Smartphone,
  LifeBuoy,
  Award,
  Loader2,
  Tag as TagIcon,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api, { Courses, Enrollments } from "@/lib/api";
import { razorpayService } from "@/lib/api/razorpayService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/auth/AuthModal";

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  price: number;
  level?: string;
  language?: string;
  updated_at: string;
  certificate_enabled?: boolean;
  instructor: {
    bio?: string;
    user: {
      name: string;
      email: string;
      avatar_url?: string;
    };
  };
  category?: {
    name: string;
  };
  sections: Array<{
    id: string;
    title: string;
    order_index: number;
    items: Array<{
      id: string;
      title: string;
      item_type: string;
      duration_minutes?: number;
      order_index: number;
    }>;
  }>;
  enrollments?: any[];
  reviews?: any[];
}

// Pending action to perform after login
type PendingAction = 'enroll' | 'add-to-cart' | null;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Cart state — track if this course is in cart
  const [inCart, setInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const { user } = useAuth();
  const { branding } = useFranchise();
  const { addToCart, items: cartItems, refreshCart } = useCart();

  // Check if course is already in cart
  useEffect(() => {
    if (course && cartItems) {
      setInCart(cartItems.some((item) => item.course?.id === course.id));
    }
  }, [course, cartItems]);

  // Check enrollment status whenever user or course changes
  const checkEnrollment = useCallback(async () => {
    if (!user || !course) return;
    try {
      setCheckingEnrollment(true);
      const enrollments = await Enrollments.getMyEnrollments();
      const enrolled = enrollments.some(
        (e: any) =>
          e.courseId === course.id ||
          e.course_id === course.id ||
          e.course?.id === course.id
      );
      if (enrolled) {
        setIsEnrolled(true);
        // Redirect enrolled students to course view
        navigate(`/course/${id}/view`, { replace: true });
      }
    } catch {
      // Non-critical — just don't redirect
    } finally {
      setCheckingEnrollment(false);
    }
  }, [user, course, id, navigate]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  // Helper to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setApplyingCoupon(true);
      setCouponError("");
      const res = await api.post('/coupons/validate', { code: couponCode.trim(), courseId: course?.id });
      setCouponData(res.data);
      toast({ title: "Success", description: "Coupon applied successfully!" });
    } catch (error: any) {
      setCouponData(null);
      setCouponError(error.response?.data?.message || "Invalid coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode("");
    setCouponError("");
  };

  const currentPrice = couponData ? couponData.final_price : course?.price;

  // ─── Enroll flow ───
  const doEnroll = async () => {
    if (!course || !user) return;
    try {
      setEnrolling(true);
      if (currentPrice === 0) {
        await Enrollments.adminEnroll(user.email, course.id);
        toast({ title: "Success", description: "Enrolled successfully!" });
        navigate(`/course/${id}/view`);
      } else {
        const res = await loadRazorpayScript();
        if (!res) {
          toast({ title: "Error", description: "Razorpay SDK failed to load. Are you online?", variant: "destructive" });
          return;
        }
        const orderData = await razorpayService.createOrder(course.id, currentPrice, couponData?.coupon_id);
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: branding?.name || "LMS Platform",
          description: `Enroll in ${course.title}`,
          image: branding?.logo_url || "",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              await razorpayService.verifyPayment({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
              toast({ title: "Success", description: "Payment successful. Enrolled!" });
              navigate(`/course/${id}/view`);
            } catch {
              toast({ title: "Error", description: "Payment verification failed.", variant: "destructive" });
            }
          },
          prefill: { name: user.name, email: user.email },
          theme: { color: branding?.primary_color || "#6366f1" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process enrollment.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnroll = () => {
    if (!user) {
      // Show auth modal — after login, auto-add to cart and go checkout
      setPendingAction('enroll');
      setShowAuthModal(true);
      return;
    }
    doEnroll();
  };

  // ─── Add to Cart flow ───
  const doAddToCart = async () => {
    if (!course) return;
    try {
      setAddingToCart(true);
      await addToCart(course.id);
      setInCart(true);
    } catch {
      // error handled inside addToCart
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      setPendingAction('add-to-cart');
      setShowAuthModal(true);
      return;
    }
    if (inCart) {
      navigate('/cart');
      return;
    }
    doAddToCart();
  };

  // Called after successful auth — execute the pending action
  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    if (!course) return;

    if (pendingAction === 'enroll' || pendingAction === 'add-to-cart') {
      // Auto-add to cart for both cases
      try {
        await addToCart(course.id);
        setInCart(true);
        await refreshCart();
        toast({ title: "Added to cart!", description: `${course.title} is in your cart. Continue to checkout.` });
        navigate('/cart');
      } catch {
        // Cart error shown by addToCart
      }
    }
    setPendingAction(null);
  };

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await Courses.getOne(id);
        setCourse(data);
        try {
          const { Reviews } = await import('@/lib/api');
          const [statsData, reviewsData] = await Promise.all([
            Reviews.getStats(id),
            Reviews.getForCourse(id)
          ]);
          setStats(statsData);
          setReviews(reviewsData);
        } catch (e) {
          console.error("Failed to fetch reviews:", e);
        }
      } catch (error: any) {
        console.error("Failed to load course:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load course",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id, toast]);

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const calculateTotalLessons = () => {
    if (!course?.sections) return 0;
    return course.sections.reduce((total, section) => total + (section.items?.length || 0), 0);
  };

  const calculateTotalDuration = () => {
    if (!course?.sections) return "0 hours";
    const totalMinutes = course.sections.reduce((total, section) => {
      return total + (section.items?.reduce((sum, item) => sum + (item.duration_minutes || 0), 0) || 0);
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    return `${hours}+ hours`;
  };

  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "lecture":
      case "video":
        return Play;
      case "quiz":
        return FileText;
      case "assignment":
        return BookOpen;
      default:
        return Play;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const studentCount = course.enrollments?.length || 0;
  const reviewCount = stats.totalReviews || 0;
  const avgRating = stats.averageRating || 0;
  const thumbnailUrl = course.thumbnail_url || course.thumbnail || null;
  const instructorInitials = course.instructor?.user?.name?.split(" ").map(n => n[0]).join("") || "IN";
  const instructorBio = course.instructor?.bio;

  return (
    <div className="min-h-screen bg-background">
      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-nav">
        <div className="container-coursera h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
              <span className="text-muted-foreground">/</span>
              <Link to="/courses" className="text-muted-foreground hover:text-foreground">Courses</Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-coursera-navy text-white py-8 lg:py-12">
        <div className="container-coursera">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {course.level || "All Levels"}
                </Badge>
                <span className="text-white/70">•</span>
                <span className="text-white/70">{calculateTotalDuration()}</span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{course.title}</h1>
              <p className="text-lg text-white/80 max-w-2xl">{course.subtitle || (course.description ? course.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '')}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-coursera-orange text-coursera-orange" />
                  <span className="font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "New"}</span>
                  <span className="text-white/70">({reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-white/70">
                  <Users className="h-4 w-4" />
                  {studentCount} students
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  {course.instructor.user.avatar_url && (
                    <AvatarImage src={course.instructor.user.avatar_url} />
                  )}
                  <AvatarFallback>{instructorInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{course.instructor.user.name}</p>
                  <p className="text-sm text-white/70">Instructor</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 pt-2">
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {course.language || "English"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {calculateTotalDuration()}
                </span>
                <span>Updated {formatDate(course.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-coursera py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {course.description && (
              <div className="bg-card border p-6">
                <h2 className="text-lg font-semibold mb-4">About this Course</h2>
                <div
                  className="text-muted-foreground prose prose-sm max-w-none
                             prose-headings:font-bold prose-headings:text-foreground
                             prose-a:text-coursera-blue prose-ul:list-disc prose-ol:list-decimal"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              </div>
            )}

            {/* Curriculum */}
            <div className="bg-card border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Course Content - {course.sections?.length || 0} sections
                </h2>
                <span className="text-sm text-muted-foreground">
                  {calculateTotalLessons()} lessons
                </span>
              </div>
              <div className="space-y-2">
                {course.sections?.sort((a, b) => a.order_index - b.order_index).map((section, sectionIndex) => (
                  <div key={section.id} className="border overflow-hidden">
                    <button
                      onClick={() => toggleSection(sectionIndex)}
                      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-8 w-8 rounded-full bg-coursera-blue flex items-center justify-center text-white font-semibold text-sm">
                          {sectionIndex + 1}
                        </div>
                        <div>
                          <span className="font-medium">{section.title}</span>
                          <p className="text-sm text-muted-foreground">
                            {section.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      {expandedSections.includes(sectionIndex) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedSections.includes(sectionIndex) && (
                      <div className="divide-y">
                        {section.items?.sort((a, b) => a.order_index - b.order_index).map((item) => {
                          const Icon = getItemIcon(item.item_type);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{item.title}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDuration(item.duration_minutes)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor — fully dynamic with bio */}
            <div className="bg-card border p-6">
              <h2 className="text-lg font-semibold mb-4">Instructor</h2>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  {course.instructor.user.avatar_url && (
                    <AvatarImage src={course.instructor.user.avatar_url} />
                  )}
                  <AvatarFallback className="text-lg font-bold">
                    {instructorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-coursera-blue text-base">{course.instructor.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{course.instructor.user.email}</p>
                  {instructorBio && (
                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed whitespace-pre-line">{instructorBio}</p>
                  )}
                  {!instructorBio && (
                    <p className="text-sm text-muted-foreground italic mt-1">No bio provided yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Student Feedback — real reviews + real rating */}
            {(reviews.length > 0 || avgRating > 0) && (
              <div className="bg-card border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 fill-coursera-orange text-coursera-orange" />
                    Student Feedback
                  </h2>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn("h-4 w-4", s <= Math.round(avgRating) ? "fill-coursera-orange text-coursera-orange" : "text-muted")}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{reviewCount} ratings</span>
                      </div>
                    </div>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            {review.user?.avatar_url && <AvatarImage src={review.user.avatar_url} />}
                            <AvatarFallback>
                              {review.user?.name ? review.user.name.split(" ").map((n: string) => n[0]).join("") : "S"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{review.user?.name || "Student"}</p>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={cn(
                                      "h-3 w-3",
                                      s <= review.rating ? "fill-coursera-orange text-coursera-orange" : "text-muted"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews yet — be the first to rate this course!</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Course Card */}
              <div className="bg-card border shadow-card overflow-hidden">
                <div className="relative">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group">
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-coursera-blue ml-1" />
                    </div>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Price */}
                  <div className="text-center">
                    {couponData ? (
                      <div className="flex flex-col items-center">
                        <span className="text-lg text-muted-foreground line-through">₹{course.price}</span>
                        <span className="text-3xl font-bold text-emerald-600">₹{currentPrice}</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">
                        {course.price === 0 ? "Free" : `₹${course.price}`}
                      </p>
                    )}
                  </div>

                  {/* Coupon Input */}
                  {course.price > 0 && !couponData && (
                    <div className="pt-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="uppercase font-mono"
                        />
                        <Button variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                          {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-red-500 mt-1 font-medium">{couponError}</p>}
                    </div>
                  )}
                  {couponData && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between p-2 px-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                        <div className="flex items-center gap-2">
                          <TagIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                            {couponCode}
                          </span>
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                            (-₹{couponData.discount_amount})
                          </span>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Enroll / Buy Now button */}
                  {isEnrolled ? (
                    <Button
                      onClick={() => navigate(`/course/${id}/view`)}
                      className="w-full bg-green-600 hover:bg-green-700 font-semibold h-12 text-base gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Go to Course
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling || checkingEnrollment}
                      className="w-full bg-coursera-blue hover:bg-coursera-blue-hover font-semibold h-12 text-base"
                    >
                      {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {enrolling ? "Processing..." : currentPrice === 0 ? "Enroll Now" : "Buy Now"}
                    </Button>
                  )}

                  {/* Add to Cart button (only for paid courses and non-enrolled) */}
                  {!isEnrolled && course.price > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="w-full font-semibold h-11 gap-2 border-2"
                    >
                      {addingToCart ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                      {inCart ? "Go to Cart" : "Add to Cart"}
                    </Button>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">This course includes:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="h-4 w-4" />
                        <span>{calculateTotalDuration()} on-demand video</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{calculateTotalLessons()} lessons</span>
                      </div>
                      {course.certificate_enabled && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>Certificate of completion</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Smartphone className="h-4 w-4" />
                        <span>Access on mobile and desktop</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LifeBuoy className="h-4 w-4" />
                        <span>Full lifetime access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              {course.category && (
                <div className="bg-card border p-6">
                  <p className="text-sm font-medium mb-3">Category</p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-coursera-blue" />
                    </div>
                    <div>
                      <p className="font-semibold">{course.category.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:hidden z-50 shadow-nav">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {currentPrice === 0 ? "Free Course" : `₹${currentPrice}`}
            </p>
            <p className="font-semibold truncate max-w-[160px]">{course.title}</p>
          </div>
          <div className="flex gap-2">
            {isEnrolled ? (
              <Button
                onClick={() => navigate(`/course/${id}/view`)}
                className="bg-green-600 hover:bg-green-700 font-semibold px-5 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Go to Course
              </Button>
            ) : (
              <>
                {course.price > 0 && !inCart && (
                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="px-3 border-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-coursera-blue hover:bg-coursera-blue-hover font-semibold px-6"
                >
                  {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {enrolling ? "Processing..." : currentPrice === 0 ? "Enroll Now" : "Buy Now"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
