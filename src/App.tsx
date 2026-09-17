import React, { useState, useEffect } from 'react';
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
import { UserProfileView } from './components/profile/UserProfileView';

const normalizeView = (v: string): string => {
  if (v === 'orders') return 'order-tracking';
  if (v === 'wishlist') return 'catalog';
  return v;
};

function AppContent() {
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const parts = hash.split('/');
      return normalizeView(parts[0] || 'home');
    }
    return 'home';
  });

  const [viewParam, setViewParam] = useState<string | undefined>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const parts = hash.split('/');
      return parts[1];
    }
    return undefined;
  });

  useEffect(() => {
    // 1. Initialize history state on initial mount
    const hash = window.location.hash.replace('#', '');
    const parts = hash ? hash.split('/') : ['home'];
    const initialView = normalizeView(parts[0] || 'home');
    const initialParam = parts[1];

    if (!window.history.state) {
      window.history.replaceState(
        { view: initialView, param: initialParam },
        '',
        `#${initialView}${initialParam ? `/${initialParam}` : ''}`
      );
    }

    const updateRouteFromLocation = () => {
      const currentHash = window.location.hash.replace('#', '');
      const hashParts = currentHash ? currentHash.split('/') : ['home'];
      const rawView = hashParts[0] || 'home';
      const param = hashParts[1];
      const view = normalizeView(rawView);

      setCurrentView(view);
      setViewParam(param);
    };

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(normalizeView(event.state.view));
        setViewParam(event.state.param);
      } else {
        updateRouteFromLocation();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', updateRouteFromLocation);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', updateRouteFromLocation);
    };
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    const targetView = normalizeView(view);
    setCurrentView(targetView);
    setViewParam(param);

    const newHash = `#${targetView}${param ? `/${param}` : ''}`;
    if (window.location.hash !== newHash) {
      window.history.pushState({ view: targetView, param }, '', newHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} onOpenCompass={() => handleNavigate('compass')} />

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView onNavigate={handleNavigate} />
        )}

        {currentView === 'catalog' && (
          <CatalogView initialFilter={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'product-detail' && (
          <ProductDetailView productId={viewParam || 'prod_macbook_pro_16'} onNavigate={handleNavigate} />
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

        {currentView === 'profile' && (
          <UserProfileView onNavigate={handleNavigate} />
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
