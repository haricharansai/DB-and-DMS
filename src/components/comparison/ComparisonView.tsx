import React from 'react';
import {
  GitCompare,
  X,
  ShoppingBag,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trash2
} from 'lucide-react';
import { useComparison } from '../../context/ComparisonContext';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface ComparisonViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onNavigate }) => {
  const {
    compareItems,
    removeFromCompare,
    clearCompare,
    highlightDifferences,
    setHighlightDifferences,
  } = useComparison();

  const { addToCart } = useCart();

  if (compareItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
          <GitCompare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-heading">No Products in Comparison Matrix</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Select up to 4 products across the catalog to compare technical specifications, battery life, weight, codecs, and vendor pricing side by side.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition"
        >
          <span>Browse Products to Compare</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Gather all unique spec keys across compared items
  const allSpecKeys: string[] = Array.from(
    new Set(compareItems.flatMap(p => Object.keys(p.specs || {})))
  );

  // Check if a spec value differs among all compared products
  const isDiff = (key: string) => {
    if (compareItems.length <= 1) return false;
    const firstVal = compareItems[0].specs?.[key] || 'N/A';
    return compareItems.some(p => (p.specs?.[key] || 'N/A') !== firstVal);
  };

  const isPriceDiff = () => {
    if (compareItems.length <= 1) return false;
    return compareItems.some(p => p.price !== compareItems[0].price);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Comparison Top Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Product Specifications Comparison
            </h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {compareItems.length} of 4 Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side technical matrix with real-time differences highlighting
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Highlight Differences Toggle */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition">
            <input
              type="checkbox"
              checked={highlightDifferences}
              onChange={(e) => setHighlightDifferences(e.target.checked)}
              className="accent-indigo-600 rounded w-3.5 h-3.5"
            />
            <span>Highlight Differences</span>
          </label>

          <button
            onClick={clearCompare}
            className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Matrix</span>
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          {/* Sticky Products Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="p-4 w-48 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Product Details
              </th>
              {compareItems.map((prod) => (
                <th key={prod.id} className="p-4 min-w-[220px] max-w-[280px] align-top">
                  <div className="space-y-3 relative">
                    <button
                      onClick={() => removeFromCompare(prod.id)}
                      className="absolute -top-2 -right-2 p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-full shadow-xs transition"
                      title="Remove from comparison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div
                      onClick={() => onNavigate('product-detail', prod.id)}
                      className="h-32 bg-white rounded-xl p-2 border border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                      <img src={prod.thumbnail} alt={prod.title} className="max-h-full object-contain" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{prod.brand}</span>
                      <h4
                        onClick={() => onNavigate('product-detail', prod.id)}
                        className="text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-indigo-600"
                      >
                        {prod.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span className="font-bold">{prod.rating}</span>
                        <span className="text-slate-400">({prod.reviewsCount})</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </div>

                      <button
                        onClick={() => addToCart(prod)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {/* Price Row */}
            <tr className={highlightDifferences && isPriceDiff() ? 'bg-amber-50/60' : ''}>
              <td className="p-4 font-bold text-slate-600">Price (INR)</td>
              {compareItems.map((prod) => (
                <td key={prod.id} className="p-4 font-extrabold text-slate-900">
                  ₹{prod.price.toLocaleString('en-IN')}
                </td>
              ))}
            </tr>

            {/* Vendor & Fulfillment */}
            <tr>
              <td className="p-4 font-bold text-slate-600">Sold By Vendor</td>
              {compareItems.map((prod) => (
                <td key={prod.id} className="p-4">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-800">{prod.vendorName}</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Stock Availability */}
            <tr>
              <td className="p-4 font-bold text-slate-600">Inventory Status</td>
              {compareItems.map((prod) => (
                <td key={prod.id} className="p-4 font-medium text-emerald-600">
                  In Stock ({prod.stock} units)
                </td>
              ))}
            </tr>

            {/* Dynamic Specs Rows */}
            {allSpecKeys.map((key) => {
              const differs = isDiff(key);
              return (
                <tr key={key} className={highlightDifferences && differs ? 'bg-amber-50/60' : ''}>
                  <td className="p-4 font-bold text-slate-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </td>
                  {compareItems.map((prod) => (
                    <td key={prod.id} className="p-4 text-slate-800">
                      {prod.specs?.[key] || (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Floating Bottom Comparison Bar across all browsing views
export const FloatingComparisonBar: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { compareItems, removeFromCompare, clearCompare } = useComparison();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 max-w-4xl w-[92%] sm:w-auto animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-xs font-bold">
        <GitCompare className="w-4 h-4 text-indigo-400" />
        <span className="hidden sm:inline">Compare ({compareItems.length}/4):</span>
      </div>

      <div className="flex items-center gap-2">
        {compareItems.map((prod) => (
          <div key={prod.id} className="relative group">
            <img
              src={prod.thumbnail}
              alt={prod.title}
              className="w-9 h-9 rounded-lg bg-white p-0.5 object-contain border border-slate-600"
            />
            <button
              onClick={() => removeFromCompare(prod.id)}
              className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 transition"
              title="Remove"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('comparison')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition whitespace-nowrap"
        >
          Compare Now →
        </button>

        <button
          onClick={clearCompare}
          className="text-slate-400 hover:text-white p-1"
          title="Clear all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
