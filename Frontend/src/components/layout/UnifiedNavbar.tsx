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
        <div className={isLanding ? `w-full flex items-center justify-between gap-2 md:gap-4 transition-all duration-500 ease-in-out ${isScrolled ? 'max-w-7xl mx-auto' : ''}` : "max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 w-full"}>
            {/* Left Section: Logo & Explore */}
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Mobile Menu Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6 text-[#2d2f31]" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-0">
                            <div className="p-4 border-b">
                                <div className="flex items-center gap-2 font-bold text-xl text-[#a435f0]">
                                    {branding.favicon_url || branding.logo_url ? (
                                        <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-6 w-6 object-cover rounded-md" />
                                    ) : (
                                        <GraduationCap className="h-6 w-6" />
                                    )}
                                    <span>{branding.lms_name}</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <Link to="/" className="block py-2 font-medium">Home</Link>
                                <Link to="/courses" className="block py-2 font-medium">All Courses</Link>
                                <div className="py-2">
                                    <h3 className="font-bold mb-2 text-sm text-gray-500">Categories</h3>
                                    <div className="pl-4 space-y-2">
                                        {categories.map((cat) => (
                                            <Link key={cat.id} to={`/courses?category=${cat.name}`} className="block py-1 text-sm text-gray-600 hover:text-[#a435f0]">
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="hidden sm:block overflow-hidden">
                            {branding.favicon_url || branding.logo_url ? (
                                <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-8 w-8 object-cover rounded-md" />
                            ) : (
                                <GraduationCap className="h-8 w-8 text-[#a435f0]" />
                            )}
                        </div>
                        <span className="text-xl font-bold text-[#2d2f31] tracking-tight">{branding.lms_name}</span>
                    </Link>

                    {/* Explore Button (Desktop) */}
                    <div className="hidden md:block relative group">
                        <button className="text-sm font-medium text-[#2d2f31] hover:text-[#a435f0] py-5 px-2 flex items-center gap-1">
                            Explore <ChevronDown className="w-4 h-4" />
                        </button>
                        {/* Dropdown */}
                        <div className="absolute top-16 left-0 w-64 bg-white border border-[#d1d7dc] shadow-xl rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                            <div className="py-2">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        to={`/courses?category=${cat.name}`}
                                        className="block px-4 py-2 text-sm text-[#2d2f31] hover:bg-[#f7f9fa] hover:text-[#a435f0]"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                <div className="border-t border-gray-100 my-1"></div>
                                <Link to="/courses" className="block px-4 py-2 text-sm font-bold text-[#a435f0] hover:bg-[#f7f9fa]">
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
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6a6f73] w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search for anything..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#2d2f31] focus:outline-none focus:ring-1 focus:ring-[#2d2f31] text-sm bg-[#f7f9fa] focus:bg-white transition-colors"
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
                        <Search className="h-5 w-5 text-[#2d2f31]" />
                    </Button>

                    {/* Cart */}
                    <Link to="/cart" className="relative p-2 hover:bg-[#f7f9fa] rounded-full transition-colors">
                        <ShoppingCart className="h-5 w-5 text-[#2d2f31]" />
                        {items.length > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-[#a435f0] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                {items.length}
                            </span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link to={getDashboardLink()} className="hidden md:flex items-center gap-2 text-sm font-medium text-[#2d2f31] hover:text-[#a435f0] px-3 py-2 hover:bg-[#f7f9fa] rounded-full">
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative w-9 h-9 rounded-full overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#a435f0] focus:ring-offset-2">
                                        {user?.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#2d2f31] text-white flex items-center justify-center font-bold text-sm">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-2">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="font-medium">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" /> Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login">
                                <Button variant="ghost" className="font-bold text-[#2d2f31] hover:text-[#a435f0] hover:bg-[#f7f9fa] rounded-full">
                                    Log in
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <InteractiveHoverButton className="h-9 px-6 hidden sm:flex">
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
            <div className={`fixed left-0 right-0 z-50 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'top-0 px-0' : 'top-4 md:top-6 px-4'}`}>
                <nav className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${isScrolled ? 'w-full h-16 bg-white/60 backdrop-blur-xl shadow-md rounded-none px-4 md:px-8 border-b border-white/20' : 'glass-nav-pill h-16 w-full max-w-4xl rounded-full px-4 md:px-6 shadow-xl'}`}>
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
