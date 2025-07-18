import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, STORE_NAMES, Seller, Buyer, Invoice, defaultSellers, defaultBuyers, AppSettings } from '@/lib/database';
import { toast } from 'sonner';

interface DatabaseContextType {
  sellers: Seller[];
  buyers: Buyer[];
  invoices: Invoice[];
  settings: AppSettings;
  isLoading: boolean;
  refreshSellers: () => Promise<void>;
  refreshBuyers: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  addSeller: (seller: Seller) => Promise<void>;
  updateSeller: (seller: Seller) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  addBuyer: (buyer: Buyer) => Promise<void>;
  updateBuyer: (buyer: Buyer) => Promise<void>;
  deleteBuyer: (id: string) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  defaultEnvironment: 'sandbox',
  defaultCurrency: 'PKR',
  toastPosition: 'top-right',
  autoSave: true,
  theme: 'system',
};
const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await db.init();
      await loadInitialData();
      await refreshAll();
      await refreshSettings();
    } catch (error) {
      console.error('Database initialization failed:', error);
      toast.error('Failed to initialize database');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    const existingSellers = await db.getAll<Seller>(STORE_NAMES.sellers);
    const existingBuyers = await db.getAll<Buyer>(STORE_NAMES.buyers);

    if (existingSellers.length === 0) {
      for (const seller of defaultSellers) {
        await db.set(STORE_NAMES.sellers, seller);
      }
    }

    if (existingBuyers.length === 0) {
      for (const buyer of defaultBuyers) {
        await db.set(STORE_NAMES.buyers, buyer);
      }
    }

    // Initialize settings if not exists
    const existingSettings = await db.get<AppSettings>(STORE_NAMES.preferences, 'appSettings');
    if (!existingSettings) {
      await db.set(STORE_NAMES.preferences, { key: 'appSettings', value: defaultSettings, updatedAt: new Date() });
    }
  };

  const refreshSellers = async () => {
    const data = await db.getAll<Seller>(STORE_NAMES.sellers);
    setSellers(data);
  };

  const refreshBuyers = async () => {
    const data = await db.getAll<Buyer>(STORE_NAMES.buyers);
    setBuyers(data);
  };

  const refreshInvoices = async () => {
    const data = await db.getAll<Invoice>(STORE_NAMES.invoices);
    setInvoices(data);
  };

  const refreshSettings = async () => {
    const data = await db.get<{ key: string; value: AppSettings }>(STORE_NAMES.preferences, 'appSettings');
    if (data) {
      setSettings(data.value);
    }
  };
  const refreshAll = async () => {
    await Promise.all([refreshSellers(), refreshBuyers(), refreshInvoices()]);
  };

  const addSeller = async (seller: Seller) => {
    await db.set(STORE_NAMES.sellers, seller);
    await refreshSellers();
    toast.success('Seller added successfully');
  };

  const updateSeller = async (seller: Seller) => {
    await db.set(STORE_NAMES.sellers, { ...seller, updatedAt: new Date() });
    await refreshSellers();
    toast.success('Seller updated successfully');
  };

  const deleteSeller = async (id: string) => {
    await db.delete(STORE_NAMES.sellers, id);
    await refreshSellers();
    toast.success('Seller deleted successfully');
  };

  const addBuyer = async (buyer: Buyer) => {
    await db.set(STORE_NAMES.buyers, buyer);
    await refreshBuyers();
    toast.success('Buyer added successfully');
  };

  const updateBuyer = async (buyer: Buyer) => {
    await db.set(STORE_NAMES.buyers, { ...buyer, updatedAt: new Date() });
    await refreshBuyers();
    toast.success('Buyer updated successfully');
  };

  const deleteBuyer = async (id: string) => {
    await db.delete(STORE_NAMES.buyers, id);
    await refreshBuyers();
    toast.success('Buyer deleted successfully');
  };

  const addInvoice = async (invoice: Invoice) => {
    await db.set(STORE_NAMES.invoices, invoice);
    await refreshInvoices();
    toast.success('Invoice saved successfully');
  };

  const updateInvoice = async (invoice: Invoice) => {
    await db.set(STORE_NAMES.invoices, { ...invoice, updatedAt: new Date() });
    await refreshInvoices();
    toast.success('Invoice updated successfully');
  };

  const deleteInvoice = async (id: string) => {
    await db.delete(STORE_NAMES.invoices, id);
    await refreshInvoices();
    toast.success('Invoice deleted successfully');
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    await db.set(STORE_NAMES.preferences, { 
      key: 'appSettings', 
      value: updatedSettings, 
      updatedAt: new Date() 
    });
    setSettings(updatedSettings);
    toast.success('Settings updated successfully');
  };

  const clearAllData = async () => {
    await db.clear(STORE_NAMES.sellers);
    await db.clear(STORE_NAMES.buyers);
    await db.clear(STORE_NAMES.invoices);
    await db.clear(STORE_NAMES.logs);
    await refreshAll();
    toast.success('All data cleared successfully');
  };
  return (
    <DatabaseContext.Provider
      value={{
        sellers,
        buyers,
        invoices,
        settings,
        isLoading,
        refreshSellers,
        refreshBuyers,
        refreshInvoices,
        refreshSettings,
        addSeller,
        updateSeller,
        deleteSeller,
        addBuyer,
        updateBuyer,
        deleteBuyer,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateSettings,
        clearAllData,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export { DatabaseContext }