import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Loader2, Eye, EyeOff, GraduationCap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const submitRef = useRef<HTMLButtonElement>(null);
  const { login } = useAuth();
  const { branding } = useFranchise();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      localStorage.removeItem("lms_token");
      const success = await login(email, password);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-primary/5 to-primary/10 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient Depth Background Blobs */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary opacity-[0.05] rounded-full blur-[100px] mix-blend-multiply pointer-events-none -z-10"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-[#a12e70] opacity-[0.04] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>

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
              Welcome Back
            </h1>
          </Link>
          <p className="mt-3 text-sm text-text-muted text-center font-light">
            Securely access your professional workspace.
          </p>
        </div>

        {/* Form */}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-text-muted">Security Key</Label>
              <Link 
                to="/forgot-password" 
                className="text-xs font-bold hover:underline transition-colors"
                style={{ color: primaryColor }}
              >
                Reset Access?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your security key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 h-12 rounded-xl border border-gray-200 bg-white/70 px-4 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all shadow-sm"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
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
          </div>

          {/* Interactive Form Submit Button */}
          <button
            type="submit"
            ref={submitRef}
            onMouseMove={handleButtonMouseMove}
            disabled={isLoading}
            className="group relative w-full h-12 mt-8 rounded-xl overflow-hidden shadow-md flex items-center justify-center transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
          >
            <div className="absolute inset-0 transition-colors" style={{ backgroundColor: primaryColor }}></div>
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
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center pt-6 border-t border-gray-200/50">
          <p className="text-sm font-light text-text-muted">
            New to the ecosystem?{" "}
            <Link 
              to="/signup" 
              className="font-bold hover:underline transition-colors ml-1"
              style={{ color: primaryColor }}
            >
              Initialize Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
