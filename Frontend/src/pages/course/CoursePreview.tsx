import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Courses, LectureContent, Reviews as ReviewsAPI, Enrollments } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import { LessonPreviewModal } from '@/components/preview/LessonPreviewModal';
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { AuthModal } from "@/components/auth/AuthModal";

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

// --- Header Component ---
// Header component removed as it is now provided by UnifiedLayout

// --- Hero Component ---
interface HeroProps {
  course: any;
}

const Hero: React.FC<HeroProps> = ({ course }) => {
  const averageRating = course._reviewStats?.averageRating ?? course.rating ?? 0;

  return (
    <div className="bg-[#0f172a] text-white py-8 md:py-12">
      <div className="max-w-[1184px] mx-auto px-6 relative">
        <div className="lg:w-2/3 pr-0 lg:pr-8">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap gap-2 mb-4 items-center">
            <Link className="text-[#c0c4fc] text-sm font-bold hover:underline" to="/">Home</Link>
            <Icon name="chevron_right" className="text-white !text-sm" fill={false} />
            <span className="text-[#c0c4fc] text-sm font-bold">{course.category?.name || 'Course'}</span>
          </nav>

          {/* Title & Description */}
          <div className="flex flex-col gap-4">
            <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="text-lg text-white">{course.subtitle || (course.description ? course.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '')}</p>

            {/* Ratings */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center text-[#f3ca8c] gap-1">
                <span className="font-bold text-base">{averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => {
                    if (i < Math.floor(averageRating)) {
                      return <Icon key={i} name="star" className="!text-base text-[#f3ca8c]" />;
                    } else if (i === Math.floor(averageRating) && averageRating % 1 >= 0.5) {
                      return <Icon key={i} name="star_half" className="!text-base text-[#f3ca8c]" />;
                    }
                    return <Icon key={i} name="star" className="!text-base text-[#f3ca8c]" fill={false} />;
                  })}
                </div>
              </div>
              <a className="text-[#c0c4fc] text-sm underline font-medium hover:text-white" href="#reviews">
                ({course._count?.reviews || 0} ratings)
              </a>
              <span className="text-white text-sm">{course._count?.enrollments || 0} students</span>
            </div>

            {/* Author & Meta */}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-sm text-white">
                Created by <a className="text-[#c0c4fc] underline font-bold hover:text-white" href="#instructor">
                  {course.instructor?.user?.name || 'Instructor'}
                </a>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                <div className="flex items-center gap-1">
                  <Icon name="new_releases" className="!text-sm" fill={false} />
                  <span>Last updated {new Date(course.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="language" className="!text-sm" fill={false} />
                  <span>{course.language || 'English'}</span>
                </div>
                {course.subtitle && (
                  <div className="flex items-center gap-1">
                    <Icon name="closed_caption" className="!text-sm" fill={false} />
                    <span>English [Auto]</span>
                  </div>
                )}
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
  const discountPercent = hasDiscount
    ? Math.round(((course.original_price - course.price) / course.original_price) * 100)
    : 0;

  return (
    <div className="lg:-mt-[300px] lg:sticky lg:top-[88px] self-start z-20">
      <AuthModal
        open={showAuthModal}
        onOpenChange={(open) => { setShowAuthModal(open); if (!open) setPendingAction(null); }}
        onSuccess={handleAuthSuccess}
      />
      <div className="bg-white border border-[#d1d7dc] shadow-xl overflow-hidden">
        {/* Featured Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          <img
            alt="Course thumbnail"
            className="w-full h-full object-cover"
            src={course.thumbnail_url || 'https://via.placeholder.com/1280x720?text=Course+Preview'}
          />
        </div>

        {/* Pricing Section */}
        <div className="p-6 space-y-4">
          {course.is_free ? (
            <p className="text-3xl font-bold text-[#2d2f31]">Free</p>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-[#2d2f31]">₹{course.price?.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-[#6a6f73] line-through">₹{course.original_price?.toLocaleString('en-IN')}</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {isEnrolled ? (
              <button
                onClick={() => navigate(`/course/${course.slug || course.id}/view`)}
                className="w-full bg-green-600 text-white font-bold py-3 px-4 hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Go to Course
              </button>
            ) : (
              <>
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full bg-[#a435f0] text-white font-bold py-3 px-4 hover:bg-[#7b1fa2] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isEnrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : (course.is_free ? "Enroll for Free" : "Enroll Now")}
                </button>
                {!course.is_free && (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full bg-white text-[#2d2f31] border border-[#2d2f31] font-bold py-3 px-4 hover:bg-[#f7f9fa] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : isInCart ? "Go to Cart" : "Add to Cart"}
                  </button>
                )}
              </>
            )}
          </div>

          <p className="text-center text-xs text-[#6a6f73] mt-2">30-Day Money-Back Guarantee</p>

          {/* Course Includes */}
          <div className="pt-4 border-t border-[#d1d7dc] space-y-3">
            <p className="text-sm font-bold text-[#2d2f31]">This course includes:</p>
            <ul className="space-y-2">
              {/* Lectures count from sections - always show if sections exist */}
              {course.sections && course.sections.length > 0 && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="videocam" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>{course.sections.reduce((acc: number, section: any) => acc + (section.items?.length || 0), 0)} lectures • Self-paced</span>
                </li>
              )}

              {/* Downloadable Resources - show by default if course_features is null */}
              {(course.course_features?.downloadable_resources ?? true) && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="download" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Downloadable resources</span>
                </li>
              )}

              {/* Lifetime Access - show by default if course_features is null */}
              {(course.course_features?.lifetime_access ?? true) && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="all_inclusive" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Full lifetime access</span>
                </li>
              )}

              {/* Mobile & TV Access - show by default if course_features is null */}
              {(course.course_features?.mobile_tv_access ?? true) && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="devices" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Access on mobile and TV</span>
                </li>
              )}

              {/* Assignments - only show if explicitly enabled */}
              {course.course_features?.assignments && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="assignment" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Assignments</span>
                </li>
              )}

              {/* Quizzes - only show if explicitly enabled */}
              {course.course_features?.quizzes && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="quiz" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Quizzes</span>
                </li>
              )}

              {/* Coding Exercises - only show if explicitly enabled */}
              {course.course_features?.coding_exercises && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="code" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Coding exercises</span>
                </li>
              )}

              {/* Articles - only show if explicitly enabled */}
              {course.course_features?.articles && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="article" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Articles & resources</span>
                </li>
              )}

              {/* Discussion Forum - only show if explicitly enabled */}
              {course.course_features?.discussion_forum && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="forum" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Discussion forum</span>
                </li>
              )}

              {/* Certificate - show if enabled */}
              {course.certificate_enabled && (
                <li className="flex items-center gap-3 text-sm text-[#2d2f31]">
                  <Icon name="emoji_events" className="!text-lg text-[#6a6f73]" fill={false} />
                  <span>Certificate of completion</span>
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 font-bold text-sm underline">
            <button className="hover:text-[#a435f0] transition-colors">Share</button>
            <button className="hover:text-[#a435f0] transition-colors">Gift this course</button>
            <button className="hover:text-[#a435f0] transition-colors">Apply Coupon</button>
          </div>
        </div>
      </div>

      {/* Business Box */}
      <div className="mt-6 border border-[#d1d7dc] p-6 space-y-4 bg-white shadow-sm">
        <h4 className="font-bold text-lg text-[#2d2f31]">Training 5+ people?</h4>
        <p className="text-sm text-[#6a6f73]">Get your team access to top courses anytime, anywhere.</p>
        <button className="w-full bg-white text-[#2d2f31] border border-black font-bold py-3 px-4 hover:bg-[#f7f9fa] transition-colors">
          Try Business Edition
        </button>
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

  const handlePreviewClick = async (item: any) => {
    setPreviewItem(item);
    setLoadingPreview(true);
    try {
      const content = await LectureContent.get(item.id);
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
  const [expandedAll, setExpandedAll] = useState(false);
  const [openSections, setOpenSections] = useState<number[]>([]);

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
    <section id="syllabus" className="mb-12">
      <h2 className="text-2xl font-bold mb-4 text-[#2d2f31]">Course content</h2>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#2d2f31]">{sections.length} sections • {totalLectures} lectures</p>
        <button
          onClick={handleExpandAll}
          className="text-[#a435f0] font-bold text-sm hover:text-[#7b1fa2] transition-colors"
        >
          {expandedAll ? 'Collapse all sections' : 'Expand all sections'}
        </button>
      </div>

      <div className="border border-[#d1d7dc] rounded-sm overflow-hidden">
        {sections.map((section, index) => {
          const isOpen = openSections.includes(index);

          return (
            <div key={section.id} className="border-b border-[#d1d7dc] last:border-b-0">
              <button
                onClick={() => toggleSection(index)}
                className="w-full bg-[#f7f9fa] p-4 flex justify-between items-center cursor-pointer hover:bg-[#e6e8eb] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-[#2d2f31]" />
                  <span className="font-bold text-[#2d2f31]">{section.title}</span>
                </div>
                <span className="text-sm text-[#2d2f31] hidden sm:block">
                  {section.items?.length || 0} lectures
                </span>
              </button>

              {isOpen && (
                <div className="bg-white p-4 space-y-4">
                  {(section.items || []).map((item: any, lIndex: number) => {
                    // Determine icon based on content type
                    let iconName = 'description'; // default
                    let iconFill = false;

                    if (item.type === 'LECTURE' && item.lecture_content) {
                      const contentType = item.lecture_content.content_type;
                      if (contentType === 'VIDEO') {
                        iconName = item.is_preview ? 'play_circle' : 'videocam';
                        iconFill = item.is_preview;
                      } else if (contentType === 'TEXT') {
                        iconName = 'description';
                        iconFill = false;
                      } else if (contentType === 'LINK') {
                        iconName = 'link';
                        iconFill = false;
                      } else if (contentType === 'FILE') {
                        iconName = 'attach_file';
                        iconFill = false;
                      }
                    } else if (item.type === 'QUIZ') {
                      iconName = 'quiz';
                      iconFill = false;
                    } else if (item.type === 'ASSIGNMENT') {
                      iconName = 'assignment';
                      iconFill = false;
                    }

                    return (
                      <div key={item.id} className="flex justify-between items-start text-sm group">
                        <div className="flex gap-3 flex-1">
                          <Icon
                            name={iconName}
                            className="text-[#6a6f73] !text-base mt-0.5"
                            fill={iconFill}
                          />
                          <span
                            onClick={() => item.is_preview && handlePreviewClick(item)}
                            className={`text-[#2d2f31] ${item.is_preview ? 'cursor-pointer hover:underline text-[#a435f0]' : ''}`}
                          >
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {item.is_preview && (
                            <span
                              onClick={() => handlePreviewClick(item)}
                              className="text-[#a435f0] underline text-xs cursor-pointer hover:text-[#7b1fa2]"
                            >
                              Preview
                            </span>
                          )}
                          <span className="text-[#6a6f73]">
                            {item.duration_minutes ? `${item.duration_minutes}m` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Video Preview Modal - New Implementation */}
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
    <section className="space-y-4 mb-12" id="instructor">
      <h2 className="text-2xl font-bold text-[#2d2f31]">Instructor</h2>

      <div className="border border-[#d1d7dc] p-6 bg-white shadow-sm rounded-sm">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-xl font-bold text-[#a435f0] underline cursor-pointer hover:text-[#7b1fa2]">
            {instructor?.user?.name || 'Instructor'}
          </h3>
          <p className="text-[#6a6f73]">{instructor?.headline || 'Course Instructor'}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="shrink-0">
            <div
              className="size-28 rounded-full bg-cover bg-center border border-gray-200 bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500"
              style={instructor?.avatar_url ? { backgroundImage: `url("${instructor.avatar_url}")` } : {}}
            >
              {!instructor?.avatar_url && (instructor?.user?.name?.[0] || 'I')}
            </div>
          </div>

          <div className="space-y-2 py-2">
            <div className="flex items-center gap-3 text-sm font-medium text-[#2d2f31]">
              <Icon name="star" className="!text-base" />
              <span>Instructor Rating</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-[#2d2f31]">
              <Icon name="military_tech" className="!text-base" />
              <span>Reviews</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-[#2d2f31]">
              <Icon name="group" className="!text-base" />
              <span>{enrollmentCount} Students</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-[#2d2f31]">
              <Icon name="play_circle" className="!text-base" />
              <span>Courses</span>
            </div>
          </div>
        </div>

        <div className={`text-sm text-[#2d2f31] leading-relaxed space-y-4 transition-all duration-500 overflow-hidden ${showFullBio ? 'max-h-[1000px]' : 'max-h-[150px] relative'}`}>
          <p>{instructor?.bio || 'Experienced instructor passionate about teaching and helping students achieve their goals.'}</p>
          {!showFullBio && (
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          )}
        </div>

        <button
          onClick={() => setShowFullBio(!showFullBio)}
          className="text-sm font-bold text-[#2d2f31] hover:text-black flex items-center gap-1 mt-4"
        >
          Show {showFullBio ? 'less' : 'more'}
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

  // Function to truncate HTML while preserving structure
  const truncateToWords = (html: string, wordLimit: number): { truncated: string; isTruncated: boolean } => {
    // Strip HTML tags for word counting only
    const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textOnly.split(' ');

    if (words.length <= wordLimit) {
      return { truncated: html, isTruncated: false };
    }

    // Calculate approximate character position for N words
    // Average word length + space ~ 6 characters
    const approximateCharPos = wordLimit * 6;

    // Truncate HTML at approximately that position
    let truncatedHtml = html.substring(0, approximateCharPos);

    // Try to end at a word boundary
    const lastSpace = truncatedHtml.lastIndexOf(' ');
    if (lastSpace > approximateCharPos * 0.8) {
      truncatedHtml = truncatedHtml.substring(0, lastSpace);
    }

    // Add ellipsis
    truncatedHtml += '...';

    return {
      truncated: truncatedHtml,
      isTruncated: true
    };
  };

  const { truncated, isTruncated } = truncateToWords(description, 100);
  const displayContent = isExpanded ? description : truncated;

  return (
    <div className="p-6">
      <div className="relative">
        <div
          className="prose prose-sm max-w-none text-[#2d2f31] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        {/* Gradient fade overlay when truncated */}
        {isTruncated && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>
      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-[#a435f0] font-bold hover:text-[#7b1fa2] transition-colors flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              Show less
              <Icon name="expand_less" className="!text-xl" fill={false} />
            </>
          ) : (
            <>
              Show more
              <Icon name="expand_more" className="!text-xl" fill={false} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

// --- Reviews Component ---
interface ReviewsProps {
  rating: number;
  reviews: any[];
}

const Reviews: React.FC<ReviewsProps> = ({ rating, reviews }) => {
  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
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
    <section className="space-y-6 pb-20 border-b border-[#d1d7dc]" id="reviews">
      <h2 className="text-2xl font-bold text-[#2d2f31]">Student feedback</h2>
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="text-center flex flex-col items-center min-w-[120px]">
          <p className="text-6xl font-bold text-[#b4690e]">{rating.toFixed(1)}</p>
          <div className="flex justify-center my-2 text-[#b4690e]">
            {[...Array(5)].map((_, i) => {
              if (i < Math.floor(rating)) {
                return <Icon key={i} name="star" className="text-[#b4690e]" />;
              } else if (i === Math.floor(rating) && rating % 1 >= 0.5) {
                return <Icon key={i} name="star_half" className="text-[#b4690e]" />;
              }
              return <Icon key={i} name="star" className="text-[#b4690e]" fill={false} />;
            })}
          </div>
          <p className="text-[#b4690e] font-bold text-sm">Course Rating</p>
        </div>

        <div className="flex-1 space-y-3 w-full">
          {bars.map((bar) => (
            <div key={bar.stars} className="flex items-center gap-4 group cursor-pointer">
              <div className="flex-1 bg-[#d1d7dc] h-2 relative">
                <div
                  className="bg-[#6a6f73] h-2 absolute top-0 left-0 transition-all duration-700 ease-out group-hover:bg-[#2d2f31]"
                  style={{ width: `${bar.percent}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-1 min-w-[120px] text-[#b4690e]">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className={`!text-sm ${i < bar.stars ? 'text-[#b4690e]' : 'text-[#d1d7dc]'}`}
                      fill={i < bar.stars}
                    />
                  ))}
                </div>
                <span className="text-[#a435f0] underline text-sm ml-2 font-medium">{bar.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6 mt-8">
        {reviews.length > 0 ? (
          reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="border-b border-[#d1d7dc] pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                  {review.user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#2d2f31]">{review.user?.name || 'Student'}</h4>
                    <span className="text-sm text-[#6a6f73]">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Icon
                          key={i}
                          name="star"
                          className={`!text-sm ${i < review.rating ? 'text-[#b4690e]' : 'text-[#d1d7dc]'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#2d2f31] text-sm">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-[#6a6f73]">
            <Icon name="chat_bubble_outline" className="!text-5xl mx-auto mb-4 opacity-50" fill={false} />
            <p>No reviews yet. Be the first to review this course!</p>
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

        // Fetch real review stats
        if (courseDetails?.id) {
          try {
            const stats = await ReviewsAPI.getStats(courseDetails.id);
            setReviewStats({ averageRating: stats.averageRating ?? 0, totalReviews: stats.totalReviews ?? 0 });
            // Attach stats to course for Hero component
            courseDetails._reviewStats = { averageRating: stats.averageRating ?? 0 };
            setCourse({ ...courseDetails });
          } catch { /* ignore if reviews endpoint fails */ }
        }

        // Check if user is already enrolled — redirect to course view
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
          } catch { /* ignore enrollment check errors */ }
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
      <div className="flex items-center justify-center min-h-screen bg-[#f7f9fa]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#a435f0] mx-auto mb-4" />
          <p className="text-[#6a6f73]">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f9fa]">
        <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
        <Link
          to="/"
          className="bg-[#a435f0] text-white font-bold py-3 px-6 hover:bg-[#7b1fa2] transition-colors"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Hero course={course} />

      <main className="relative">
        <div className="max-w-[1184px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 relative">
            {/* Main Column (Left) */}
            <div className="lg:col-span-2 space-y-12">
              {/* Learning Points Box */}
              <section className="p-6 border border-[#d1d7dc] bg-white">
                <h2 className="text-2xl font-bold mb-6 text-[#2d2f31]">What you'll learn</h2>
                {course.learning_outcomes && course.learning_outcomes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {course.learning_outcomes.map((point: string, index: number) => (
                      <div key={index} className="flex gap-3 items-start">
                        <Icon name="check" className="text-[#6a6f73] !text-xl mt-0.5" fill={false} />
                        <span className="text-[#2d2f31] text-sm leading-snug">{point}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No learning outcomes specified for this course yet.</p>
                )}
              </section>

              <CourseContent sections={course.sections || []} />

              {/* Description Section */}
              {course.description && (
                <section className="border border-[#d1d7dc] bg-white">
                  <div className="p-6 border-b border-[#d1d7dc]">
                    <h2 className="text-2xl font-bold text-[#2d2f31]">Description</h2>
                  </div>
                  <DescriptionSection description={course.description} />
                </section>
              )}

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
            <div className="lg:col-span-1">
              <Sidebar course={course} isEnrolled={isEnrolled} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#d1d7dc] shadow-lg p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-[#2d2f31]">
              ${course.price || 'Free'}
            </div>
            {course.sale_price && (
              <div className="text-sm text-[#6a6f73] line-through">
                ${course.sale_price}
              </div>
            )}
          </div>
          <Link to={`/learn/${course.id}/lesson/1`}>
            {/* Mobile bottom bar logic should also be updated ideally, but for now linking to learn page or using similar handleEnroll logic */}
          </Link>
        </div>
      </div>
    </div>
  );
}
