import React, { createContext, useContext, useState } from 'react';
import { InvoiceItem } from '@/lib/database';
import { toast } from 'sonner';

interface InvoiceContextType {
  items: InvoiceItem[];
  addItem: (item: InvoiceItem) => void;
  updateItem: (id: string, updates: Partial<InvoiceItem>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  setItems: (items: InvoiceItem[]) => void;
  getTotalAmount: () => number;
  getGrossAmount: () => number;
  getSalesTax: () => number;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const addItem = (item: InvoiceItem) => {
    setItems(prev => {
      const newItems = [...prev, item];
      return newItems;
    });
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(prev => {
      const newItems = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      return newItems;
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      toast.success('Item removed successfully');
      return newItems;
    });
  };

  const clearItems = () => {
    setItems([]);
  };

  const setItemsDirectly = (newItems: InvoiceItem[]) => {
    setItems(newItems);
  };
  const getGrossAmount = () => {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const getSalesTax = () => {
    return items.reduce((total, item) => {
      const amount = item.quantity * item.unitPrice;
      return total + (amount * item.taxRate / 100);
    }, 0);
  };

  const getTotalAmount = () => {
    return getGrossAmount() + getSalesTax();
  };

  return (
    <InvoiceContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        clearItems,
        setItems: setItemsDirectly,
        getTotalAmount,
        getGrossAmount,
        getSalesTax,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}