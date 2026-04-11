import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, BookOpen, Loader2, ArrowLeft } from "lucide-react";
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

  const submitRef = useRef<HTMLButtonElement>(null);

  const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!submitRef.current) return;
    const rect = submitRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    submitRef.current.style.setProperty('--mouse-x', `${x}%`);
    submitRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

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
  
  const roleColors = {
    student: primaryColor,
    teacher: "#8b5cf6" 
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-primary/5 to-primary/10 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient Depth Background Blobs */}
      <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-primary opacity-[0.05] rounded-full blur-[100px] mix-blend-multiply pointer-events-none -z-10"></div>
      <div className="absolute bottom-[5%] right-[10%] w-[600px] h-[600px] bg-[#a12e70] opacity-[0.04] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>

      <div className="w-full max-w-md glass-card bg-white/60 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 border border-gray-100/50 relative z-10">
        
        {/* Back Link */}
        <div className="mb-8 -mt-2">
          <Link 
            to="/" 
            className="inline-flex items-center text-xs font-bold text-text-muted hover:text-primary transition-colors tracking-widest uppercase"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>

        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-4 hover:opacity-90 transition-opacity">
            {branding.logo_url ? (
              <img 
                src={getImageUrl(branding.logo_url)} 
                alt={`${branding.name} Logo`} 
                className="h-12 w-auto object-contain drop-shadow-sm"
              />
            ) : (
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            )}
            <h1 className="headline-serif text-3xl font-light text-text-main tracking-tight text-center">
              Join {branding.lms_name}
            </h1>
          </Link>
          <p className="mt-3 text-sm text-text-muted text-center font-light">
            Create an account to start your learning journey.
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3 mb-8">
          <Label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Intent</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 border p-4 rounded-xl transition-all cursor-pointer",
                role === "student" ? "bg-white/80 shadow-sm border-transparent" : "border-gray-200/50 hover:border-gray-300 bg-white/40"
              )}
              style={role === "student" ? { 
                borderColor: `${roleColors.student}30`, 
                backgroundColor: `${roleColors.student}10` 
              } : {}}
            >
              <GraduationCap 
                className="h-6 w-6 transition-colors" 
                style={{ color: role === "student" ? roleColors.student : "#9ca3af" }} 
              />
              <span className="font-bold text-sm tracking-wide" style={{ color: role === "student" ? roleColors.student : "#6b7280" }}>
                Learn
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 border p-4 rounded-xl transition-all cursor-pointer",
                role === "teacher" ? "bg-white/80 shadow-sm border-transparent" : "border-gray-200/50 hover:border-gray-300 bg-white/40"
              )}
              style={role === "teacher" ? { 
                borderColor: `${roleColors.teacher}30`, 
                backgroundColor: `${roleColors.teacher}10` 
              } : {}}
            >
              <BookOpen 
                className="h-6 w-6 transition-colors" 
                style={{ color: role === "teacher" ? roleColors.teacher : "#9ca3af" }} 
              />
              <span className="font-bold text-sm tracking-wide" style={{ color: role === "teacher" ? roleColors.teacher : "#6b7280" }}>
                Teach
              </span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 rounded-xl border border-gray-200 bg-white/70 px-4 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all shadow-sm"
              style={{ '--tw-ring-color': roleColors[role] } as React.CSSProperties}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Email Protocol</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 rounded-xl border border-gray-200 bg-white/70 px-4 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all shadow-sm"
              style={{ '--tw-ring-color': roleColors[role] } as React.CSSProperties}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Security Key</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a security key"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-12 h-12 rounded-xl border border-gray-200 bg-white/70 px-4 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all shadow-sm"
                style={{ '--tw-ring-color': roleColors[role] } as React.CSSProperties}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100/50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-2 uppercase tracking-wide ml-1">Must be at least 8 characters</p>
          </div>

          {/* Interactive Form Submit Button */}
          <button
            type="submit"
            ref={submitRef}
            onMouseMove={handleButtonMouseMove}
            disabled={isLoading}
            className="group relative w-full h-12 mt-8 rounded-xl overflow-hidden shadow-md flex items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
          >
            <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: roleColors[role] }}></div>
            <div 
              className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-40 mix-blend-overlay"
              style={{
                background: "radial-gradient(120px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.9), transparent 100%)"
              }}
            ></div>
            <span className="relative z-10 text-white font-bold text-sm tracking-widest uppercase flex items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Profile"
              )}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center pt-6 border-t border-gray-200/50 space-y-4">
          <p className="text-sm font-light text-text-muted">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="font-bold hover:underline transition-colors ml-1"
              style={{ color: primaryColor }}
            >
              Access System
            </Link>
          </p>
          <p className="text-[10px] text-text-muted mt-4 leading-relaxed max-w-[280px] mx-auto uppercase tracking-wide">
            By proceeding, you adhere to our{" "}
            <Link to="/terms" className="font-bold hover:text-gray-600 transition-colors">Terms</Link> and{" "}
            <Link to="/privacy" className="font-bold hover:text-gray-600 transition-colors">Privacy State</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
