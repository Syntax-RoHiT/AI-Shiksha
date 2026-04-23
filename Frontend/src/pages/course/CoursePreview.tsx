import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Courses, LectureContent, Reviews as ReviewsAPI, Enrollments } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from "lucide-react";
import { LessonPreviewModal } from '@/components/preview/LessonPreviewModal';
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/auth/AuthModal";
import Footer from "@/components/marketing/Footer";
import { cn } from "@/lib/utils";

// --- Icon Component (Material Symbols) ---
interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
}

const Icon: React.FC<IconProps> = ({ name, className = "", fill = true }) => {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
};

// --- Hero Component ---
interface HeroProps {
  course: any;
}

const Hero: React.FC<HeroProps> = ({ course }) => {
  const averageRating = course._reviewStats?.averageRating ?? course.rating ?? 0;

  return (
    <div className="relative pt-24 pb-32 overflow-hidden border-b border-black/5 bg-[#f7f9fa]">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 z-0 mix-blend-overlay"
        style={{ backgroundImage: `url('/landing_page/auth_cloud_bg.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-blue-50/90 z-0 backdrop-blur-[2px]"></div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap gap-2 items-center">
            <Link className="px-3 py-1 bg-white/60 border border-black/10 rounded-full text-zinc-600 text-xs font-bold hover:text-zinc-900 hover:bg-white transition-colors uppercase tracking-widest backdrop-blur-md shadow-sm" to="/">
              Home
            </Link>
            <Icon name="chevron_right" className="text-zinc-400 !text-sm" fill={false} />
            <span className="px-3 py-1 bg-white/60 border border-black/10 rounded-full text-zinc-800 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
              {course.category?.name || 'Category'}
            </span>
          </nav>

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-zinc-900 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
              {course.title}
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 max-w-3xl leading-relaxed font-medium">
              {course.subtitle || (course.description ? course.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '')}
            </p>
          </div>

          {/* Badges & Stats */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            {averageRating >= 4.5 && (
              <span className="bg-[#A3FF12] text-black text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                Highly Rated
              </span>
            )}
            
            <div className="flex items-center bg-white border border-black/10 rounded-full px-4 py-1.5 gap-2 shadow-sm">
              <span className="font-bold text-zinc-900">{averageRating.toFixed(1)}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => {
                  if (i < Math.floor(averageRating)) {
                    return <Icon key={i} name="star" className="!text-sm text-[#eab308]" />;
                  } else if (i === Math.floor(averageRating) && averageRating % 1 >= 0.5) {
                    return <Icon key={i} name="star_half" className="!text-sm text-[#eab308]" />;
                  }
                  return <Icon key={i} name="star" className="!text-sm text-zinc-300" fill={false} />;
                })}
              </div>
              <a className="text-zinc-500 text-xs font-bold ml-1 hover:text-zinc-900 transition-colors underline decoration-zinc-300 underline-offset-2" href="#reviews">
                ({course._count?.reviews || 0} reviews)
              </a>
            </div>

            <div className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-1.5 shadow-sm">
              <Icon name="group" className="!text-sm text-zinc-500" />
              <span className="text-zinc-800 text-xs font-bold">{course._count?.enrollments || 0} students enrolled</span>
            </div>
          </div>

          {/* Instructor & Meta */}
          <div className="pt-6 border-t border-black/10 flex flex-col sm:flex-row gap-6 text-sm text-zinc-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center overflow-hidden shadow-inner">
                {course.instructor?.avatar_url ? (
                  <img src={course.instructor.avatar_url} alt="Instructor" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-600 font-bold">{course.instructor?.user?.name?.[0] || 'I'}</span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Created By</p>
                <a className="text-zinc-900 font-bold hover:text-blue-600 transition-colors" href="#instructor">
                  {course.instructor?.user?.name || 'Instructor'}
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Last Updated</p>
                <span className="text-zinc-800 font-medium">{new Date(course.updated_at).toLocaleDateString()}</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Language</p>
                <span className="text-zinc-800 font-medium">{course.language || 'English'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sidebar Component ---
interface SidebarProps {
  course: any;
  isEnrolled?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ course, isEnrolled }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enroll' | 'cart' | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isInCart = cartItems?.some((item: any) => item.course_id === course.id || item.course?.id === course.id);

  const doAddToCart = async () => {
    if (isInCart) { navigate("/cart"); return; }
    setIsAddingToCart(true);
    try {
      await addToCart(course.id);
      navigate("/cart");
    } catch (error: any) {
      if (error.response?.data?.message?.includes("already in cart")) {
        navigate("/cart");
      } else {
        toast.error("Failed to add to cart");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setPendingAction('cart');
      setShowAuthModal(true);
      return;
    }
    doAddToCart();
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      setPendingAction('enroll');
      setShowAuthModal(true);
      return;
    }
    setIsEnrolling(true);
    try {
      await addToCart(course.id);
      navigate("/cart");
    } catch (error: any) {
      if (error.response?.data?.message?.includes("already in cart")) {
        navigate("/cart");
      } else if (error.response?.data?.message?.includes("enrolled")) {
        navigate(`/course/${course.slug || course.id}/view`);
      } else {
        toast.error("Failed to process. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    if (pendingAction === 'cart') {
      await doAddToCart();
    } else if (pendingAction === 'enroll') {
      setIsEnrolling(true);
      try {
        await addToCart(course.id);
        navigate("/cart");
      } catch (error: any) {
        if (error.response?.data?.message?.includes("already in cart")) {
          navigate("/cart");
        }
      } finally {
        setIsEnrolling(false);
      }
    }
    setPendingAction(null);
  };

  const hasDiscount = course.original_price && course.original_price > course.price;

  return (
    <div className="lg:-mt-[240px] lg:sticky lg:top-24 self-start z-30">
      <AuthModal
        open={showAuthModal}
        onOpenChange={(open) => { setShowAuthModal(open); if (!open) setPendingAction(null); }}
        onSuccess={handleAuthSuccess}
      />
      <div className="bg-white/80 backdrop-blur-2xl border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[32px] overflow-hidden p-2">
        {/* Featured Image */}
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-100 border border-black/5">
          <img
            alt="Course thumbnail"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            src={course.thumbnail_url || 'https://via.placeholder.com/1280x720?text=Course+Preview'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg">
               <Icon name="play_arrow" className="text-zinc-900 !text-3xl ml-1" />
             </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="p-6 sm:p-8 space-y-6">
          {course.is_free ? (
            <p className="text-4xl font-black text-zinc-900 tracking-tight">Free</p>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black text-zinc-900 tracking-tight">₹{course.price?.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl text-zinc-400 line-through font-bold">₹{course.original_price?.toLocaleString('en-IN')}</span>
                  <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest">
                    Discounted
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {isEnrolled ? (
              <button
                onClick={() => navigate(`/course/${course.slug || course.id}/view`)}
                className="w-full h-14 bg-zinc-900 text-white font-bold text-[15px] rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-[0.98] tracking-wide"
              >
                Go to Course
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full h-14 bg-gradient-to-r from-[#A3FF12] via-[#b5ff40] to-[#A3FF12] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-bold text-[15px] rounded-2xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] tracking-wide"
                >
                  {isEnrolling ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : (course.is_free ? "Enroll for Free" : "Enroll Now")}
                </button>
                {!course.is_free && (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full h-14 bg-white border border-black/10 text-zinc-900 font-bold text-[15px] rounded-2xl hover:bg-zinc-50 transition-all disabled:opacity-70 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] tracking-wide shadow-sm"
                  >
                    {isAddingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : isInCart ? "Go to Cart" : "Add to Cart"}
                  </button>
                )}
              </>
            )}
          </div>

          <p className="text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">30-Day Money-Back Guarantee</p>

          {/* Course Includes */}
          <div className="pt-6 border-t border-black/10 space-y-4">
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">This course includes</p>
            <ul className="space-y-3">
              {course.sections && course.sections.length > 0 && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="videocam" className="!text-xl text-zinc-400" fill={false} />
                  <span>{course.sections.reduce((acc: number, section: any) => acc + (section.items?.length || 0), 0)} lectures on-demand</span>
                </li>
              )}
              {(course.course_features?.downloadable_resources ?? true) && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="download" className="!text-xl text-zinc-400" fill={false} />
                  <span>Downloadable resources</span>
                </li>
              )}
              {(course.course_features?.lifetime_access ?? true) && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="all_inclusive" className="!text-xl text-zinc-400" fill={false} />
                  <span>Full lifetime access</span>
                </li>
              )}
              {(course.course_features?.mobile_tv_access ?? true) && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="devices" className="!text-xl text-zinc-400" fill={false} />
                  <span>Access on mobile and TV</span>
                </li>
              )}
              {course.course_features?.assignments && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="assignment" className="!text-xl text-zinc-400" fill={false} />
                  <span>Assignments & projects</span>
                </li>
              )}
              {course.course_features?.quizzes && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="quiz" className="!text-xl text-zinc-400" fill={false} />
                  <span>Knowledge checks & quizzes</span>
                </li>
              )}
              {course.certificate_enabled && (
                <li className="flex items-center gap-3 text-sm text-zinc-700 font-medium">
                  <Icon name="emoji_events" className="!text-xl text-zinc-400" fill={false} />
                  <span>Certificate of completion</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Course Content Component ---
interface CourseContentProps {
  sections: any[];
}

const CourseContent: React.FC<CourseContentProps> = ({ sections }) => {
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const [openSections, setOpenSections] = useState<number[]>([]);

  const handlePreviewClick = async (item: any) => {
    setPreviewItem(item);
    setLoadingPreview(true);
    try {
      const content = await LectureContent.getPreview(item.id);
      setPreviewContent(content);
    } catch (error) {
      console.error('Failed to fetch preview content:', error);
      toast.error('Failed to load preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewItem(null);
    setPreviewContent(null);
  };

  const toggleSection = (index: number) => {
    setOpenSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleExpandAll = () => {
    if (expandedAll) {
      setOpenSections([]);
    } else {
      setOpenSections(sections.map((_, i) => i));
    }
    setExpandedAll(!expandedAll);
  };

  const totalLectures = sections.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);

  return (
    <section id="syllabus" className="mb-16">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">Syllabus</h2>
           <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{sections.length} sections • {totalLectures} lectures</p>
        </div>
        <button
          onClick={handleExpandAll}
          className="text-blue-600 font-bold text-sm tracking-wide hover:text-blue-700 transition-colors"
        >
          {expandedAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => {
          const isOpen = openSections.includes(index);

          return (
            <div key={section.id} className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
              <button
                onClick={() => toggleSection(index)}
                className="w-full bg-zinc-50 p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-100 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300", isOpen ? "bg-zinc-200 border-zinc-300 text-zinc-900" : "bg-white border-black/10 text-zinc-500")}>
                    <Icon name={isOpen ? "expand_less" : "expand_more"} className="!text-xl" />
                  </div>
                  <span className="font-bold text-zinc-900 text-lg">{section.title}</span>
                </div>
                <span className="text-sm text-zinc-500 font-medium hidden sm:block tracking-wide">
                  {section.items?.length || 0} items
                </span>
              </button>

              {isOpen && (
                <div className="bg-white p-5 space-y-3 border-t border-black/10">
                  {(section.items || []).map((item: any) => {
                    let iconName = 'description';
                    let iconFill = false;

                    if (item.type === 'LECTURE' && item.lecture_content) {
                      const contentType = item.lecture_content.content_type;
                      if (contentType === 'VIDEO') {
                        iconName = item.is_preview ? 'play_circle' : 'videocam';
                        iconFill = item.is_preview;
                      } else if (contentType === 'TEXT') {
                        iconName = 'article';
                      } else if (contentType === 'LINK') {
                        iconName = 'link';
                      } else if (contentType === 'FILE') {
                        iconName = 'attach_file';
                      }
                    } else if (item.type === 'QUIZ') {
                      iconName = 'quiz';
                    } else if (item.type === 'ASSIGNMENT') {
                      iconName = 'assignment';
                    }

                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors group gap-3">
                        <div className="flex items-center gap-3">
                          <Icon
                            name={iconName}
                            className={cn("!text-xl", item.is_preview ? "text-blue-600" : "text-zinc-400")}
                            fill={iconFill}
                          />
                          <span
                            onClick={() => item.is_preview && handlePreviewClick(item)}
                            className={cn("text-sm font-medium transition-colors", item.is_preview ? "text-zinc-900 cursor-pointer hover:text-blue-600" : "text-zinc-700")}
                          >
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 pl-9 sm:pl-0">
                          {item.is_preview && (
                            <span
                              onClick={() => handlePreviewClick(item)}
                              className="text-blue-600 text-xs font-bold uppercase tracking-widest cursor-pointer hover:underline"
                            >
                              Preview
                            </span>
                          )}
                          {item.duration_minutes && (
                            <span className="text-zinc-500 text-xs font-medium">
                              {item.duration_minutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <LessonPreviewModal
          open={!!previewItem}
          onOpenChange={(open) => !open && closePreview()}
          title={previewItem?.title || 'Lesson Preview'}
          content={previewContent}
          loading={loadingPreview}
        />
      </div>
    </section>
  );
};

// --- Instructor Component ---
interface InstructorProps {
  instructor: any;
  enrollmentCount: number;
}

const Instructor: React.FC<InstructorProps> = ({ instructor, enrollmentCount }) => {
  const [showFullBio, setShowFullBio] = useState(false);

  return (
    <section className="mb-16" id="instructor">
      <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-6">Instructor</h2>

      <div className="bg-white border border-black/10 p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 mb-6">
          <div className="shrink-0">
            <div
              className="w-32 h-32 rounded-full bg-cover bg-center border border-black/5 bg-zinc-100 flex items-center justify-center text-5xl font-black text-zinc-400 shadow-inner"
              style={instructor?.avatar_url ? { backgroundImage: `url("${instructor.avatar_url}")` } : {}}
            >
              {!instructor?.avatar_url && (instructor?.user?.name?.[0] || 'I')}
            </div>
          </div>

          <div className="flex-1 space-y-4">
             <div>
                <h3 className="text-2xl font-bold text-zinc-900 hover:text-blue-600 transition-colors cursor-pointer tracking-tight">
                  {instructor?.user?.name || 'Instructor'}
                </h3>
                <p className="text-zinc-500 font-medium text-sm mt-1">{instructor?.headline || 'Course Instructor'}</p>
             </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-black/5">
                <Icon name="star" className="!text-sm text-[#eab308]" />
                <span className="text-xs font-bold text-zinc-700 tracking-wide">Top Rated</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-black/5">
                <Icon name="group" className="!text-sm text-blue-600" />
                <span className="text-xs font-bold text-zinc-700 tracking-wide">{enrollmentCount} Students</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-full border border-black/5">
                <Icon name="military_tech" className="!text-sm text-green-600" />
                <span className="text-xs font-bold text-zinc-700 tracking-wide">Certified</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`text-zinc-600 font-medium leading-relaxed space-y-4 transition-all duration-500 overflow-hidden ${showFullBio ? 'max-h-[1000px]' : 'max-h-[100px] relative'}`}>
          <p>{instructor?.bio || 'Experienced instructor passionate about teaching and helping students achieve their goals within our next-gen LMS ecosystem.'}</p>
          {!showFullBio && (
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          )}
        </div>

        <button
          onClick={() => setShowFullBio(!showFullBio)}
          className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-4 tracking-wide transition-colors"
        >
          {showFullBio ? 'Read Less' : 'Read Full Bio'}
          <Icon name={showFullBio ? "keyboard_arrow_up" : "keyboard_arrow_down"} className="!text-lg" />
        </button>
      </div>
    </section>
  );
};

// --- Description Section Component ---
interface DescriptionSectionProps {
  description: string;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncateToWords = (html: string, wordLimit: number) => {
    const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textOnly.split(' ');

    if (words.length <= wordLimit) return { truncated: html, isTruncated: false };

    const approximateCharPos = wordLimit * 6;
    let truncatedHtml = html.substring(0, approximateCharPos);
    const lastSpace = truncatedHtml.lastIndexOf(' ');
    if (lastSpace > approximateCharPos * 0.8) truncatedHtml = truncatedHtml.substring(0, lastSpace);
    
    return { truncated: truncatedHtml + '...', isTruncated: true };
  };

  const { truncated, isTruncated } = truncateToWords(description, 100);
  const displayContent = isExpanded ? description : truncated;

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-6">About This Course</h2>
      <div className="bg-white border border-black/10 p-8 rounded-3xl shadow-sm relative">
        <div
          className="prose max-w-none text-zinc-600 font-medium leading-relaxed prose-headings:text-zinc-900 prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        {isTruncated && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none rounded-b-3xl" />
        )}
        
        {isTruncated && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 tracking-wide relative z-10"
          >
            {isExpanded ? 'Show less' : 'Read more'}
            <Icon name={isExpanded ? "expand_less" : "expand_more"} className="!text-lg" fill={false} />
          </button>
        )}
      </div>
    </section>
  );
};

// --- Reviews Component ---
interface ReviewsProps {
  rating: number;
  reviews: any[];
}

const Reviews: React.FC<ReviewsProps> = ({ rating, reviews }) => {
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) ratingCounts[review.rating - 1]++;
  });

  const totalReviews = reviews.length || 1;
  const bars = [
    { stars: 5, percent: Math.round((ratingCounts[4] / totalReviews) * 100) },
    { stars: 4, percent: Math.round((ratingCounts[3] / totalReviews) * 100) },
    { stars: 3, percent: Math.round((ratingCounts[2] / totalReviews) * 100) },
    { stars: 2, percent: Math.round((ratingCounts[1] / totalReviews) * 100) },
    { stars: 1, percent: Math.round((ratingCounts[0] / totalReviews) * 100) },
  ];

  return (
    <section className="mb-24" id="reviews">
      <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-8">Student Feedback</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-3 bg-white border border-black/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-7xl font-black text-zinc-900 tracking-tighter mb-2">{rating.toFixed(1)}</p>
          <div className="flex justify-center mb-3">
            {[...Array(5)].map((_, i) => {
              if (i < Math.floor(rating)) return <Icon key={i} name="star" className="text-[#eab308] !text-xl" />;
              if (i === Math.floor(rating) && rating % 1 >= 0.5) return <Icon key={i} name="star_half" className="text-[#eab308] !text-xl" />;
              return <Icon key={i} name="star" className="text-zinc-200 !text-xl" fill={false} />;
            })}
          </div>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Course Rating</p>
        </div>

        <div className="md:col-span-8 lg:col-span-9 bg-white border border-black/10 rounded-3xl p-6 shadow-sm flex flex-col justify-center gap-3">
          {bars.map((bar) => (
            <div key={bar.stars} className="flex items-center gap-4 group">
              <div className="flex items-center gap-1 w-16">
                <span className="text-zinc-700 font-bold text-sm">{bar.stars}</span>
                <Icon name="star" className="!text-sm text-[#eab308]" />
              </div>
              <div className="flex-1 bg-zinc-100 h-3 rounded-full relative overflow-hidden border border-black/5">
                <div
                  className="bg-blue-600 h-full absolute top-0 left-0 transition-all duration-1000 ease-out"
                  style={{ width: `${bar.percent}%` }}
                ></div>
              </div>
              <span className="text-zinc-500 font-bold text-xs w-10 text-right">{bar.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-4">
        {reviews.length > 0 ? (
          reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="bg-white border border-black/10 rounded-2xl p-6 hover:bg-zinc-50 transition-colors shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-xl font-bold text-zinc-500 border border-black/5 shrink-0">
                  {review.user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-zinc-900">{review.user?.name || 'Student'}</h4>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} name="star" className={cn("!text-sm", i < review.rating ? "text-[#eab308]" : "text-zinc-200")} />
                    ))}
                  </div>
                  <p className="text-zinc-600 font-medium text-sm leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-black/10 rounded-2xl p-12 text-center shadow-sm">
            <Icon name="rate_review" className="!text-5xl text-zinc-300 mb-4" fill={false} />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Main Component ---
export default function CoursePreview() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        let courseDetails;
        const isUUID = slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        if (isUUID) {
          courseDetails = await Courses.getOne(slug);
        } else {
          courseDetails = await Courses.getBySlug(slug!);
        }
        setCourse(courseDetails);

        if (courseDetails?.id) {
          try {
            const stats = await ReviewsAPI.getStats(courseDetails.id);
            setReviewStats({ averageRating: stats.averageRating ?? 0, totalReviews: stats.totalReviews ?? 0 });
            courseDetails._reviewStats = { averageRating: stats.averageRating ?? 0 };
            setCourse({ ...courseDetails });
          } catch { /* ignore */ }
        }

        if (isAuthenticated && user && courseDetails?.id) {
          try {
            const enrollments = await Enrollments.getMyEnrollments();
            const enrolled = enrollments?.some((e: any) =>
              e.course_id === courseDetails.id ||
              e.course?.id === courseDetails.id ||
              e.course?.slug === slug
            );
            if (enrolled) {
              navigate(`/course/${slug}/view`, { replace: true });
              return;
            }
          } catch { /* ignore */ }
        }
      } catch (error) {
        console.error("Failed to fetch course", error);
        toast.error("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f9fa]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Initializing Interface...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f9fa] px-6 text-center">
        <Icon name="error_outline" className="!text-6xl text-red-500 mb-6" />
        <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-4">Course Not Found</h1>
        <p className="text-zinc-600 font-medium mb-8 max-w-md">The learning module you are looking for could not be found.</p>
        <Link
          to="/"
          className="bg-zinc-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-zinc-800 transition-colors tracking-wide text-sm shadow-md"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f7f9fa] selection:bg-blue-100 selection:text-blue-900">
      <Hero course={course} />

      <main className="flex-1 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-16 pb-24 relative">
            {/* Main Column (Left) */}
            <div className="xl:col-span-2">
              
              {/* Learning Points Grid */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-6">Key Takeaways</h2>
                <div className="bg-white border border-black/10 p-8 rounded-3xl shadow-sm">
                  {course.learning_outcomes && course.learning_outcomes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {course.learning_outcomes.map((point: string, index: number) => (
                        <div key={index} className="flex gap-4 items-start">
                          <div className="w-6 h-6 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                             <Icon name="check" className="text-green-600 !text-sm" fill={false} />
                          </div>
                          <span className="text-zinc-700 text-sm font-medium leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-zinc-500 italic">
                      <Icon name="info" className="!text-lg" />
                      <span className="text-sm">Learning outcomes are being compiled.</span>
                    </div>
                  )}
                </div>
              </section>

              <DescriptionSection description={course.description} />
              
              <CourseContent sections={course.sections || []} />

              <Instructor
                instructor={course.instructor}
                enrollmentCount={course._count?.enrollments || 0}
              />

              <Reviews
                rating={reviewStats?.averageRating ?? course.rating ?? 0}
                reviews={course.reviews || []}
              />
            </div>

            {/* Sidebar Column (Right) */}
            <div className="xl:col-span-1">
              <Sidebar course={course} isEnrolled={isEnrolled} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-black/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 z-50">
        <div className="flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
          <div>
            <div className="text-2xl font-black text-zinc-900 tracking-tighter">
              {course.is_free ? 'FREE' : `₹${course.price?.toLocaleString('en-IN')}`}
            </div>
          </div>
          <button 
             onClick={() => document.querySelector('.lg\\:sticky')?.scrollIntoView({ behavior: 'smooth' })}
             className="bg-zinc-900 text-white font-bold px-6 py-3 rounded-xl tracking-wide text-sm flex items-center gap-2 shadow-md hover:bg-zinc-800"
          >
             Enroll Now
             <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
