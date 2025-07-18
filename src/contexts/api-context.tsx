import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService, HSCode, TransactionType, Province } from '@/lib/api';
import { useDatabase } from '@/hooks/use-database';
import { toast } from 'sonner';

interface APIContextType {
  hsCodes: HSCode[];
  transactionTypes: TransactionType[];
  provinces: Province[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  setApiToken: (token: string, isProduction: boolean) => void;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export function APIProvider({ children }: { children: React.ReactNode }) {
  const [hsCodes, setHsCodes] = useState<HSCode[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sellers } = useDatabase();

  const setApiToken = (token: string, isProduction: boolean) => {
    apiService.setToken(token);
    apiService.setEnvironment(isProduction);
  };

  const refreshData = async () => {
    if (sellers.length === 0) return;
    
    setIsLoading(true);
    try {
      // Use first seller's token for API calls
      const seller = sellers[0];
      const token = seller.sandboxToken || seller.productionToken;
      if (token) {
        setApiToken(token, false); // Default to sandbox
        
        const [hsCodesData, transactionTypesData, provincesData] = await Promise.all([
          apiService.loadHSCodes(),
          apiService.loadTransactionTypes(),
          apiService.loadProvinces(),
        ]);

        setHsCodes(hsCodesData);
        setTransactionTypes(transactionTypesData);
        setProvinces(provincesData);
        
        toast.success(`Loaded ${hsCodesData.length} HS codes, ${transactionTypesData.length} transaction types, ${provincesData.length} provinces`);
      }
    } catch (error) {
      console.error('Failed to load API data:', error);
      toast.error('Failed to load API data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sellers.length > 0) {
      refreshData();
    } else {
      setIsLoading(false);
    }
  }, [sellers]);

  return (
    <APIContext.Provider
      value={{
        hsCodes,
        transactionTypes,
        provinces,
        isLoading,
        refreshData,
        setApiToken,
      }}
    >
      {children}
    </APIContext.Provider>
  );
}

export function useAPI() {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
}