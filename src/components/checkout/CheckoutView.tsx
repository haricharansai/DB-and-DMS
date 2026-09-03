import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  MapPin,
  Plus,
  QrCode,
  Building,
  Banknote,
  ArrowLeft,
  Store
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../services/api';
import { Address } from '../../types';

interface CheckoutViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onNavigate }) => {
  const { cartItems, vendorGroups, grandTotal, subtotal, shippingTotal, tax, discount, clearCart } = useCart();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr_1');
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Address form
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newStreet, setNewStreet] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('Bengaluru');
  const [newState, setNewState] = useState<string>('Karnataka');
  const [newZipCode, setNewZipCode] = useState<string>('560038');

  // Payment selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('•••');
  const [cardHolder, setCardHolder] = useState<string>(user?.name || 'Aarav Patel');
  const [upiId, setUpiId] = useState<string>('aarav.patel@okhdfcbank');

  const addresses: Address[] = user?.savedAddresses || [
    {
      id: 'addr_1',
      fullName: user?.name || 'Aarav Patel',
      phone: '+91 98765 43210',
      street: 'Flat 402, Skyline Residency, 100 Feet Rd, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      isDefault: true
    }
  ];

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newStreet || !newCity) return;
    const newAddr: Address = {
      id: 'addr_' + Date.now(),
      fullName: newFullName,
      phone: newPhone || '+91 98765 43210',
      street: newStreet,
      city: newCity,
      state: newState,
      zipCode: newZipCode
    };
    addresses.push(newAddr);
    setSelectedAddressId(newAddr.id);
    setIsAddingAddress(false);
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    try {
      setIsPlacingOrder(true);
      const res = await ordersAPI.create({
        items: cartItems.map(it => ({
          productId: it.productId,
          title: it.product.title,
          price: it.product.price,
          quantity: it.quantity,
          selectedColor: it.selectedColor,
          thumbnail: it.product.thumbnail,
          vendorId: it.vendorId,
          vendorName: it.vendorName
        })),
        shippingAddress: selectedAddress,
        paymentMethod
      });

      if (res.data && res.data.order) {
        // Confetti explosion celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        clearCart();
        onNavigate('order-tracking', res.data.order.id);
      }
    } catch (err) {
      console.error('Failed to create order', err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-4 max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-slate-900">No items in checkout</h2>
        <button
          onClick={() => onNavigate('catalog')}
          className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => onNavigate('cart')} className="flex items-center gap-1 hover:text-indigo-600 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </button>
        <span>/</span>
        <span className="font-bold text-slate-900">Multi-Step Secure Checkout</span>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, title: 'Shipping Address' },
            { num: 2, title: 'Delivery Method' },
            { num: 3, title: 'Payment Method' },
            { num: 4, title: 'Review & Pay' },
          ].map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition ${
                    currentStep === step.num
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-4 ring-indigo-50'
                      : currentStep > step.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > step.num ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${currentStep === step.num ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > idx + 1 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Step Contents */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: SHIPPING ADDRESS */}
          {currentStep === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">1. Select Delivery Address</h2>
                  <p className="text-xs text-slate-500">Your order will be dispatched to this location</p>
                </div>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Add New Address Form */}
              {isAddingAddress && (
                <form onSubmit={handleSaveNewAddress} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800">Add New Shipping Location</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newFullName}
                      onChange={e => setNewFullName(e.target.value)}
                      className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Mobile Phone Number"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Street, Flat No, Landmark"
                      value={newStreet}
                      onChange={e => setNewStreet(e.target.value)}
                      className="sm:col-span-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="State"
                        value={newState}
                        onChange={e => setNewState(e.target.value)}
                        className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={newZipCode}
                        onChange={e => setNewZipCode(e.target.value)}
                        className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="text-xs font-semibold px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl"
                    >
                      Save & Select Address
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Address Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 relative ${
                      selectedAddressId === addr.id
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {selectedAddressId === addr.id && (
                      <span className="absolute top-3 right-3 text-indigo-600">
                        <CheckCircle2 className="w-4 h-4 fill-indigo-600 text-white" />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{addr.fullName}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xs transition"
                >
                  <span>Continue to Delivery Options</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY OPTIONS */}
          {currentStep === 2 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-heading">2. Multi-Vendor Consignment Dispatch</h2>
                <p className="text-xs text-slate-500">Each vendor packs and ships their items directly</p>
              </div>

              <div className="space-y-4">
                {vendorGroups.map((g) => (
                  <div key={g.vendorId} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">{g.vendorName}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        {g.shippingFee === 0 ? 'FREE Express Delivery' : `₹${g.shippingFee} Standard Shipping`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Dispatched via <strong>FedEx Priority Air</strong>. Estimated delivery within 24-48 business hours.
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-xl"
                >
                  ← Back to Address
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xs transition"
                >
                  <span>Continue to Payment Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {currentStep === 3 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-heading">3. Choose Payment Method</h2>
                <p className="text-xs text-slate-500">Encrypted transactions secured with banking-grade protocols</p>
              </div>

              {/* Payment Type Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                  { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
                  { id: 'netbanking', label: 'NetBanking', icon: Building },
                  { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 text-center transition ${
                        paymentMethod === m.id
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Card Inputs Simulation */}
              {paymentMethod === 'card' && (
                <div className="bg-slate-950 text-white p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>VIRTUAL CARD PREVIEW</span>
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="font-mono text-lg font-bold tracking-widest text-slate-200">{cardNumber}</div>
                  <div className="flex justify-between text-xs pt-2">
                    <div>
                      <p className="text-slate-400 text-[10px]">CARD HOLDER</p>
                      <p className="font-bold">{cardHolder}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">EXPIRES</p>
                      <p className="font-bold">{cardExpiry}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI ID Simulation */}
              {paymentMethod === 'upi' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <label className="text-xs font-bold text-slate-700">Enter your UPI VPA / Handle</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    A collect request will be sent to your Google Pay / PhonePe / Paytm mobile app.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xs transition"
                >
                  <span>Review Final Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PLACE ORDER */}
          {currentStep === 4 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-heading">4. Review & Confirm Order</h2>
                <p className="text-xs text-slate-500">Please verify your items and shipping details before final payment</p>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-3 divide-y divide-slate-100">
                {cartItems.map((it) => (
                  <div key={it.productId} className="pt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={it.product.thumbnail} alt="t" className="w-10 h-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200" />
                      <div>
                        <h4 className="font-bold text-slate-900">{it.product.title}</h4>
                        <p className="text-slate-500 text-[11px]">Qty: {it.quantity} • Sold by {it.vendorName}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">₹{(it.product.price * it.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">Deliver To:</p>
                <p className="text-slate-600">{selectedAddress.fullName} • {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.zipCode}</p>
                <p className="text-slate-500 text-[11px]">Payment Mode: <strong className="uppercase">{paymentMethod}</strong></p>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-xl"
                >
                  ← Modify Payment
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition transform hover:scale-105"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isPlacingOrder ? 'Processing Payment...' : `Pay ₹${grandTotal.toLocaleString('en-IN')} & Place Order`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-4 space-y-4 sticky top-28">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Order Total</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Direct Shipping</span>
                <span className="font-bold text-slate-900">
                  {shippingTotal === 0 ? <span className="text-emerald-600">FREE</span> : `₹${shippingTotal}`}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>18% GST</span>
                <span className="font-bold text-slate-900">₹{tax.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900 font-heading">Total Payable</span>
                <span className="text-xl font-extrabold text-indigo-600 font-heading">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
