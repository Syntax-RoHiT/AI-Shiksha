import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock, ShoppingBag, ArrowLeft, Loader2, CheckCircle,
  Tag, X, Shield, CreditCard, Smartphone, ArrowRight
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useFranchise } from "../contexts/FranchiseContext";
import { razorpayService } from "@/lib/api/razorpayService";
import { toast } from "sonner";
import Footer from "@/components/marketing/Footer";

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { branding } = useFranchise();

  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; id: string } | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  const finalTotal = couponApplied ? Math.max(0, total - couponApplied.discount) : total;

  const handlePayment = async () => {
    if (!scriptLoaded) { toast.error("Payment gateway is loading. Please wait."); return; }
    if (!user) { toast.error("Please log in to continue."); return; }

    setProcessing(true);
    try {
      const orderData = await razorpayService.createOrder(
        items.map((i) => i.course.id),
        finalTotal,
        couponApplied?.id
      );

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.orderId,
        name: branding?.lms_name || "LMS Platform",
        description: items.length === 1 ? items[0].course.title : `${items.length} Courses`,
        image: branding?.logo_url || undefined,
        prefill: { name: user.name, email: user.email },
        theme: { color: branding?.primary_color || "#a435f0" },
        handler: async (response: any) => {
          try {
            await razorpayService.verifyPayment({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            clearCart();
            toast.success("Payment successful! 🎉");
            navigate("/order-success");
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to initiate payment. Check Razorpay configuration.";
      toast.error(msg);
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fbfcfd] flex flex-col items-center justify-center p-6">
        <div className="glass-card bg-white/40 backdrop-blur-xl border border-gray-100/50 rounded-3xl p-16 text-center shadow-lg max-w-md animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/10 shadow-inner">
            <ShoppingBag className="w-10 h-10 text-primary opacity-50" />
          </div>
          <h2 className="headline-serif text-2xl text-text-main mb-3 font-light">Nothing to Checkout</h2>
          <p className="text-text-muted font-light mb-8">Your cart is empty. Add some courses before checking out.</p>
          <button
            onClick={() => navigate("/courses")}
            className="bg-primary hover:bg-primary/90 text-white tracking-widest uppercase text-xs font-bold py-3.5 px-8 rounded-full transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-text-main relative overflow-x-hidden flex flex-col">
      {/* Ambient Background */}
      <div className="absolute top-[0%] left-[20%] w-[600px] h-[600px] bg-primary opacity-[0.03] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-[#a12e70] opacity-[0.02] rounded-full blur-[100px] mix-blend-multiply pointer-events-none -z-10" />

      {/* Hero Header */}
      <div className="relative pt-24 pb-8 px-4 sm:px-6 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h1 className="headline-serif text-3xl sm:text-4xl lg:text-5xl font-light text-text-main tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
              Secure Checkout
            </h1>
            <span className="text-text-muted font-light text-sm tracking-widest uppercase">
              {items.length} {items.length === 1 ? "Program" : "Programs"} · ₹{finalTotal.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-primary hover:opacity-80 transition-opacity bg-white/50 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-200/50 shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Cart
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Order Items + Info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Course Items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-card bg-white/60 backdrop-blur-xl border border-gray-100/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-36 h-24 bg-primary/5 rounded-xl overflow-hidden relative border border-gray-100">
                  {item.course.thumbnail_url ? (
                    <img
                      src={item.course.thumbnail_url}
                      alt={item.course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-primary opacity-20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                  <div>
                    <h3 className="headline-serif text-base text-text-main line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {item.course.title}
                    </h3>
                    {item.course.instructor && (
                      <p className="text-xs text-text-muted font-light tracking-wide mt-1">
                        By {item.course.instructor.user.name}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100/50 pt-2">
                    <span className="text-[9px] tracking-widest uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Included
                    </span>
                    <span className="font-bold text-text-main text-lg tracking-tight">
                      {item.course.price > 0 ? `₹${item.course.price.toLocaleString()}` : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Account Info Card */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-gray-100/50 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] tracking-widest uppercase font-bold text-text-muted mb-3">Billing Identity</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-sm shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-text-main text-sm">{user?.name}</p>
                  <p className="text-xs text-text-muted font-light">{user?.email}</p>
                </div>
                <div className="ml-auto">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="glass-card bg-white/40 backdrop-blur-xl border border-gray-100/50 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] tracking-widest uppercase font-bold text-text-muted mb-3">Accepted via Razorpay</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: <CreditCard className="w-4 h-4" />, label: "Cards" },
                  { icon: <Smartphone className="w-4 h-4" />, label: "UPI" },
                  { icon: <Shield className="w-4 h-4" />, label: "NetBanking" },
                  { icon: <Tag className="w-4 h-4" />, label: "Wallets" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-text-muted font-light bg-white/60 border border-gray-100 rounded-full px-3 py-1.5">
                    <span className="text-primary">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card bg-white/70 backdrop-blur-2xl border border-primary/10 shadow-xl rounded-3xl p-8 sticky top-[100px]">
              <h3 className="text-[10px] tracking-widest uppercase font-bold text-text-muted mb-4">Payment Summary</h3>

              {/* Total Amount */}
              <div className="flex items-end gap-3 mb-1">
                <h2 className="headline-serif text-5xl font-light text-text-main tracking-tight">
                  ₹{finalTotal.toLocaleString()}
                </h2>
              </div>
              <div className="flex items-center gap-2 mb-8">
                <p className="text-sm text-text-muted line-through font-light">₹{(total * 2).toLocaleString()}</p>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">50% off</span>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-text-muted font-light">
                  <span>Original Price</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-600 font-light">
                    <span>Coupon ({couponApplied.code})</span>
                    <span>-₹{couponApplied.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-text-main">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processing || !scriptLoaded}
                className="w-full bg-primary text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 mb-5 group hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Opening Payment...</>
                ) : !scriptLoaded ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading Gateway...</>
                ) : (
                  <>
                    Pay ₹{finalTotal.toLocaleString()}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted tracking-wide mb-6">
                <Lock className="w-3 h-3" />
                <span>256-bit SSL · Secured by Razorpay</span>
              </div>

              {/* Coupon Code */}
              <div className="border-t border-gray-100/50 pt-6">
                <p className="text-[10px] tracking-widest uppercase font-bold text-text-muted mb-3 ml-1">Promotional Code</p>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                    <span className="text-emerald-700 font-bold">{couponApplied.code} ✓</span>
                    <button onClick={() => setCouponApplied(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Access Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm font-light transition-all shadow-sm"
                    />
                    <button
                      onClick={() => toast.info("Coupon support coming soon!")}
                      className="bg-text-main text-white font-bold tracking-widest text-[10px] uppercase px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Terms */}
              <p className="text-[10px] text-text-muted font-light text-center mt-5 leading-relaxed">
                By completing your purchase you agree to our{" "}
                <Link to="/terms" className="underline text-primary">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
