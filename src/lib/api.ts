import { toast } from "sonner";
import { defaultProvinces, defaultTransType } from "./constants";

// Enhanced API Configuration and Functions
const API_URLS = {
  validate: {
    sandbox: "https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb",
    production: "https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata",
  },
  submit: {
    sandbox: "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb",
    production: "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata",
  },
  hsCodes: "https://gw.fbr.gov.pk/pdi/v1/itemdesccode",
  provinces: "https://gw.fbr.gov.pk/pdi/v1/provinces",
  transactionTypes: "https://gw.fbr.gov.pk/pdi/v1/transtypecode",
  uom: "https://gw.fbr.gov.pk/pdi/v1/uom",
  saleTypeToRate: "https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate",
  hsUom: "https://gw.fbr.gov.pk/pdi/v2/HS_UOM",
  doctypecode: "https://gw.fbr.gov.pk/pdi/v1/doctypecode",
  sroitemcode: "https://gw.fbr.gov.pk/pdi/v1/sroitemcode",
  SroSchedule: "https://gw.fbr.gov.pk/pdi/v1/SroSchedule",
  SROItem: "https://gw.fbr.gov.pk/pdi/v2/SROItem",
  statl: "https://gw.fbr.gov.pk/dist/v1/statl",
  getRegType: "https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type",
};

export interface HSCode {
  hS_CODE: string;
  description: string;
}

export interface TransactionType {
  transactioN_TYPE_ID: number;
  transactioN_DESC: string;
}

export interface Province {
  stateProvinceCode: number;
  stateProvinceDesc: string;
}

export interface UOMOption {
  description: string;
}

export interface TaxRateOption {
  ratE_ID: number;
  ratE_DESC: string;
  ratE_VALUE: number;
}

export interface SROSchedule {
  srO_ID: number;
  srO_DESC: string;
}

export interface SROItem {
  srO_ITEM_ID: number;
  srO_ITEM_DESC: string;
}

export class APIService {
  private static instance: APIService;
  private token: string = '';
  private isProduction: boolean = false;
  public transactionTypes: TransactionType[] = [];
  public provinces: Province[] = [];

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  setToken(token: string) {
    this.token = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  setEnvironment(isProduction: boolean) {
    this.isProduction = isProduction;
  }

  formatDateForAPI(date: string, format: string = "DD-MMM-YYYY"): string {
    const dateObj = new Date(date);
    if (format === "DD-MMM-YYYY") {
      return dateObj
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");
    }
    return dateObj.toISOString().split("T")[0];
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.token,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text() as unknown as Record<string, unknown>;

    }
  }

  async loadHSCodes(): Promise<HSCode[]> {
    try {
      const response = await this.fetchWithAuth(API_URLS.hsCodes);
      return Array.isArray(response) ? response.sort((a, b) => a.hS_CODE.localeCompare(b.hS_CODE)) : [];
    } catch (error) {
      console.error('Failed to load HS Codes:', error);
      return [];
    }
  }

  async loadTransactionTypes(): Promise<TransactionType[]> {

    const sortedResponse = Array.isArray(defaultTransType) ? defaultTransType.sort((a, b) => a.transactioN_TYPE_ID - b.transactioN_TYPE_ID) : [];
    if (!this.token) {
      this.transactionTypes = sortedResponse;
      return sortedResponse;
    }
    try {
      const response = await this.fetchWithAuth(API_URLS.transactionTypes);
      this.transactionTypes = Array.isArray(response) ? response : [];
      const sortedResponse = Array.isArray(response) ? response.sort((a, b) => a.transactioN_TYPE_ID - b.transactioN_TYPE_ID) : [];
      return sortedResponse;
    } catch (error) {
      console.error('Failed to load Transaction Types:', error);
      return sortedResponse;
    }
  }


  async loadProvinces(): Promise<Province[]> {
    if (!this.token) {
      this.provinces = defaultProvinces;
      return defaultProvinces;
    }
    try {
      const response = await this.fetchWithAuth(API_URLS.provinces);
      this.provinces = Array.isArray(response) ? response : [];  
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to load Provinces:', error);
      return defaultProvinces;
    }
  }

  async fetchUoMOptions(hsCode: string, annexureId: number = 3): Promise<string[]> {
    try {
      const url = `${API_URLS.hsUom}?hs_code=${hsCode}&annexure_id=${annexureId}`;
      const response = await this.fetchWithAuth(url);
      return Array.isArray(response) ? response.map((item: UOMOption) => item.description) : [];
    } catch (error) {
      console.error('Failed to fetch UoM options:', error);
      return [];
    }
  }

  async fetchTaxRateOptions(serviceTypeId: number, buyerProvinceId: string, date: string): Promise<TaxRateOption[]> {
    try {
      const url = `${API_URLS.saleTypeToRate}?date=${date}&transTypeId=${serviceTypeId}&originationSupplier=${buyerProvinceId}`;
      const response = await this.fetchWithAuth(url, { method: 'GET' });
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch tax rate options:', error);
      return [{ ratE_ID: 1, ratE_DESC: "17%", ratE_VALUE: 17 }];
    }
  }

  async fetchSROSchedules(rateId: number, date: string, provinceCode: number): Promise<SROSchedule[]> {
    try {
      const url = `${API_URLS.SroSchedule}?rate_id=${rateId}&date=${date}&origination_supplier_csv=${provinceCode}`;
      const response = await this.fetchWithAuth(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch SRO Schedules:', error);
      return [];
    }
  }

  async fetchSROItems(sroId: number, date: string): Promise<SROItem[]> {
    try {
      const url = `${API_URLS.SROItem}?date=${date}&sro_id=${sroId}`;
      const response = await this.fetchWithAuth(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch SRO Items:', error);
      return [];
    }
  }

  async validateInvoice(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = this.isProduction ? API_URLS.validate.production : API_URLS.validate.sandbox;
    return await this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitInvoice(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = this.isProduction ? API_URLS.submit.production : API_URLS.submit.sandbox;
    return await this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async testEndpoint(url: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const { method = 'GET', queryParams = {}, body } = params;
    
    // For GET requests, append query parameters to URL
    const fullUrl = method === 'GET' && Object.keys(queryParams as Record<string, string>).length > 0
      ? `${url}?${new URLSearchParams(queryParams as Record<string, string>).toString()}`
      : url;

    return await this.fetchWithAuth(fullUrl, {
      method: method as string,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(params.headers || {})
      }
    });
  }

  async validateRegistration(ntn: string): Promise<{ status: string; statusCode: string }> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const response = await this.fetchWithAuth(API_URLS.statl, {
        method: 'POST',
        body: JSON.stringify({ regno: ntn, date: currentDate }),
      });

      return {
        status: response.status === 'Active' ? 'Active' : 'In-Active',
        statusCode: (response['status code'] as string) || '01',
      };
    } catch (error) {
      console.error('Registration validation error:', error);
      return { status: 'In-Active', statusCode: '01' };
    }
  }

  async getRegistrationType(ntn: string): Promise<{ type: string; statusCode: string }> {
    try {
      const response = await this.fetchWithAuth(API_URLS.getRegType, {
        method: 'POST',
        body: JSON.stringify({ Registration_No: ntn }),
      });

      return {
          type: (response.REGISTRATION_TYPE as string) || 'unregistered',
        statusCode: (response.statuscode as string) || '01',
      };
    } catch (error) {
      console.error('Registration type error:', error);
      return { type: 'unregistered', statusCode: '01' };
    }
  }


  async validateNTN(ntn: string): Promise<{ regStatus: { status: string; statusCode: string }, regType: { type: string; statusCode: string } }> {
    this.setToken(this.token);
    if (!ntn || !this.token) throw new Error('NTN is required');
    const [regStatus, regType] = await Promise.all([
      this.validateRegistration(ntn),
      this.getRegistrationType(ntn)
    ]);
    toast.success('NTN validation successful', {
      description: 'NTN validation successful',
    });
    return { regStatus, regType };
  }
}

export const apiService = APIService.getInstance();