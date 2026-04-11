import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFranchise } from "@/contexts/FranchiseContext";
import { ArrowLeft, Loader2, GraduationCap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import api from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { branding } = useFranchise();
  const { toast } = useToast();

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-primary/5 to-primary/10 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient Depth Background Blobs */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary opacity-[0.05] rounded-full blur-[100px] mix-blend-multiply pointer-events-none -z-10"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-[#a12e70] opacity-[0.04] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>

      <div className="w-full max-w-md glass-card bg-white/60 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 border border-gray-100/50 relative z-10">
        
        {/* Back Link */}
        <div className="mb-8 -mt-2">
          <Link 
            to="/login" 
            className="inline-flex items-center text-xs font-bold text-text-muted hover:text-primary transition-colors tracking-widest uppercase"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign in
          </Link>
        </div>

        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
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
              Retrieve Access
            </h1>
          </Link>
          {!submitted && (
            <p className="mt-3 text-sm text-text-muted text-center font-light">
              Enter your secure protocol to reset credentials.
            </p>
          )}
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Email Protocol</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-xl border border-gray-200 bg-white/70 px-4 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all shadow-sm"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            {/* Interactive Form Submit Button */}
            <button
              type="submit"
              ref={submitRef}
              onMouseMove={handleButtonMouseMove}
              disabled={isLoading}
              className="group relative w-full h-12 mt-8 rounded-xl overflow-hidden shadow-md flex items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
            >
              <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: primaryColor }}></div>
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
                    Transmitting...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </span>
            </button>
          </form>
        ) : (
          <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-6 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="headline-serif text-2xl font-light text-text-main mb-3">Transmission Sent</h2>
              <p className="text-text-muted mb-8 text-sm font-light leading-relaxed">
                We've routed a secure reset link to <br/>
                <span className="font-bold text-text-main">{email}</span>
              </p>
              
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full h-12 rounded-xl border border-gray-200 bg-white/50 text-text-main font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors shadow-sm"
              >
                Try Another Protocol
              </button>
          </div>
        )}
      </div>
    </div>
  );
}
