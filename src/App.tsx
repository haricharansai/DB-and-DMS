import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/home/HomeView';
import { CatalogView } from './components/catalog/CatalogView';
import { ProductDetailView } from './components/product/ProductDetailView';
import { ComparisonView, FloatingComparisonBar } from './components/comparison/ComparisonView';
import { CartView } from './components/cart/CartView';
import { CheckoutView } from './components/checkout/CheckoutView';
import { OrderTrackingView } from './components/tracking/OrderTrackingView';
import { VendorDashboard } from './components/vendor/VendorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MongoCompassView } from './components/compass/MongoCompassView';
import { AuthModal } from './components/auth/AuthModal';

function AppContent() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView onNavigate={handleNavigate} />
        )}

        {currentView === 'catalog' && (
          <CatalogView initialFilter={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'product-detail' && (
          <ProductDetailView productId={viewParam || 'prod_1'} onNavigate={handleNavigate} />
        )}

        {currentView === 'comparison' && (
          <ComparisonView onNavigate={handleNavigate} />
        )}

        {currentView === 'cart' && (
          <CartView onNavigate={handleNavigate} />
        )}

        {currentView === 'checkout' && (
          <CheckoutView onNavigate={handleNavigate} />
        )}

        {currentView === 'order-tracking' && (
          <OrderTrackingView orderId={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'vendor-dashboard' && (
          <VendorDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'compass' && (
          <MongoCompassView />
        )}
      </main>

      {/* Global Floating Comparison Drawer */}
      <FloatingComparisonBar onNavigate={handleNavigate} />

      {/* JWT & bcrypt.js Authentication Modal */}
      <AuthModal />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ComparisonProvider>
          <AppContent />
        </ComparisonProvider>
      </CartProvider>
    </AuthProvider>
  );
}
