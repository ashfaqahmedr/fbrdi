import { InvoiceItem } from './database';

export interface TaxRateOption {
  ratE_ID: number;
  ratE_VALUE: number;
  ratE_DESC: string;
  // Add other properties as needed
}

export interface SROSchedule {
  srO_ID: number;
  srO_DESC: string;
  // Add other properties as needed
}

export interface SROItem {
  srO_ITEM_ID: number;
  srO_ITEM_DESC: string;
  // Add other properties as needed
}

export interface InvoiceItemExtended extends InvoiceItem {
  taxRateOptions?: TaxRateOption[];
  sroScheduleOptions?: SROSchedule[];
  sroItemOptions?: SROItem[];
  uomOptions?: string[];
}
