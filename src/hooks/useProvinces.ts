import { useState } from 'react';
import { defaultProvinces } from '@/lib/constants';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

export interface Province {
  stateProvinceCode: string;
  stateProvinceDesc: string;
}

export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>(
    defaultProvinces.map((p: any) => ({
      stateProvinceCode: String(p.stateProvinceCode),
      stateProvinceDesc: p.stateProvinceDesc,
    }))
  );

  // Fetch provinces dynamically based on token
  const fetchProvinces = async (token?: string) => {
    if (!token) {
      setProvinces(defaultProvinces.map((p: any) => ({
        stateProvinceCode: String(p.stateProvinceCode),
        stateProvinceDesc: p.stateProvinceDesc,
      })));
      return;
    }
    try {
      apiService.setToken(token);
      const apiProvinces = await apiService.loadProvinces();
      if (Array.isArray(apiProvinces) && apiProvinces.length > 0) {
        setProvinces(apiProvinces.map((p: any) => ({
          stateProvinceCode: String(p.stateProvinceCode),
          stateProvinceDesc: p.stateProvinceDesc,
        })));
        toast.success('Provinces fetched from API');
      } else {
        setProvinces(defaultProvinces.map((p: any) => ({
          stateProvinceCode: String(p.stateProvinceCode),
          stateProvinceDesc: p.stateProvinceDesc,
        })));
      }
    } catch {
      setProvinces(defaultProvinces.map((p: any) => ({
        stateProvinceCode: String(p.stateProvinceCode),
        stateProvinceDesc: p.stateProvinceDesc,
      })));
    }
  };

  return { provinces, fetchProvinces, setProvinces };
}
