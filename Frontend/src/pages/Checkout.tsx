import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ShoppingBag, ArrowLeft, Loader2, CheckCircle, Tag, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useFranchise } from "../contexts/FranchiseContext";
import { razorpayService } from "@/lib/api/razorpayService";
import { toast } from "sonner";

// Extend window to hold Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
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

  // Load Razorpay SDK on mount
  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  const finalTotal = couponApplied ? Math.max(0, total - couponApplied.discount) : total;

  const handlePayment = async () => {
    if (!scriptLoaded) {
      toast.error("Payment gateway is loading. Please wait.");
      return;
    }
    if (!user) {
      toast.error("Please log in to continue.");
      return;
    }

    setProcessing(true);
    try {
      // 1. Create order on backend
      const orderData = await razorpayService.createOrder(
        items.map((i) => i.course.id),
        finalTotal,
        couponApplied?.id
      );

      // 2. Open Razorpay checkout popup
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.orderId,
        name: branding?.lms_name || "LMS Platform",
        description: items.length === 1 ? items[0].course.title : `${items.length} Courses`,
        image: branding?.logo_url || undefined,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: branding?.primary_color || "#a435f0",
        },
        handler: async (response: any) => {
          try {
            // 3. Verify payment on backend
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-[#2d2f31]">
        <div className="w-24 h-24 bg-[#f7f9fa] rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-[#2d2f31]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Cart is Empty</h2>
        <p className="text-[#6a6f73] mb-6">Please add some courses first.</p>
        <Link to="/courses">
          <button className="bg-[#a435f0] text-white font-bold py-3 px-8 hover:bg-[#8710d8] transition-colors">
            Browse Courses
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#2d2f31]">
      {/* Header */}
      <div className="border-b border-[#d1d7dc] sticky top-0 bg-white z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/cart" className="flex items-center gap-2 text-[#a435f0] hover:text-[#8710d8] font-bold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#6a6f73]" />
            <span className="font-bold text-[#6a6f73] text-sm hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left Column - Order Details */}
          <div className="space-y-8">
            {/* Course Items */}
            <div>
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border border-[#d1d7dc] p-3">
                    <img
                      src={item.course.thumbnail_url || "/placeholder.png"}
                      alt={item.course.title}
                      className="w-20 h-14 object-cover bg-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm line-clamp-2">{item.course.title}</h4>
                      <p className="text-sm text-[#a435f0] font-bold mt-1">₹{item.course.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Info (display only - pre-filled from account) */}
            <div className="bg-[#f7f9fa] border border-[#d1d7dc] p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-bold text-sm">Billing to your account</span>
              </div>
              <p className="text-sm text-[#6a6f73]">{user?.name}</p>
              <p className="text-sm text-[#6a6f73]">{user?.email}</p>
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <p className="text-sm text-blue-700 font-semibold">💳 Powered by Razorpay</p>
              <p className="text-xs text-blue-600 mt-1">
                You'll be redirected to Razorpay's secure payment page. Supports UPI, Cards, Net Banking, Wallets & more.
              </p>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div>
            <div className="bg-[#f7f9fa] p-6 border border-[#d1d7dc] sticky top-24">
              <h2 className="text-xl font-bold mb-6">Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#2d2f31] text-sm">
                  <span className="font-bold">Original Price:</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span className="font-bold">Coupon ({couponApplied.code}):</span>
                    <span>-₹{couponApplied.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="h-px bg-[#d1d7dc] my-2" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Coupon Code */}
              {!couponApplied && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border border-[#d1d7dc] p-2 text-sm outline-none focus:border-[#2d2f31]"
                    />
                    <button
                      onClick={() => toast.info("Coupon support coming soon!")}
                      className="px-3 py-2 bg-white border border-[#2d2f31] text-sm font-bold hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" /> Apply
                    </button>
                  </div>
                </div>
              )}
              {couponApplied && (
                <div className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 p-2 text-sm">
                  <span className="text-green-700 font-bold">{couponApplied.code} applied ✓</span>
                  <button onClick={() => setCouponApplied(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="text-xs text-[#6a6f73] mb-6 text-center px-4">
                By completing your purchase you agree to our{" "}
                <Link to="/terms" className="underline text-[#a435f0]">Terms of Service</Link>.
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || !scriptLoaded}
                className="w-full py-4 bg-[#a435f0] text-white font-bold text-md hover:bg-[#8710d8] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Payment...
                  </>
                ) : !scriptLoaded ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Pay ₹${finalTotal.toLocaleString()} with Razorpay`
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6a6f73]">
                <Lock className="w-3 h-3" />
                <span>256-bit SSL secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
