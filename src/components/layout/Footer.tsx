import React from 'react';
import { Store, ShieldCheck, Truck, RefreshCw, Headphones, Database, Lock, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenCompass: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCompass }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm mt-16">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Direct Vendor Fulfillment</h4>
              <p className="text-slate-400 text-xs">Express courier dispatch via FedEx & BlueDart</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Verified Sellers Only</h4>
              <p className="text-slate-400 text-xs">GST & PAN KYC verification on all merchants</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Secure JWT & Escrow</h4>
              <p className="text-slate-400 text-xs">Bcrypt hashed sessions & protected payments</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">MongoDB Compass Live</h4>
              <p className="text-slate-400 text-xs">Full REST API and live BSON schema studio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Store className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white font-heading">
              Market<span className="text-indigo-400">Nexus</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-sm">
            High-performance multi-vendor e-commerce platform built on modern Node.js, Express.js REST APIs, MongoDB Compass querying, and React with JWT session security.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCompass}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Launch MongoDB Studio</span>
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Categories</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('catalog', 'electronics')} className="hover:text-indigo-400 transition">
                Electronics & Audio
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'laptops')} className="hover:text-indigo-400 transition">
                Laptops & Computing
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'smartphones')} className="hover:text-indigo-400 transition">
                Smartphones & Wearables
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'cameras')} className="hover:text-indigo-400 transition">
                Cameras & Optics
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'workspace')} className="hover:text-indigo-400 transition">
                Ergonomic Workspaces
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Merchant Ecosystem</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('vendor-dashboard')} className="hover:text-indigo-400 transition">
                Vendor Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-indigo-400 transition">
                KYC Verification Portal
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('comparison')} className="hover:text-indigo-400 transition">
                Side-by-Side Comparison
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('orders')} className="hover:text-indigo-400 transition">
                Live Order Journey
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Stack & Architecture</h4>
          <ul className="space-y-2 text-xs text-slate-400 font-mono text-[11px]">
            <li>React 19 + TypeScript</li>
            <li>Express.js + REST API</li>
            <li>MongoDB BSON Engine</li>
            <li>JWT & Bcrypt.js Auth</li>
            <li>Axios Interceptors</li>
          </ul>
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="bg-slate-950 py-4 px-4 sm:px-6 border-t border-slate-800 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} MarketNexus Inc. All rights reserved. Multi-Vendor Platform Architecture.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> REST API Live
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> MongoDB Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
