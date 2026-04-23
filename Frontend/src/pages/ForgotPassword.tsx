import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFranchise } from "@/contexts/FranchiseContext";
import { ArrowLeft, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import api from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { branding } = useFranchise();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast({
        title: "Check your email",
        description: "If an account exists, a reset link has been sent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
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
            Reset Password
          </h1>
          {!submitted && (
            <p className="mt-3 text-sm text-zinc-400 font-medium leading-relaxed max-w-[280px]">
              Enter your email address and we will send you a link to reset your password.
            </p>
          )}
        </div>

        {!submitted ? (
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 mt-4 rounded-2xl shadow-[0_4px_14px_0_rgba(163,255,18,0.15)] flex items-center justify-center transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#A3FF12] via-[#b5ff40] to-[#A3FF12] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-bold text-[15px] tracking-wide"
            >
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#A3FF12]/20 mx-auto mb-6 border border-[#A3FF12]/30 shadow-sm backdrop-blur-sm">
                <CheckCircle2 className="h-8 w-8 text-[#A3FF12]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Check your email</h2>
              <p className="text-zinc-400 mb-8 text-sm font-medium leading-relaxed">
                We've routed a secure reset link to <br/>
                <span className="font-bold text-white">{email}</span>
              </p>
              
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 text-white font-medium text-[15px] hover:bg-white/10 transition-colors shadow-sm focus:ring-2 focus:ring-offset-0 focus:ring-[#A3FF12]/50"
              >
                Try another email
              </button>
          </div>
        )}
      </div>
    </div>
  );
}
