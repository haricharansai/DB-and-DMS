import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Copy,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Store,
  ArrowLeft,
  FileText,
  X
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { Order, VendorSubOrder } from '../../types';

interface OrderTrackingViewProps {
  orderId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orderId, onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const res = await ordersAPI.getAll();
        if (res.data.orders) {
          setOrders(res.data.orders);
          if (orderId) {
            const matched = res.data.orders.find(o => o.id === orderId);
            setSelectedOrder(matched || res.data.orders[0] || null);
          } else {
            setSelectedOrder(res.data.orders[0] || null);
          }
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [orderId]);

  const copyTrackingNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const advanceOrderStatus = async (subOrder: VendorSubOrder) => {
    if (!selectedOrder) return;
    const stages = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = stages.indexOf(subOrder.status);
    if (currentIdx < stages.length - 1) {
      const nextStatus = stages[currentIdx + 1];
      try {
        const res = await ordersAPI.updateStatus(selectedOrder.id, {
          status: nextStatus,
          vendorId: subOrder.vendorId
        });
        if (res.data.order) {
          setSelectedOrder(res.data.order);
        }
      } catch (e) {
        console.error('Status update failed', e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-md mx-auto my-12">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Orders Found</h2>
        <p className="text-xs text-slate-500">You have not placed any orders on MarketNexus yet.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Browse Catalog
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
            <span>Store</span>
          </button>
          <span>/</span>
          <span className="font-bold text-slate-900">Order #{selectedOrder.id}</span>
        </div>

        <button
          onClick={() => setIsInvoiceOpen(true)}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border border-slate-300"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>View Tax Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sub-Orders & Interactive Milestone Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {selectedOrder.subOrders?.map((subOrder, sIdx) => (
            <div
              key={subOrder.vendorId || sIdx}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Consignment Header */}
              <div className="bg-slate-900 text-white p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">{subOrder.vendorName} Consignment</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      {subOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Carrier: <strong className="text-slate-200">{subOrder.courier}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Tracking: <code className="text-amber-300 font-mono font-semibold">{subOrder.trackingNumber}</code>
                      <button
                        onClick={() => copyTrackingNumber(subOrder.trackingNumber)}
                        className="p-1 hover:text-white"
                        title="Copy tracking code"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                    {copiedTracking && <span className="text-emerald-400 text-[10px]">Copied!</span>}
                  </div>
                </div>

                {/* Simulation Control */}
                <button
                  onClick={() => advanceOrderStatus(subOrder)}
                  className="bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-indigo-400/40 transition"
                  title="Simulate dispatching package to next carrier milestone"
                >
                  Advance Status →
                </button>
              </div>

              {/* Interactive Milestone Stepper */}
              <div className="p-6 sm:p-8 space-y-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Delivery Timeline</h4>

                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {subOrder.milestones.map((m, mIdx) => (
                    <div key={mIdx} className="relative flex items-start gap-4">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition ${
                          m.completed
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : m.current
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}
                      >
                        {m.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>

                      <div className="space-y-0.5 flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <h5 className={`text-xs font-bold ${m.completed || m.current ? 'text-slate-900' : 'text-slate-400'}`}>
                            {m.label}
                          </h5>
                          {m.timestamp && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Items in this Consignment */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <h5 className="text-xs font-bold text-slate-800">Products in this Package:</h5>
                  <div className="divide-y divide-slate-100">
                    {subOrder.items.map((it) => (
                      <div key={it.productId} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img src={it.thumbnail} alt="thumb" className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1" />
                          <div>
                            <p className="font-bold text-slate-900">{it.title}</p>
                            <p className="text-[11px] text-slate-500">Quantity: {it.quantity} • Unit Price: ₹{it.price.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-900">₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Details & Address Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Shipping & Destination</h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedOrder.shippingAddress.fullName}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode}
                </p>
                <p className="text-slate-500 text-[11px]">Contact: {selectedOrder.shippingAddress.phone}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Order ID</span>
                  <span className="font-mono font-bold text-slate-900">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Status</span>
                  <span className="text-emerald-600 font-bold uppercase">{selectedOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount</span>
                  <span className="text-base font-extrabold text-slate-900">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Past Orders Switcher */}
          {orders.length > 1 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Other Recent Orders</h4>
              <div className="space-y-2">
                {orders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                      selectedOrder.id === ord.id
                        ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-mono">{ord.id}</p>
                      <p className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Official GST Tax Invoice
                </h3>
              </div>
              <button
                onClick={() => setIsInvoiceOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">MarketNexus India Pvt. Ltd.</p>
                  <p className="text-slate-500">GSTIN: 29AAACM1234F1Z8</p>
                  <p className="text-slate-500">Indiranagar, Bengaluru, KA 560038</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">Invoice #{selectedOrder.id}</p>
                  <p className="text-slate-500">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((it) => (
                      <tr key={it.productId}>
                        <td className="p-3 font-medium text-slate-800">{it.title}</td>
                        <td className="p-3 text-center">{it.quantity}</td>
                        <td className="p-3 text-right">₹{it.price.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-bold">₹{(it.price * it.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Integrated GST (18%):</span>
                  <span className="font-bold">₹{selectedOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-indigo-600 border-t border-slate-200 pt-2">
                  <span>Grand Total Paid:</span>
                  <span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsInvoiceOpen(false)}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
