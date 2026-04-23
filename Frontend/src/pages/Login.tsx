import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Loader2, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { branding } = useFranchise();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
      {/* Background ambient overlay if needed (optional) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

      {/* Glassmorphic Card */}
      <div className="w-full max-w-[440px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[32px] p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Back Link */}
        <div className="absolute top-8 left-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-xs font-bold text-zinc-400 hover:text-white transition-colors tracking-widest uppercase"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        {/* Branding & Header */}
        <div className="flex flex-col items-center mt-6 mb-10 text-center">
          <div className="bg-white/10 shadow-sm rounded-2xl w-14 h-14 flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
            {branding.logo_url ? (
              <img 
                src={getImageUrl(branding.logo_url)} 
                alt={`${branding.name} Logo`} 
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <LogIn className="h-6 w-6 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Sign in with email
          </h1>
          <p className="mt-3 text-sm text-zinc-400 font-medium leading-relaxed max-w-[280px]">
            Securely access your workspace. Bring your learning, data, and teams together.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 focus:bg-white/10 focus:ring-2 focus:ring-offset-0 transition-all shadow-sm placeholder:text-zinc-500 font-medium text-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 pr-12 focus:bg-white/10 focus:ring-2 focus:ring-offset-0 transition-all shadow-sm placeholder:text-zinc-500 font-medium text-white"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-full"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Remember Me and Forgot Password Container */}
            <div className="flex items-center justify-between pt-2 px-1">
              <label
                htmlFor="remember-me"
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="relative flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#A3FF12] focus:ring-[#A3FF12] focus:ring-offset-black transition-colors"
                  />
                </div>
                <span className="text-[13px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>
              
              <Link 
                to="/forgot-password" 
                className="text-[13px] font-medium text-[#A3FF12] hover:text-[#b5ff40] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 mt-4 rounded-2xl shadow-[0_4px_14px_0_rgba(163,255,18,0.15)] flex items-center justify-center transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#A3FF12] via-[#b5ff40] to-[#A3FF12] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-bold text-[15px] tracking-wide"
          >
            {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                  Authenticating...
                </>
              ) : (
                "Get Started"
              )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-zinc-400">
            New to the ecosystem?{" "}
            <Link 
              to="/signup" 
              className="font-semibold text-[#A3FF12] hover:text-[#b5ff40] hover:underline transition-all"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
