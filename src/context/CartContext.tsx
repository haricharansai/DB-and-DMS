import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, VendorCartGroup } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  vendorGroups: VendorCartGroup[];
  wishlist: Product[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  itemCount: number;
  subtotal: number;
  shippingTotal: number;
  tax: number;
  discount: number;
  couponCode: string;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  grandTotal: number;
  showToast: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('marketnexus_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('marketnexus_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('marketnexus_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('marketnexus_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addToCart = (product: Product, quantity: number = 1, selectedColor?: string) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (selectedColor) updated[existingIndex].selectedColor = selectedColor;
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          product,
          quantity,
          selectedColor: selectedColor || (product.colors && product.colors[0]) || 'Default',
          vendorId: product.vendorId,
          vendorName: product.vendorName,
        }
      ];
    });
    triggerToast(`Added "${product.title.slice(0, 28)}..." to cart`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
    triggerToast('Item removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        triggerToast(`Removed from Wishlist`);
        return prev.filter(p => p.id !== product.id);
      } else {
        triggerToast(`Added to Wishlist ❤️`);
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  // Group items by vendor
  const vendorGroups: VendorCartGroup[] = React.useMemo(() => {
    const groups: { [key: string]: VendorCartGroup } = {};

    for (const item of cartItems) {
      if (!groups[item.vendorId]) {
        groups[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          items: [],
          subtotal: 0,
          shippingFee: 0,
        };
      }
      groups[item.vendorId].items.push(item);
      groups[item.vendorId].subtotal += item.product.price * item.quantity;
    }

    // Compute shipping per vendor (Free if vendor subtotal >= ₹1000, else ₹99)
    return Object.values(groups).map(g => ({
      ...g,
      shippingFee: g.subtotal >= 1000 ? 0 : 99,
    }));
  }, [cartItems]);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingTotal = vendorGroups.reduce((sum, g) => sum + g.shippingFee, 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST

  let discount = 0;
  if (appliedCoupon === 'NEXUSFEST') {
    discount = Math.round(subtotal * 0.15); // 15% off
  } else if (appliedCoupon === 'SAVE10') {
    discount = Math.round(subtotal * 0.10); // 10% off
  } else if (appliedCoupon === 'FIRST500') {
    discount = Math.min(500, subtotal);
  }

  const grandTotal = Math.max(0, subtotal + tax + shippingTotal - discount);

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'NEXUSFEST' || cleanCode === 'SAVE10' || cleanCode === 'FIRST500') {
      setAppliedCoupon(cleanCode);
      setCouponCode(cleanCode);
      triggerToast(`Coupon ${cleanCode} applied!`);
      return { success: true, message: `Coupon ${cleanCode} applied successfully!` };
    }
    return { success: false, message: 'Invalid promo code. Try NEXUSFEST or SAVE10' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    triggerToast('Coupon removed');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        vendorGroups,
        wishlist,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        itemCount,
        subtotal,
        shippingTotal,
        tax,
        discount,
        couponCode,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        grandTotal,
        showToast: toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
