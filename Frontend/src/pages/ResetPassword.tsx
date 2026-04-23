import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFranchise } from "@/contexts/FranchiseContext";
import { ArrowLeft, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import api from "@/lib/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const { branding } = useFranchise();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "The password reset link is invalid or missing.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "Your passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", { token, password });
      toast({
        title: "Password Reset Successful",
        description: "You can now sign in with your new password.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || "Something went wrong. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = branding.primary_color || "#2d2f31";

  return (
    <div 
      className="min-h-screen font-sans flex items-center justify-center p-4 sm:p-8 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: `url('/landing_page/auth_dark_cloud_bg.png')` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-[440px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[32px] p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Back Link */}
        <div className="absolute top-8 left-8">
          <Link 
            to="/login" 
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
              <KeyRound className="h-6 w-6 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create New Password
          </h1>
          <p className="mt-3 text-sm text-zinc-400 font-medium leading-relaxed max-w-[280px]">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 pr-12 focus:bg-white/10 focus:ring-2 focus:ring-offset-0 transition-all shadow-sm placeholder:text-zinc-500 font-medium text-white"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-full"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-14 mt-4 rounded-2xl shadow-[0_4px_14px_0_rgba(163,255,18,0.15)] flex items-center justify-center transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#A3FF12] via-[#b5ff40] to-[#A3FF12] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-bold text-[15px] tracking-wide"
            >
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
            </button>
        </form>
      </div>
    </div>
  );
}
