import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';

interface ComparisonContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => { success: boolean; message: string };
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  highlightDifferences: boolean;
  setHighlightDifferences: (val: boolean) => void;
  isCompareDrawerOpen: boolean;
  setIsCompareDrawerOpen: (val: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [compareItems, setCompareItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('marketnexus_compare');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [highlightDifferences, setHighlightDifferences] = useState<boolean>(false);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('marketnexus_compare', JSON.stringify(compareItems));
  }, [compareItems]);

  const addToCompare = (product: Product) => {
    if (compareItems.some(p => p.id === product.id)) {
      removeFromCompare(product.id);
      return { success: true, message: 'Removed from comparison' };
    }

    if (compareItems.length >= 4) {
      return { success: false, message: 'You can compare up to 4 products at a time.' };
    }

    // Check if category matches or is compatible
    if (compareItems.length > 0 && compareItems[0].category !== product.category) {
      // Allow anyway but notify
    }

    setCompareItems(prev => [...prev, product]);
    return { success: true, message: `Added "${product.title.slice(0, 24)}..." to comparison` };
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems(prev => prev.filter(p => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some(p => p.id === productId);
  };

  return (
    <ComparisonContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        highlightDifferences,
        setHighlightDifferences,
        isCompareDrawerOpen,
        setIsCompareDrawerOpen,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
