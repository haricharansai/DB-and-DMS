import React from 'react';
import { Store, ShieldCheck, Truck, RefreshCw, Headphones, Database, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenCompass: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCompass }) => {
  const { user, openAuthModal } = useAuth();

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
              <p className="text-[11px] text-slate-400">Shipped directly from verified merchant warehouses</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">KYC Verified Merchants</h4>
              <p className="text-[11px] text-slate-400">GSTIN audited sellers with buyer protection</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">JWT Secured Sessions</h4>
              <p className="text-[11px] text-slate-400">bcrypt encrypted passwords & bearer tokens</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">MongoDB Database</h4>
              <p className="text-[11px] text-slate-400">Synced MongoDB collections & query engine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight font-heading">
              Market<span className="text-indigo-400">Nexus</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-vendor e-commerce platform built with React, Express, MongoDB, and Tailwind CSS.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Categories</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('catalog', 'electronics')} className="hover:text-indigo-400 transition">
                Audio & Noise Cancellation
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'laptops')} className="hover:text-indigo-400 transition">
                Laptops & M3 Max Pro
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'smartphones')} className="hover:text-indigo-400 transition">
                5G Flagship Smartphones
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'cameras')} className="hover:text-indigo-400 transition">
                Full-Frame Cinema Cameras
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
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Services & Portals</h4>
          <ul className="space-y-2 text-xs">
            {user?.role === 'vendor' ? (
              <li>
                <button onClick={() => onNavigate('vendor-dashboard')} className="hover:text-amber-400 font-bold transition">
                  Vendor Dashboard
                </button>
              </li>
            ) : user?.role === 'admin' ? (
              <li>
                <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-indigo-400 font-bold transition">
                  Admin Console
                </button>
              </li>
            ) : (
              <li>
                <button onClick={() => openAuthModal('register')} className="hover:text-amber-400 transition">
                  Sell on MarketNexus
                </button>
              </li>
            )}
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
