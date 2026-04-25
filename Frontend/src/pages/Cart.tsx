import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  Star
} from "lucide-react";
import Footer from "@/components/marketing/Footer";

export default function Cart() {
  const navigate = useNavigate();
  const { items, total, removeFromCart, loading } = useCart();

  const handleRemoveItem = async (courseId: string) => {
    await removeFromCart(courseId);
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-text-main relative overflow-x-hidden flex flex-col">
      {/* Ambient Background Depth */}
      <div className="absolute top-[0%] left-[20%] w-[600px] h-[600px] bg-primary opacity-[0.03] rounded-full blur-[120px] mix-blend-multiply pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-[#a12e70] opacity-[0.02] rounded-full blur-[100px] mix-blend-multiply pointer-events-none -z-10"></div>

      {/* Hero Header */}
      <div className="relative pt-24 pb-8 px-4 sm:px-6 z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                  <h1 className="headline-serif text-3xl sm:text-4xl lg:text-5xl font-light text-text-main tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      Your Cart
                  </h1>
                  <span className="text-text-muted font-light text-sm tracking-widest uppercase">
                    {items.length} {items.length === 1 ? "Program Pending" : "Programs Pending"}
                  </span>
              </div>
              <button
                onClick={() => navigate("/courses")}
                className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-primary hover:opacity-80 transition-opacity bg-white/50 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-200/50 shadow-sm"
              >
                <ArrowLeft className="w-3 h-3" />
                Return to Ecosystem
              </button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full z-10">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="glass-card bg-white/40 backdrop-blur-xl border border-gray-100/50 rounded-3xl p-16 text-center shadow-lg max-w-2xl mx-auto mt-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/10 shadow-inner">
              <ShoppingBag className="w-10 h-10 text-primary opacity-50" />
            </div>
            <h2 className="headline-serif text-2xl text-text-main mb-3 font-light">Void Space Detected</h2>
            <p className="text-text-muted font-light max-w-md mx-auto mb-10 leading-relaxed">
              Your cart is currently empty. Explore our curriculum to discover premium learning pathways crafted for your architecture.
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="bg-primary hover:bg-primary/90 text-white tracking-widest uppercase text-xs font-bold py-3.5 px-8 rounded-full transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              Browse Curriculum
            </button>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-gray-100/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-full sm:w-40 h-28 bg-primary/5 rounded-xl overflow-hidden relative border border-gray-100">
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

                  {/* Course Info */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="headline-serif text-lg text-text-main line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {item.course.title}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.course.id)}
                          className="bg-white/80 p-2 rounded-full shadow-sm text-text-muted hover:text-red-500 hover:bg-red-50 transition-all border border-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {item.course.instructor && (
                        <div className="flex items-center gap-2 mt-2">
                           <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-primary text-[10px] font-bold border border-gray-100 shadow-sm">
                              {item.course.instructor.user.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs text-text-muted font-light tracking-wide">
                            {item.course.instructor.user.name}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 text-xs font-light tracking-wide text-text-muted">
                        <span className="font-bold text-yellow-500">4.5</span>
                         <div className="flex">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <span className="bg-primary/10 tracking-widest uppercase text-[8px] text-primary font-bold px-2 py-0.5 rounded-full ml-2">Bestseller</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100/50 pt-3">
                        <button className="text-[10px] tracking-widest uppercase font-bold text-text-muted hover:text-text-main transition-colors">Move to wishlist</button>
                        <div className="text-right flex items-center gap-3">
                            <span className="text-xs text-text-muted line-through font-light">₹{(item.course.price * 2).toLocaleString()}</span>
                            {item.course.price > 0 ? (
                            <span className="font-bold text-text-main text-lg tracking-tight">
                                ₹{item.course.price.toLocaleString()}
                            </span>
                            ) : (
                            <span className="font-bold text-emerald-600 text-sm tracking-widest uppercase">Free</span>
                            )}
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-card bg-white/70 backdrop-blur-2xl border border-primary/10 shadow-xl rounded-3xl p-8 sticky top-[100px]">
                <h3 className="text-[10px] tracking-widest uppercase font-bold text-text-muted mb-4">Total Manifest</h3>
                <div className="flex items-end gap-3 mb-1">
                    <h2 className="headline-serif text-5xl font-light text-text-main tracking-tight">₹{total.toLocaleString()}</h2>
                </div>
                <div className="flex items-center gap-2 mb-8">
                    <p className="text-sm text-text-muted line-through font-light">₹{(total * 2).toLocaleString()}</p>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">50% off</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 mb-6 group hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Checkout Protocol
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="pt-6 border-t border-gray-100/50">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-text-muted mb-3 ml-1">Promotional Override</p>
                  <p className="text-xs text-text-muted mb-3">You can apply your promotional code during checkout.</p>
                  <button onClick={handleCheckout} className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline">
                    Proceed to enter code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
