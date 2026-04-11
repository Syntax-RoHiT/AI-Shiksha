import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  TrendingUp,
  Users,
  Code,
  Brain,
  Palette,
  Wand2,
  BarChart3,
  BadgeCheck,
  ChevronRight,
  Quote,
  Menu,
  X,
  CheckCircle,
  Camera,
  Music,
  Globe,
  Briefcase,
  School
} from "lucide-react";
import UnifiedNavbar from "@/components/layout/UnifiedNavbar";
import Footer from "@/components/marketing/Footer";
import { Courses as CoursesAPI, Categories as CategoriesAPI } from "@/lib/api";
import { InteractiveHoverButton } from "@/components/ui/InteractiveHoverButton";

// --- Types & Data ---

interface Course {
  id: number;
  title: string;
  category: string;
  categoryColor: string;
  author: string;
  rating: number;
  reviews: string;
  price: string;
  image: string;
  tagColor: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: "Advanced React & Next.js Architecture",
    category: "DEVELOPMENT",
    categoryColor: "text-primary bg-blue-50",
    author: "Sarah Jenkins • Senior Architect",
    rating: 4.9,
    reviews: "(1.2k)",
    price: "$89.99",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKQVkXTRU3_d1wAQHJYW5bRnRWjeWkdo8I39hyr9vxJthanvaxvvbGcX4HKekx_lgcaS2HG9AH7VCqjTLbOnwvImrYf9dqBMrFBrvb6UE-72HnWEYePvSr7Ld6DBJ0Miz9RR_WTNVKjv1ZPxOgaRnD6PjUmYozXknoc8WZgga5ehn_gXbjHEkcx3GIr-BDOuoqjnfjhkXznTX3wnaDBio-KrNMY64AhCbZP7bAsl5rcxNRUZtTAnz4x7Px9R04KmTu-O1h-JomkFI",
    tagColor: "bg-blue-50 text-primary"
  },
  {
    id: 2,
    title: "Python for Machine Learning Mastery",
    category: "DATA SCIENCE",
    categoryColor: "text-purple-600 bg-purple-50",
    author: "Dr. Michael Chen • AI Lead",
    rating: 4.8,
    reviews: "(850)",
    price: "$94.99",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANhv3-HkSs1IBiFBtnOJvNhgPukMDDKjfdEGMbohmORlBu2iPz9evAGlP2mO7FbLFwDSceXH5KolWrt8pFmVHimF-1rqbzX78U_eDcxB_aWxOTYUOWM7JmuMdn6rqiuWp0bY4p0iTqY6dSxExUUh-Sd58CDRwUh8fq-9fn58xaAj7O0ngFntGo1E0HZWTFIWFg8WaoTeGh8Myd7yjlGb45HprK7UviEkFjbByE_mPffsPgII0v3bw3jROXl6FodH0IHN5IXLrsGJE",
    tagColor: "bg-purple-50 text-purple-600"
  },
  {
    id: 3,
    title: "UI/UX Strategy: Designing for Conversion",
    category: "DESIGN",
    categoryColor: "text-pink-600 bg-pink-50",
    author: "Leo Valdez • Product Designer",
    rating: 4.7,
    reviews: "(430)",
    price: "$74.99",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBprQJeKgxsmggzIEn9J9pOvzcUJFUsUBxuOjodBqx-VgTGswNd_aAuVaJP7BuyMehFjyUUt1BiAned3QIDAPraYCGmkafO4H9z0B9CeqUHKkD1hL-dXSF1T0RmwzeX5D3uMMRlek_OGvumPJnAdmEu8gY58E-PoeQOg7RX9NMLToPbcu1thvoRVK2II_EAMJm8Lc6ZprsmN35UypqwEULY6yJCn8GRDBfrdmiFBK3F42iWrzDDoB75mSTH49PENPqTlpDp1F4Gayk",
    tagColor: "bg-pink-50 text-pink-600"
  },
  {
    id: 4,
    title: "Scaling Startups: The Growth Framework",
    category: "BUSINESS",
    categoryColor: "text-orange-600 bg-orange-50",
    author: "James Wilson • CEO @ ScaleUp",
    rating: 4.9,
    reviews: "(680)",
    price: "$129.99",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5KMFhjhy6HOOLxL-SVuhhIB5m-apQ17OSjOFWt_L0AB96vVpz8GrgSxjXl0iz0LEHmCYtU4Lr5pjijgAXr1uXlcNKklQ5jbZgijai26aFUcTGzFvbeFss75CwQbXB3DmpaoNZQ4cPkJmUMMVRqUum990M1VeNoFwaM4blbfoFKZQWEYrbrnwkp7QJzKc1n5mnsf-ZFeyKQo5jnrTXODLk2WvQnjMuE1acMWmGKb4sl-kqPpPXbyt5Zqx2mcw7MjyT3VXDp7J1n84",
    tagColor: "bg-orange-50 text-orange-600"
  }
];

const testimonials = [
  {
    id: 1,
    text: "The AI tutor is a game changer. I've learned more in 2 months here than I did in 2 years of university. Highly recommend!",
    name: "Elena Rodriguez",
    role: "Junior Developer at TechFlow",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-fpdQmSUfZQIhyXCJhRrnQAMwsrCgUL89qvy3tVlPaSSG8FpJg8hS4l2SDe1SaFtMIcgV84nzWuVy_QCm83JJnWO52z1cTOG9qUvT8tFX5kVbbwTg6WWG-gBiE6rh5RFzZ5W_Xt6oTe0fwZ08C-9kPFt1DfHDAZ4q-DV2P_PjhxqTC8M3mJDVZHfk6_-IZDeloockd9wbkt58KwKdcgCWgutAkMV5zM2MsWDUXD1i2s_HUZ5u43hiEIgezFBWdgTQ2-oAsa3qrZM"
  },
  {
    id: 2,
    text: "Cleanest UI I've ever seen in an LMS. The progression system keeps me motivated to study every single day after work.",
    name: "Marcus Thorne",
    role: "Product Designer",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbtDwUIB7vYVMK8T9hZ1zAe_aC4KGipvxZwLUG7j6_NyFv_OI6DAiSieGM1ZR_BXxQn0VunTXdLAn8T0R7Ej6b2cr9WWR5HvBVB8Qium9dMtCByDlo5adYpmyajHu0jkYPsm2711-BPpfmS7URMZsYUWqP_-loEpJbLs0ortwnK3hMzNjYbUxjijYHY6IfxTI1CE5vdcCBkBbaOKILMaNx-WjQ-qO_lNmd2NlqAVJT0rbFpFY8rB1xnTRQxIOIKsmI--_trt231aM"
  },
  {
    id: 3,
    text: "As a business owner, I needed to learn data analysis fast. The course was straight to the point and practical. Worth every penny.",
    name: "Jennifer Low",
    role: "Founder of EcoScale",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzq9PXcUqSJzaUcz6E0-As0Kcmi5Geywb790XvyHvGAl5J8Z2vcnH1LKJ0oskwvlYTg7wE3-ZiJ34u-Hhhlplfp-0YxNGaNggBphzX867CoR28Uhi210XuzcKR3dUBqwHb9YbnvS3KZM8aC-LTkqjOTEUesqF47LWYO57JqAl2yOPQgkw_SL2DkqNU5F91vllPFx0sd-2Dd2vWR62nzjOz1nR0tDaNfupqwt1LTvv4OD6FvsFuOvstbgUY7MWHQkzbaPD7-RldS28"
  },
];

// --- Components ---

const Hero = () => {
  return (
    <main 
      className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-transparent"
    >
      
      <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
        {/* Decorative Accent */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex justify-center transform -rotate-12"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
          </svg>
        </motion.div>
        
        {/* Breadcrumb Label */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold tracking-widest uppercase"
        >
          India's Premier AI Learning Platform
        </motion.div>
        
        {/* Main Headline */}
        <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="headline-serif text-5xl md:text-8xl text-text-main font-light leading-[1.05] mb-8 max-w-4xl mx-auto"
        >
          Mastering Safety Through <br/>
          <span className="italic text-primary font-normal">Intelligence</span>
        </motion.h1>
        
        {/* Subtext */}
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-xl mx-auto text-text-muted text-lg md:text-xl leading-relaxed mb-12 font-medium opacity-80"
        >
          Built on sovereign compute. Powered by frontier-class models. Delivering population-scale safety impact.
        </motion.p>
        
        {/* Hero CTA */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link to="/courses">
            <InteractiveHoverButton className="px-12 py-5 font-bold text-lg bg-gradient-to-r from-gray-900 to-black text-white hover:text-black">
              Browse Courses <ArrowRight className="h-5 w-5" />
            </InteractiveHoverButton>
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

const Categories = () => {
  const [dbCategories, setDbCategories] = useState<{name: string}[]>([]);

  useEffect(() => {
    CategoriesAPI.getAll().then(data => setDbCategories(data)).catch(console.error);
  }, []);

  const styles = [
    { icon: "leaderboard", color: "text-primary", bg: "bg-primary/5", shadow: "hover:shadow-primary/5" },
    { icon: "engineering", color: "text-[#4648d4]", bg: "bg-[#4648d4]/5", shadow: "hover:shadow-[#4648d4]/10" },
    { icon: "security_update_good", color: "text-[#a12e70]", bg: "bg-[#a12e70]/5", shadow: "hover:shadow-[#a12e70]/10" },
    { icon: "eco", color: "text-[#0051d5]", bg: "bg-[#0051d5]/5", shadow: "hover:shadow-[#0051d5]/10" },
  ];

  const defaultCategories = [
    { name: "Executive Leadership" },
    { name: "Technical Safety" },
    { name: "Risk Management" },
    { name: "Environmental Compliance" },
  ];

  const displayCategories = dbCategories.length > 0
    ? dbCategories.slice(0, 4).map((c, i) => ({ name: c.name, count: "Explore Courses", ...styles[i % styles.length] }))
    : defaultCategories.map((c, i) => ({ ...c, count: "Explore Courses", ...styles[i % styles.length] }));

  return (
    <div id="categories-section" className="relative px-6 pt-16 pb-32 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-20 relative z-10">
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4 block">IOSH Accredited Excellence</span>
        <h2 className="headline-serif text-5xl md:text-7xl font-light tracking-tight text-text-main mb-6">Course Categories</h2>
        <p className="max-w-2xl mx-auto text-text-muted text-lg leading-relaxed">
            Explore our specialized domains of expertise, tailored for every level of professional growth.
        </p>
      </div>
      
      {/* Course Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
        {displayCategories.map((cat, idx) => (
          <Link to={`/courses?category=${encodeURIComponent(cat.name)}`} key={idx}>
            <div className={`glass-card group p-6 rounded-xl border border-gray-100/50 text-center hover:-translate-y-1 transition-all duration-300 hover:shadow-xl ${cat.shadow} cursor-pointer h-full`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${cat.bg}`}>
                <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
              </div>
              <h3 className="headline-serif text-lg text-text-main group-hover:text-primary transition-colors">{cat.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

interface ApiCourse {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  rating?: number | string;
  students?: number;
  price: number;
  level?: string;
  thumbnail?: string;
}

const FeaturedCourses = () => {
  const [dbCourses, setDbCourses] = useState<ApiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    CoursesAPI.getAll(false)
      .then(data => {
        setDbCourses(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, []);

  const hardcodedCourses = [
    {
      slug: "behavioral-safety",
      title: "Behavioral Safety Leadership",
      description: "Harness advanced psychological frameworks to foster a culture of proactive safety beyond compliance and regulation.",
      tag: "Executive",
      tagColor: "bg-primary/10 text-primary",
      thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuAaKe_7gU_yWz-RiwZVoj-TlpUl7blaNFjq9uUQX33q0PoGujkfcfYpqcncFt9GomBkD1NCKW1dEi257IPdVl8sgYm3LIA2QrIb5joPjWrbOhNqomFhhr4XlHgtnzwSSlcVMHjmLJRoNFi-unWpZMJ7or2MATWFKwquOOCr-pIhe9jks2HTsjMjqNkr13aoOIJ8WpJs_TuduGmYTOv3Q86SlUhCXWlb8tnM1RuEYZX3_jbbSee28KW54JSlIE3G50VOUFBJb_WOWb4"
    },
    {
      slug: "risk-assessment",
      title: "Risk Assessment AI",
      description: "Deploying predictive modeling and machine learning to identify workplace hazards before they materialize into incidents.",
      tag: "Intermediate",
      tagColor: "bg-[#4648d4]/10 text-[#4648d4]",
      thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuARuUtDP1EiihisGEasi1GEXRMJNLZMpxiNy_kg5xsTTgcgP9Fo3oHlJ2FjEVxS6DhtJz85scwvykxWm947zHYIMFeBHFsJWinhEZdRyVAmhRc6pluxZlBZ09pd50zKqVjAjZm9z9J9y42SbBcRW2Zj0i0_NgDA7mfc-BW34dqU3GoJuX7rFlRCw2-ieSf1uGMkarcInE3l1VGfASU8MVCU7QMgYde7l3C17tQqWLVBuye9f_794xKi5UO-SVFVq-ZAS8bL_YiY97k"
    },
    {
      slug: "global-compliance",
      title: "Global Compliance Framework",
      description: "A comprehensive guide to navigating international occupational health standards across diverse legal jurisdictions.",
      tag: "Advanced",
      tagColor: "bg-[#a12e70]/10 text-[#a12e70]",
      thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc7J5fcCZQBcbZkpkC9m7DHVYui3wPxu0i1KDOE27hAdzW3-93r2jr_BOyLxkfiFaOhICXs3UWJQWnDYri-8cT3iGwic2HeKwrfeXwOd0suEIhKFUxZH1xTznHhDk-eF5ilW6fGVoy169apCWzd6-fBmVExTVIkJlYzMJtLg7qwppYuh0oKdW6TyL48xT4TNQHTED0frYeX1Y5TM3j9957EUcAr863-hUdHm8UccEFWmozu5_Lo5BlyRkVUTIyqeeLzF0XEdgu4y4"
    }
  ];

  const displayCourses = dbCourses.length > 0 
    ? dbCourses.slice(0, 6).map(c => ({
        slug: c.slug,
        title: c.title,
        description: `Taught by ${c.instructor}`,
        tag: c.level || "Popular",
        tagColor: "bg-primary/10 text-primary",
        thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?q=80"
      }))
    : hardcodedCourses;

  return (
    <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
      {/* Subtle Background Accent */}
      <div className="absolute bottom-[-10%] -left-64 w-[600px] h-[600px] bg-[#a12e70] opacity-[0.07] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>
      
      {/* Featured Mastery Paths Header */}
      <div className="text-center mb-16">
        <h2 className="headline-serif text-4xl md:text-5xl font-light tracking-tight text-text-main mb-6">Featured Mastery Paths</h2>
        <div className="h-1 w-20 bg-primary/20 mx-auto rounded-full"></div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {displayCourses.map((course, idx) => (
            <div key={idx} className="glass-card rounded-xl p-8 flex flex-col h-full border border-gray-100/50 shadow-sm group hover:-translate-y-2 transition-transform duration-500">
              <div className="mb-8 aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                />
              </div>
              <div className="mb-4">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${course.tagColor}`}>
                  {course.tag}
                </span>
              </div>
              <h3 className="headline-serif text-2xl font-light mb-4 line-clamp-2">{course.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                {course.description}
              </p>
              <Link to={course.slug ? `/courses/${course.slug}` : "/courses"} className="flex items-center gap-2 text-primary text-sm font-bold group/link mt-auto">
                Discover Path 
                <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const WhyChooseUs = () => {
  return (
    <section className="mt-32 relative z-10 px-6 max-w-7xl mx-auto pb-24">
      {/* Ambient Depth Graphic */}
      <div className="absolute top-[20%] -right-32 w-[700px] h-[700px] bg-[#4648d4] opacity-[0.06] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>

      <div className="text-center mb-16">
        <h2 className="headline-serif text-4xl md:text-5xl font-light tracking-tight text-text-main mb-4">The Intellectual Advantage</h2>
        <div className="h-1 w-20 bg-primary/20 mx-auto rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 rounded-xl border border-gray-100/50 text-center flex flex-col items-center group hover:bg-white/60 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          </div>
          <h4 className="headline-serif text-xl font-light mb-4">AI-Driven Curriculum</h4>
          <p className="text-text-muted text-sm leading-relaxed">Personalized learning paths that adapt in real-time to the shifting landscape of modern safety technologies.</p>
        </div>
        <div className="glass-card p-8 rounded-xl border border-gray-100/50 text-center flex flex-col items-center group hover:bg-white/60 transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#4648d4]/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[#4648d4] text-3xl">verified_user</span>
          </div>
          <h4 className="headline-serif text-xl font-light mb-4">IOSH Accredited</h4>
          <p className="text-text-muted text-sm leading-relaxed">Globally recognized certification that ensures your expertise meets the highest professional standards.</p>
        </div>
        <div className="glass-card p-8 rounded-xl border border-gray-100/50 text-center flex flex-col items-center group hover:bg-white/60 transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#a12e70]/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[#a12e70] text-3xl">diversity_3</span>
          </div>
          <h4 className="headline-serif text-xl font-light mb-4">Expert Mentors</h4>
          <p className="text-text-muted text-sm leading-relaxed">Direct access to industry veterans who have shaped international health and safety protocols.</p>
        </div>
      </div>
    </section>
  );
};


const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      text: "The integration of AI into risk assessment training completely shifted my perspective on proactive safety. This isn't just a course; it's a career evolution.",
      name: "Elena Moretti",
      role: "Safety Director, Eni Global",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4Csd6VutR-7JgWAymcasxrmTbFCtAeT6yDHK4gpT2s1tHW5aPFTKYNRVZF-qPGnuO3RYTrFreJXCOVOYS1YlUjOamZAQg91wQIcJGpAwiHRAbTTAEqm-9jMA618IVKq8H5N7upLxaa4k_XEQYIquwfQEZRBjYtgzXLRCTVmlAyvc0aOQaY3ptbY2-3keHMevq4JfUqIirxKc7R0a3OIOSP9V5BKuNk1XdtL9Q7mSHwIFiVgEiV7kUxPMiLXf-XeT4y7G0nbetj5Q",
      quoteColor: "text-primary/20"
    },
    {
      id: 2,
      text: "Navigating international compliance used to be a nightmare of paperwork. The framework taught here simplified our global operations overnight.",
      name: "Marcus Thorne",
      role: "HSE Lead, TechLogistics",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdvNtXepxSQkoATwM4y9fehrrCGdkjARg2DmHkXhgFX4JPC3Fmi1ccHsSwjoo1dI_83BDyrV1Y0Ev0EKbh7SeHkAV9FNvbZKZmC_IYHV_FbYkjNN5slLDWbfVAcwEF05QD-hLyl5Y8KiX7FmHz2uWZOQRioaPwqwXGu5ldzE_umK_N-o8szU9HLrm6jKFBz27T7DdUN8wQKpF2ZQHDacCH-aqQdBu4MG-fkWjc3kLlbDdQArb5fQ5G7-3JxT5RrHrF6x89QzlouSo",
      quoteColor: "text-[#4648d4]/20"
    }
  ];

  return (
    <section className="mt-32 pb-24 relative z-10 px-6">
      {/* Atmospheric Tie-in Graphic */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-primary opacity-[0.05] rounded-[100%] blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>

      <div className="text-center mb-16">
        <h2 className="headline-serif text-4xl md:text-5xl font-light tracking-tight text-text-main mb-4">Voice of the Academy</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <div key={t.id} className="glass-card p-10 rounded-xl border border-gray-100/50 shadow-lg relative bg-white/70">
            <span className={`material-symbols-outlined ${t.quoteColor} text-6xl absolute top-6 right-8 select-none`}>format_quote</span>
            <p className="headline-serif text-lg text-text-main mb-8 relative z-10 italic">"{t.text}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                <img alt="Student" className="w-full h-full object-cover grayscale" src={t.image} />
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-text-main">{t.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Professional Standards Anchor */}
      <div className="mt-32 pt-12 border-t border-gray-200/50 text-center max-w-4xl mx-auto">
        <h2 className="headline-serif text-3xl font-light text-text-muted mb-8">Professional Standards</h2>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tighter text-text-main">
            <span className="material-symbols-outlined">verified</span>
            IOSH Certified
          </div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tighter text-text-main">
            <span className="material-symbols-outlined">psychology</span>
            AI Assisted
          </div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tighter text-text-main">
            <span className="material-symbols-outlined">workspace_premium</span>
            ISO 45001
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Main App ---

export default function Landing() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-surface font-sans text-text-main relative selection:bg-primary/20 bg-white">
      {/* Global Interactive Mouse Glow */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle 800px at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(70, 72, 212, 0.08) 0%, rgba(161, 46, 112, 0.03) 40%, transparent 80%)"
        }}
      />
      
      {/* Fixed Navbar */}
      <UnifiedNavbar />

      <div className="relative z-10 hidden md:block">
        {/* Bridging Atmospheric Gradient Background between Hero & Categories */}
        <div className="absolute top-[80vh] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] opacity-30 pointer-events-none blur-[120px] -z-10">
          <div className="absolute top-[0%] left-[10%] w-[500px] h-[500px] bg-primary rounded-full mix-blend-multiply"></div>
          <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-[#a12e70] rounded-full mix-blend-multiply"></div>
        </div>
      </div>

      <div className="relative z-10 w-full overflow-x-hidden">
        <Hero />
        <Categories />
        <FeaturedCourses />
        <WhyChooseUs />
        <Testimonials />
        <Footer />
      </div>
    </div>
  );
}
