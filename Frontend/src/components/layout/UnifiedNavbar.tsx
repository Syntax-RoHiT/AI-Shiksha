import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Search,
    ShoppingCart,
    Menu,
    X,
    User,
    LogOut,
    Settings,
    LayoutDashboard,
    ChevronDown,
    GraduationCap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Categories } from "@/lib/api";
import { useFranchise } from "@/contexts/FranchiseContext";
import { getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/ui/InteractiveHoverButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function UnifiedNavbar() {
    const { branding } = useFranchise();
    const { user, logout, isAuthenticated } = useAuth();
    const { items } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const handleScroll = () => {
            if (window.location.pathname === "/") {
                setIsScrolled(window.scrollY > window.innerHeight - 80);
            } else {
                setIsScrolled(window.scrollY > 0);
            }
        };
        window.addEventListener("scroll", handleScroll);
        fetchCategories();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await Categories.getAll();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const getDashboardLink = () => {
        if (!user) return "/login";
        return "/dashboard";
    };

    const isLanding = location.pathname === "/";

    const navContent = (
        <div className={`w-full flex items-center justify-between gap-2 md:gap-4 max-w-7xl mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] h-16 ${!isLanding && "px-4 sm:px-6"}`}>
            {/* Left Section: Logo & Explore */}
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Mobile Menu Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6 text-text-main" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-0">
                            <div className="p-4 border-b">
                                <div className="flex items-center gap-2 font-bold text-xl text-primary headline-serif">
                                    {branding.favicon_url || branding.logo_url ? (
                                        <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-6 w-6 object-cover rounded-md" />
                                    ) : (
                                        <GraduationCap className="h-6 w-6" />
                                    )}
                                    <span>{branding.lms_name}</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-4 font-sans">
                                <Link to="/" className="block py-2 font-light text-text-main hover:text-primary">Home</Link>
                                <Link to="/courses" className="block py-2 font-light text-text-main hover:text-primary">All Courses</Link>
                                <div className="py-2">
                                    <h3 className="font-bold mb-2 text-[10px] uppercase tracking-widest text-text-muted">Categories</h3>
                                    <div className="pl-4 space-y-2">
                                        {categories.map((cat) => (
                                            <Link key={cat.id} to={`/courses?category=${cat.name}`} className="block py-1 text-sm font-light text-text-muted hover:text-primary">
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
                        <div className="overflow-hidden flex items-center justify-center">
                            {branding.favicon_url || branding.logo_url ? (
                                <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-8 w-8 object-contain drop-shadow-sm" />
                            ) : (
                                <GraduationCap className="h-8 w-8 text-primary drop-shadow-sm" />
                            )}
                        </div>
                        <span className="hidden sm:block headline-serif text-xl font-light text-text-main tracking-tight">{branding.lms_name}</span>
                    </Link>

                    {/* Explore Button (Desktop) */}
                    <div className="hidden md:block relative group">
                        <button className="headline-serif text-sm font-light text-text-main hover:text-primary py-5 px-2 flex items-center gap-1 transition-colors">
                            Explore <ChevronDown className="w-4 h-4 opacity-50" />
                        </button>
                        {/* Dropdown */}
                        <div className="absolute top-16 left-0 w-64 bg-white border border-gray-100 shadow-xl rounded-b-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden font-sans">
                            <div className="py-2">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        to={`/courses?category=${cat.name}`}
                                        className="block px-4 py-2 text-sm font-light text-text-main hover:bg-primary/5 hover:text-primary transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                {categories.length > 0 && <div className="border-t border-gray-50 my-1"></div>}
                                <Link to="/courses" className="block px-4 py-2 text-[10px] tracking-widest uppercase font-bold text-primary hover:bg-primary/5 transition-colors">
                                    View All Courses
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Search */}
                {/* Hide search on specific pages */}
                {!['/courses', '/cart', '/checkout'].some(path => location.pathname.startsWith(path)) && (
                    <div className="flex-1 max-w-2xl hidden md:block">
                        <form onSubmit={handleSearch} className="relative group/search">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4 transition-colors group-focus-within/search:text-primary" />
                            <input
                                type="text"
                                placeholder="Search for anything..."
                                className="w-full pl-12 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-light text-text-main bg-white/50 focus:bg-white transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>
                )}

                {/* Right Section: Cart & Auth */}
                <div className="flex items-center gap-2 sm:gap-4">

                    {/* Mobile Search Toggle */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Search className="h-5 w-5 text-text-main" />
                    </Button>

                    {/* Cart */}
                    <Link to="/cart" className="relative p-2 hover:bg-primary/5 hover:text-primary rounded-full transition-colors group">
                        <ShoppingCart className="h-5 w-5 text-text-main group-hover:text-primary transition-colors" />
                        {items.length > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                {items.length}
                            </span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link to={getDashboardLink()} className="hidden md:flex items-center gap-2 headline-serif text-sm font-light text-text-main hover:text-primary px-3 py-2 hover:bg-primary/5 rounded-full transition-colors">
                                <LayoutDashboard className="w-4 h-4 opacity-50" />
                                Dashboard
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative w-9 h-9 rounded-full overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border border-gray-100 shadow-sm">
                                        {user?.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl p-2 font-sans border border-gray-100 shadow-xl">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="font-bold text-sm tracking-tight text-text-main">{user?.name}</p>
                                            <p className="text-xs text-text-muted truncate font-light tracking-wide">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-gray-100" />
                                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="text-sm font-light rounded-lg cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors">
                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-100" />
                                    <DropdownMenuItem onClick={logout} className="text-red-500 font-bold tracking-wide text-xs uppercase cursor-pointer rounded-lg hover:bg-red-50 transition-colors">
                                        <LogOut className="mr-2 h-4 w-4" /> Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login">
                                <Button variant="ghost" className="font-bold text-[10px] tracking-widest uppercase text-text-main hover:text-primary hover:bg-primary/5 rounded-full transition-colors">
                                    Log in
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <InteractiveHoverButton className="h-9 px-6 hidden sm:flex text-[10px] tracking-widest uppercase">
                                    Sign up
                                </InteractiveHoverButton>
                            </Link>
                        </div>
                    )}
                </div>
        </div>
    );

    if (isLanding) {
        return (
            <div className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'top-0' : 'top-4 md:top-6'}`}>
                <nav className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${isScrolled ? 'w-full h-16 bg-white/70 backdrop-blur-2xl shadow-sm rounded-none px-6 md:px-8 border-b border-white/20' : 'glass-nav-pill h-16 w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] max-w-5xl rounded-full px-4 sm:px-6 shadow-xl border border-white/40'}`}>
                    {navContent}
                </nav>
            </div>
        );
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-[#d1d7dc] ${isScrolled ? "shadow-md" : ""}`}>
            {navContent}
        </nav>
    );
}
