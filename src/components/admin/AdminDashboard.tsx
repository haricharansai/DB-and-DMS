import React, { useState, useEffect } from 'react';
import {
  Users,
  Store,
  DollarSign,
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Percent,
  Search,
  Eye,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { adminAPI, vendorsAPI } from '../../services/api';
import { Vendor, AdminMetrics } from '../../types';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [metRes, venRes] = await Promise.all([
        adminAPI.getMetrics(),
        vendorsAPI.getAll(),
      ]);
      if (metRes.data) setMetrics(metRes.data);
      if (venRes.data.vendors) setVendors(venRes.data.vendors);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateVendorStatus = async (vendorId: string, status: 'approved' | 'suspended' | 'pending') => {
    try {
      await adminAPI.updateVendorStatus(vendorId, status);
      fetchData();
    } catch (err) {
      console.error('Failed to update vendor status', err);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.businessName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.gstin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const chartData = [
    { name: 'Mon', gmv: 340000, commission: 34000 },
    { name: 'Tue', gmv: 520000, commission: 52000 },
    { name: 'Wed', gmv: 490000, commission: 49000 },
    { name: 'Thu', gmv: 710000, commission: 71000 },
    { name: 'Fri', gmv: 890000, commission: 89000 },
    { name: 'Sat', gmv: 1120000, commission: 112000 },
    { name: 'Sun', gmv: 1350000, commission: 135000 },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
              Platform Master Administration
            </h1>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Marketplace ecosystem governance, vendor onboarding KYC approval, and 10% commission revenue distribution
          </p>
        </div>

        <button
          onClick={() => onNavigate('compass')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
        >
          <Sliders className="w-4 h-4" />
          <span>Launch MongoDB Compass Studio</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Platform GMV',
            value: `₹${(metrics?.totalRevenue || 12840000).toLocaleString('en-IN')}`,
            sub: '+32.4% this month',
            icon: DollarSign,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
          },
          {
            label: 'Platform Commission (10%)',
            value: `₹${(metrics?.platformCommission || 1284000).toLocaleString('en-IN')}`,
            sub: 'Net platform fee',
            icon: Percent,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
          {
            label: 'Registered Merchants',
            value: metrics?.totalVendors || vendors.length,
            sub: '4 Pending KYC checks',
            icon: Store,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
          },
          {
            label: 'Total Orders Processed',
            value: metrics?.totalOrders || 482,
            sub: '99.2% Delivery SLA',
            icon: Package,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-heading">{kpi.value}</div>
              <div className="text-[11px] font-bold text-slate-400">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Financial Breakdown Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">GMV & Platform Cut Overview</h3>
            <p className="text-xs text-slate-500">Gross marketplace transaction flow vs 10% platform commission retained</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            Automated Settlement
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `₹${Number(val).toLocaleString('en-IN')}`,
                  name === 'gmv' ? 'Total Marketplace GMV' : 'Platform Fee (10%)'
                ]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="gmv" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="commission" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor KYC Approval & Status Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Merchant Onboarding & KYC Management</h3>
            <p className="text-xs text-slate-500">Review business registration documents, GSTIN codes, and grant marketplace selling rights</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vendor or GSTIN..."
                className="bg-slate-50 text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending KYC</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Merchant Business</th>
                <th className="p-3">GSTIN Code</th>
                <th className="p-3">Commission Cut</th>
                <th className="p-3">Dispatch SLA</th>
                <th className="p-3">KYC Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={v.logo} alt={v.businessName} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900">{v.businessName}</p>
                        <p className="text-[10px] text-slate-400">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700">{v.gstin}</td>
                  <td className="p-3 font-bold text-indigo-600">{v.commissionRate}%</td>
                  <td className="p-3 font-medium text-slate-600">{v.dispatchTime}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 w-max ${
                      v.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : v.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {v.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {v.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                      {v.status === 'suspended' && <XCircle className="w-3 h-3" />}
                      <span>{v.status}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {v.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateVendorStatus(v.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition shadow-2xs"
                        >
                          Approve KYC
                        </button>
                      )}
                      {v.status !== 'suspended' && (
                        <button
                          onClick={() => handleUpdateVendorStatus(v.id, 'suspended')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
