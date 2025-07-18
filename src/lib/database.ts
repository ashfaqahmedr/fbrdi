// IndexedDB Database Management
const DB_NAME = 'fbr_invoice_app';
const DB_VERSION = 3;

export const STORE_NAMES = {
  sellers: 'sellers',
  buyers: 'buyers',
  invoices: 'invoices',
  preferences: 'preferences',
  logs: 'logs',
  drafts: 'drafts'
} as const;

export interface Seller {
  id: string;
  ntn: string;
  businessName: string;
  businessActivity: string;
  sector: string;
  scenarioIds: string[];
  province: string;
  address: string;
  sandboxToken: string;
  productionToken?: string;
  registrationStatus: string;
  registrationType: string;
  lastSaleInvoiceId: number;
  lastDebitNoteId: number;
  preferredMode?: 'sandbox' | 'production';
  createdAt: Date;
  updatedAt: Date;
}

export interface Buyer {
  id: string;
  ntn: string;
  businessName: string;
  registrationType: string;
  province: string;
  address: string;
  registrationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  hsCode: string;
  description: string;
  serviceTypeId: number;
  saleType: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  rateId?: number;
  sroSchedule?: number;
  sroItem?: number;
  annexureId: number;
  uomOptions?: string[];
  taxRateOptions?: unknown[];
  sroScheduleOptions?: unknown[];
  sroItemOptions?: unknown[];
}

export interface Invoice {
  id: string;
  invoiceRefNo: string;
  fbrInvoiceNumber?: string;
  invoiceType: 'Sale Invoice' | 'Debit Note';
  invoiceDate: string;
  sellerId: string;
  buyerId: string;
  scenarioId?: string;
  currency: string;
  items: InvoiceItem[];
  status: 'draft' | 'submitted' | 'failed';
  grossAmount: number;
  salesTax: number;
  totalAmount: number;
  submissionResponse?: unknown;
  errorDetails?: string;
  isDummy?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  key: string;
  value: string | number | boolean | object | null;
  updatedAt: Date;
}

export interface AppSettings {
  defaultEnvironment: 'sandbox' | 'production';
  defaultCurrency: string;
  toastPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoSave: boolean;
  theme: 'light' | 'dark' | 'system';
}
export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  details?: unknown;
}

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORE_NAMES.sellers)) {
          const sellersStore = db.createObjectStore(STORE_NAMES.sellers, { keyPath: 'id' });
          sellersStore.createIndex('ntn', 'ntn', { unique: true });
        }
        
        if (!db.objectStoreNames.contains(STORE_NAMES.buyers)) {
          const buyersStore = db.createObjectStore(STORE_NAMES.buyers, { keyPath: 'id' });
          buyersStore.createIndex('ntn', 'ntn', { unique: true });
        }
        
        if (!db.objectStoreNames.contains(STORE_NAMES.invoices)) {
          const invoicesStore = db.createObjectStore(STORE_NAMES.invoices, { keyPath: 'id' });
          invoicesStore.createIndex('status', 'status');
          invoicesStore.createIndex('sellerId', 'sellerId');
          invoicesStore.createIndex('buyerId', 'buyerId');
          invoicesStore.createIndex('invoiceDate', 'invoiceDate');
        }
        
        if (!db.objectStoreNames.contains(STORE_NAMES.preferences)) {
          db.createObjectStore(STORE_NAMES.preferences, { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains(STORE_NAMES.logs)) {
          const logsStore = db.createObjectStore(STORE_NAMES.logs, { keyPath: 'id' });
          logsStore.createIndex('timestamp', 'timestamp');
          logsStore.createIndex('level', 'level');
        }
        
        if (!db.objectStoreNames.contains(STORE_NAMES.drafts)) {
          db.createObjectStore(STORE_NAMES.drafts, { keyPath: 'id' });
        }
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(storeName: string, value: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(
    storeName: string,
    indexName?: string,
    query?: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = query ? source.getAll(query) : source.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DatabaseManager();

// Default data
export const defaultSellers: Seller[] = [
  {
    id: 'hussaini',
    ntn: '7908224',
    businessName: 'HUSSAINI LOGISTICS ENTERPRISES (PRIVATE) LIMITED',
    businessActivity: 'Service Provider',
    sector: 'Services',
    scenarioIds: ['SN018', 'SN019'],
    province: 'SINDH',
    address: 'Rawalpindi',
    sandboxToken: 'Bearer df9b1769-25e7-3557-9343-37bc5e882b29',
    productionToken: 'Bearer df9b1769-25e7-3557-9343-37bc5e882b29',
    registrationStatus: 'Active',
    registrationType: 'Registered',
    lastSaleInvoiceId: 1,
    lastDebitNoteId: 1,
    preferredMode: 'sandbox',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mtc',
    ntn: '4420653123917',
    businessName: 'SYED IMRAN HUSSAIN SHAH',
    businessActivity: 'Service Provider',
    sector: 'Services',
    scenarioIds: ['SN018', 'SN019'],
    province: 'SINDH',
    address: 'Hyderabad',
    sandboxToken: 'Bearer 4c001ca4-4d0e-3f95-9b04-aec2cad0e5f5',
    productionToken: 'Bearer 4c001ca4-4d0e-3f95-9b04-aec2cad0e5f5',
    registrationStatus: 'Active',
    registrationType: 'Registered',
    lastSaleInvoiceId: 1,
    lastDebitNoteId: 1,
    preferredMode: 'sandbox',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const defaultBuyers: Buyer[] = [
  {
    id: 'continental',
    ntn: '0710106',
    businessName: 'CONTINENTAL BISCUITS LIMITED',
    registrationType: 'Registered',
    province: 'SINDH',
    address: 'Karachi',
    registrationStatus: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pso',
    ntn: '0711554',
    businessName: 'PAKISTAN STATE OIL COMPANY LIMITED',
    registrationType: 'Registered',
    province: 'SINDH',
    address: 'Karachi',
    registrationStatus: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

