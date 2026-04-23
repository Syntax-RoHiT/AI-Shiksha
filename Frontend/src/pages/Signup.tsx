import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, BookOpen, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { signup } = useAuth();
  const { branding } = useFranchise();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await signup(formData.email, formData.password, formData.name, role);
      if (success) {
        toast({
          title: "Account created!",
          description: "You have successfully signed up and logged in.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Signup failed",
          description: "Please check your details and try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Something went wrong. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = branding.primary_color || "#2d2f31";
  
  return (
    <div 
      className="min-h-screen font-sans flex items-center justify-center p-4 sm:p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/landing_page/auth_dark_cloud_bg.png')` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-[440px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[32px] p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="absolute top-8 left-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-xs font-bold text-zinc-400 hover:text-white transition-colors tracking-widest uppercase"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center mt-6 mb-8 text-center">
          <div className="bg-white/10 shadow-sm rounded-2xl w-14 h-14 flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
            {branding.logo_url ? (
              <img 
                src={getImageUrl(branding.logo_url)} 
                alt={`${branding.name} Logo`} 
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <UserPlus className="h-6 w-6 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create an account
          </h1>
          <p className="mt-3 text-sm text-zinc-400 font-medium leading-relaxed max-w-[280px]">
            Join {branding.lms_name || "us"} to start your learning journey today.
          </p>
        </div>

        {/* Role Selection inside the card styling */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all font-medium text-sm",
                role === "student" 
                  ? "bg-[#A3FF12] shadow-md text-black border border-transparent" 
                  : "text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all font-medium text-sm",
                role === "teacher" 
                  ? "bg-[#21e6ff] shadow-md text-black border border-transparent" 
                  : "text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Teacher
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 focus:bg-white/10 focus:ring-2 focus:ring-offset-0 transition-all shadow-sm placeholder:text-zinc-500 font-medium text-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 focus:bg-white/10 focus:ring-2 focus:ring-offset-0 transition-all shadow-sm placeholder:text-zinc-500 font-medium text-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 pr-12 focus:bg-white/10 focus:ring-2 focus:ring-offset-0 transition-all shadow-sm placeholder:text-zinc-500 font-medium text-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-full"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-14 mt-6 rounded-2xl shadow-[0_4px_14px_0_rgba(163,255,18,0.15)] flex items-center justify-center transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-bold text-[15px] tracking-wide",
              role === "student" 
                ? "bg-gradient-to-r from-[#A3FF12] via-[#b5ff40] to-[#A3FF12]" 
                : "bg-gradient-to-r from-[#21e6ff] via-[#66f0ff] to-[#21e6ff]"
            )}
          >
            {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm font-medium text-zinc-400">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className={cn(
                "font-semibold hover:underline transition-all",
                role === "student" ? "text-[#A3FF12] hover:text-[#b5ff40]" : "text-[#21e6ff] hover:text-[#66f0ff]"
              )}
            >
              Sign in
            </Link>
          </p>
          <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed max-w-[280px] mx-auto uppercase tracking-wide">
            By proceeding, you adhere to our{" "}
            <Link to="/terms" className="font-semibold hover:text-white transition-colors">Terms</Link> and{" "}
            <Link to="/privacy" className="font-semibold hover:text-white transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
