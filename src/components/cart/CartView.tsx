import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
  Tag,
  ArrowRight,
  Store,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ onNavigate }) => {
  const {
    cartItems,
    vendorGroups,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    shippingTotal,
    tax,
    discount,
    grandTotal,
    couponCode,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponFeedback(res);
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-4 max-w-lg mx-auto my-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-heading">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore curated electronics, laptops, and studio audio from our verified vendors!
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition"
        >
          <span>Start Shopping Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => onNavigate('catalog')} className="flex items-center gap-1 hover:text-indigo-600 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <span>/</span>
          <span className="font-bold text-slate-900">Multi-Vendor Cart</span>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vendor Grouped Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-indigo-900">
            <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold">Multi-Vendor Direct Fulfillment</p>
              <p className="text-slate-600 text-[11px]">
                Items from different sellers are packed and dispatched in individual consignments directly to your doorstep.
              </p>
            </div>
          </div>

          {vendorGroups.map((group) => (
            <div
              key={group.vendorId}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Vendor Header */}
              <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{group.vendorName}</h3>
                    <p className="text-[10px] text-slate-500">Verified Marketplace Partner</p>
                  </div>
                </div>

                <div className="text-xs">
                  {group.shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Free Shipping (Order &gt; ₹1,000)
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      Shipping Fee: <strong className="text-slate-900">₹{group.shippingFee}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Items in this Vendor Group */}
              <div className="p-6 divide-y divide-slate-100 space-y-4">
                {group.items.map((item, idx) => (
                  <div key={item.productId} className={`${idx > 0 ? 'pt-4' : ''} flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.title}
                        className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{item.product.brand}</span>
                        <h4
                          onClick={() => onNavigate('product-detail', item.productId)}
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate cursor-pointer"
                        >
                          {item.product.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {item.selectedColor && (
                            <span>Color: <strong className="text-slate-700">{item.selectedColor}</strong></span>
                          )}
                          <span>•</span>
                          <span>Unit Price: ₹{item.product.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg text-xs font-bold transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg text-xs font-bold transition"
                        >
                          +
                        </button>
                      </div>

                      {/* Total for item */}
                      <div className="text-right min-w-[90px]">
                        <p className="text-sm font-extrabold text-slate-900">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          {/* Coupon Code Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Apply Promo Coupon</span>
            </h4>

            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-800">{appliedCoupon}</span>
                  <p className="text-[10px] text-emerald-600 font-medium">Coupon active & applied</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="Try NEXUSFEST or SAVE10"
                    className="flex-1 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
                  >
                    Apply
                  </button>
                </div>
                {couponFeedback && (
                  <p className={`text-[11px] font-medium ${couponFeedback.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {couponFeedback.message}
                  </p>
                )}
              </form>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Available coupons: <strong>NEXUSFEST</strong> (15% off), <strong>SAVE10</strong></span>
            </div>
          </div>

          {/* Sticky Order Summary Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Order Summary</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Cart Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Multi-Vendor Shipping</span>
                <span className="font-bold text-slate-900">
                  {shippingTotal === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `₹${shippingTotal}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Estimated Taxes (18% GST)</span>
                <span className="font-bold text-slate-900">₹{tax.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Festival Promo Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-slate-900 font-heading">Grand Total</span>
                  <p className="text-[10px] text-slate-400">Includes all GST & charges</p>
                </div>
                <span className="text-2xl font-extrabold text-slate-900 font-heading">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('checkout')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition transform hover:-translate-y-0.5"
            >
              <span>Proceed to Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" /> 7-Day Replacement
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
