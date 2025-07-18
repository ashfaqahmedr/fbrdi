import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { useInvoice } from '@/contexts/invoice-context';
import { useAPI } from '@/contexts/api-context';
import { useDatabase } from '@/hooks/use-database';
import { InvoiceItem } from '@/lib/database';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InvoiceItemsProps {
  selectedSeller: string;
  selectedBuyer: string;
  invoiceDate: string;
  currency: string;
}

export function InvoiceItems({ selectedSeller, selectedBuyer, invoiceDate, currency }: InvoiceItemsProps) {
  const { items, addItem, updateItem, removeItem, getTotalAmount, getGrossAmount, getSalesTax } = useInvoice();
  const { hsCodes, transactionTypes, provinces } = useAPI();
  const { sellers, buyers } = useDatabase();
  const [itemCounter, setItemCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const seller = useMemo(() => 
    sellers.find(s => s.id === selectedSeller), 
    [sellers, selectedSeller]
  );
  
  const buyer = useMemo(() => 
    buyers.find(b => b.id === selectedBuyer), 
    [buyers, selectedBuyer]
  );

  const [updateTimeouts, setUpdateTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  const clearTimeout = useCallback((key: string) => {
    if (updateTimeouts[key]) {
      clearTimeout(updateTimeouts[key]);
      setUpdateTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[key];
        return newTimeouts;
      });
    }
  }, [updateTimeouts]);

  const debouncedApiCall = useCallback((key: string, callback: () => Promise<void>, delay = 2000) => {
    clearTimeout(key);
    const timeoutId = setTimeout(callback, delay);
    setUpdateTimeouts(prev => ({ ...prev, [key]: timeoutId }));
  }, [clearTimeout]);

  const addNewItem = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const itemId = `item-${itemCounter}`;
    setItemCounter(prev => prev + 1);
    
    try {
      const defaultHsCode = hsCodes.length > 0 ? hsCodes[0] : { hS_CODE: "5904.9000", description: "TEXTILE PRODUCTS" };
      const defaultTransType = transactionTypes.length > 0 ? transactionTypes[0] : { transactioN_TYPE_ID: 18, transactioN_DESC: "Services" };

      const newItem: InvoiceItem = {
        id: itemId,
        hsCode: defaultHsCode.hS_CODE,
        description: defaultHsCode.description,
        serviceTypeId: defaultTransType.transactioN_TYPE_ID,
        saleType: defaultTransType.transactioN_DESC,
        uom: "",
        quantity: 1,
        unitPrice: 100,
        taxRate: 0, // Default tax rate is 0%
        rateId: undefined,
        sroSchedule: undefined,
        sroItem: undefined,
        annexureId: 3,
        uomOptions: [],
        taxRateOptions: [],
        sroScheduleOptions: [],
        sroItemOptions: [],
      };

      if (seller && newItem.hsCode) {
        try {
          apiService.setToken(seller.sandboxToken);
          newItem.uomOptions = await apiService.fetchUoMOptions(newItem.hsCode, 3);
          newItem.uom = newItem.uomOptions.length > 0 ? newItem.uomOptions[0] : "";
        } catch (error) {
          console.error('Failed to fetch UoM options:', error);
          newItem.uomOptions = [];
          newItem.uom = "PCS";
        }
      }

      addItem(newItem);
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setIsLoading(false);
    }
  }, [itemCounter, hsCodes, transactionTypes, seller, addItem, isLoading]);

  const handleItemUpdate = useCallback(async (itemId: string, field: string, value: any) => {
    const item = items.find(item => item.id === itemId);
    if (!item || !seller) return;

    const updates: Partial<InvoiceItem> = { [field]: value };

    if (['quantity', 'unitPrice', 'description'].includes(field)) {
      const numValue = ['quantity', 'unitPrice'].includes(field) ? Number(value) : value;
      updateItem(itemId, { [field]: numValue });
      return;
    }

    const updateKey = `${itemId}-${field}`;
    
    debouncedApiCall(updateKey, async () => {
      try {
        apiService.setToken(seller.sandboxToken);

        if (field === 'hsCode') {
          const selectedHsCode = hsCodes.find(hs => hs.hS_CODE === value);
          updates.description = selectedHsCode?.description || item.description;
          updates.uomOptions = await apiService.fetchUoMOptions(value, 3);
          updates.uom = updates.uomOptions.length > 0 ? updates.uomOptions[0] : "";
          updates.taxRateOptions = [];
          updates.sroScheduleOptions = [];
          updates.sroItemOptions = [];
          updates.taxRate = 0;
          updates.rateId = undefined;
          updates.sroSchedule = undefined;
          updates.sroItem = undefined;
          toast.success('HS Code updated, UoM options refreshed');
        } 
        else if (field === 'serviceTypeId') {
          const selectedTransType = transactionTypes.find(t => t.transactioN_TYPE_ID === Number(value));
          updates.saleType = selectedTransType?.transactioN_DESC || item.saleType;

          if (buyer && invoiceDate) {
            const formattedDate = apiService.formatDateForAPI(invoiceDate, "DD-MMM-YYYY");
            const buyerProvince = provinces.find(p => p.stateProvinceDesc === buyer.province);
            const originationSupplier = buyerProvince ? buyerProvince.stateProvinceCode : 1;
            
            updates.taxRateOptions = await apiService.fetchTaxRateOptions(Number(value), originationSupplier.toString(), formattedDate);
            updates.taxRate = 0; // Default to 0%
            updates.rateId = undefined;
            updates.sroScheduleOptions = [];
            updates.sroItemOptions = [];
            updates.sroSchedule = undefined;
            updates.sroItem = undefined;
            toast.success('Service type updated, tax rates loaded');
          }
        } 
        else if (field === 'taxRate') {
          const selectedTaxRate = item.taxRateOptions?.find(rate => rate.ratE_VALUE === Number(value));
          updates.rateId = selectedTaxRate?.ratE_ID;

          if (updates.rateId && buyer && invoiceDate) {
            const formattedDate = apiService.formatDateForAPI(invoiceDate, "DD-MMM-YYYY");
            const buyerProvince = provinces.find(p => p.stateProvinceDesc === buyer.province);
            const provinceCode = buyerProvince ? buyerProvince.stateProvinceCode : 1;
            
            updates.sroScheduleOptions = await apiService.fetchSROSchedules(updates.rateId, formattedDate, provinceCode);
            updates.sroSchedule = updates.sroScheduleOptions.length > 0 ? updates.sroScheduleOptions[0].srO_ID : undefined;
            
            if (updates.sroSchedule) {
              const formattedDateISO = apiService.formatDateForAPI(invoiceDate, "YYYY-MM-DD");
              updates.sroItemOptions = await apiService.fetchSROItems(updates.sroSchedule, formattedDateISO);
              updates.sroItem = updates.sroItemOptions.length > 0 ? updates.sroItemOptions[0].srO_ITEM_ID : undefined;
            }
            toast.success('Tax rate selected, SRO options loaded');
          }
        } 
        else if (field === 'sroSchedule') {
          if (invoiceDate) {
            const formattedDate = apiService.formatDateForAPI(invoiceDate, "YYYY-MM-DD");
            updates.sroItemOptions = await apiService.fetchSROItems(Number(value), formattedDate);
            updates.sroItem = updates.sroItemOptions.length > 0 ? updates.sroItemOptions[0].srO_ITEM_ID : undefined;
            toast.success('SRO Schedule selected, SRO Items loaded');
          }
        }

        updateItem(itemId, updates);
      } catch (error) {
        console.error('Failed to update item:', error);
        toast.error('Failed to update item');
      }
    });
  }, [items, seller, buyer, invoiceDate, hsCodes, transactionTypes, provinces, updateItem, debouncedApiCall]);

  useEffect(() => {
    if (items.length === 0 && hsCodes.length > 0 && transactionTypes.length > 0 && !isLoading) {
      addNewItem();
    }
  }, [hsCodes.length, transactionTypes.length]);

  useEffect(() => {
    return () => {
      Object.values(updateTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [updateTimeouts]);

  // Prepare options for searchable selects
  const hsCodeOptions = useMemo(() => 
    hsCodes.slice(0, 100).map(hs => ({
      value: hs.hS_CODE,
      label: hs.hS_CODE,
      description: hs.description
    })), [hsCodes]
  );

  const transactionTypeOptions = useMemo(() => 
    transactionTypes.map(t => ({
      value: t.transactioN_TYPE_ID.toString(),
      label: t.transactioN_DESC,
      description: `ID: ${t.transactioN_TYPE_ID}`
    })), [transactionTypes]
  );

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Package className="h-5 w-5" />
            Invoice Items
          </CardTitle>
          <Button 
            onClick={addNewItem} 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items added yet</p>
            <p className="text-sm">Click "Add Item" to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                index={index}
                currency={currency}
                hsCodeOptions={hsCodeOptions}
                transactionTypeOptions={transactionTypeOptions}
                onUpdate={handleItemUpdate}
                onRemove={() => removeItem(item.id)}
              />
            ))}
            
            <Separator className="my-6" />
            
            <div className="flex justify-end">
              <div className="space-y-2 text-right bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-blue-700 dark:text-blue-300">Gross Amount:</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">{currency} {getGrossAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-purple-700 dark:text-purple-300">Sales Tax:</span>
                  <span className="font-medium text-purple-800 dark:text-purple-200">{currency} {getSalesTax().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between gap-8 text-lg font-bold">
                  <span className="text-green-700 dark:text-green-300">Total Amount:</span>
                  <span className="text-green-800 dark:text-green-200">{currency} {getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ItemRowProps {
  item: InvoiceItem;
  index: number;
  currency: string;
  hsCodeOptions: Array<{value: string; label: string; description: string}>;
  transactionTypeOptions: Array<{value: string; label: string; description: string}>;
  onUpdate: (itemId: string, field: string, value: any) => void;
  onRemove: () => void;
}

function ItemRow({ item, index, currency, hsCodeOptions, transactionTypeOptions, onUpdate, onRemove }: ItemRowProps) {
  const totalValue = useMemo(() => {
    const baseValue = item.quantity * item.unitPrice;
    const taxAmount = baseValue * (item.taxRate / 100);
    return baseValue + taxAmount;
  }, [item.quantity, item.unitPrice, item.taxRate]);

  // Prepare tax rate options
  const taxRateOptions = useMemo(() => 
    (item.taxRateOptions || []).map(rate => ({
      value: rate.ratE_VALUE.toString(),
      label: rate.ratE_DESC,
      description: `Rate ID: ${rate.ratE_ID}`
    })), [item.taxRateOptions]
  );

  // Prepare SRO schedule options
  const sroScheduleOptions = useMemo(() => 
    (item.sroScheduleOptions || []).map(sro => ({
      value: sro.srO_ID.toString(),
      label: sro.srO_DESC,
      description: `SRO ID: ${sro.srO_ID}`
    })), [item.sroScheduleOptions]
  );

  // Prepare SRO item options
  const sroItemOptions = useMemo(() => 
    (item.sroItemOptions || []).map(sroItem => ({
      value: sroItem.srO_ITEM_ID.toString(),
      label: sroItem.srO_ITEM_DESC,
      description: `Item ID: ${sroItem.srO_ITEM_ID}`
    })), [item.sroItemOptions]
  );

  // Prepare UoM options
  const uomOptions = useMemo(() => 
    (item.uomOptions || []).map(uom => ({
      value: uom,
      label: uom,
      description: uom
    })), [item.uomOptions]
  );

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-blue-700 dark:text-blue-300">Item {index + 1}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-purple-700 dark:text-purple-300">HS Code</Label>
          <SearchableSelect
            options={hsCodeOptions}
            value={item.hsCode}
            onValueChange={(value) => onUpdate(item.id, 'hsCode', value)}
            placeholder="Search HS Code..."
            searchPlaceholder="Search by code or description..."
            className="border-purple-200 focus:border-purple-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-green-700 dark:text-green-300">Quantity</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, 'quantity', Number(e.target.value))}
            className="border-green-200 focus:border-green-500"
            min="1"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-orange-700 dark:text-orange-300">Unit Price</Label>
          <Input
            type="number"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdate(item.id, 'unitPrice', Number(e.target.value))}
            className="border-orange-200 focus:border-orange-500"
            min="0.01"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-indigo-700 dark:text-indigo-300">Description</Label>
        <Textarea
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          rows={2}
          className="border-indigo-200 focus:border-indigo-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-pink-700 dark:text-pink-300">Service Type</Label>
          <SearchableSelect
            options={transactionTypeOptions}
            value={item.serviceTypeId.toString()}
            onValueChange={(value) => onUpdate(item.id, 'serviceTypeId', Number(value))}
            placeholder="Search service type..."
            className="border-pink-200 focus:border-pink-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-teal-700 dark:text-teal-300">UoM</Label>
          <SearchableSelect
            options={uomOptions}
            value={item.uom}
            onValueChange={(value) => onUpdate(item.id, 'uom', value)}
            placeholder="Select UoM..."
            className="border-teal-200 focus:border-teal-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-red-700 dark:text-red-300">Tax Rate (%)</Label>
          <SearchableSelect
            options={taxRateOptions}
            value={item.taxRate.toString()}
            onValueChange={(value) => onUpdate(item.id, 'taxRate', Number(value))}
            placeholder="Select tax rate..."
            disabled={!item.taxRateOptions || item.taxRateOptions.length === 0}
            className="border-red-200 focus:border-red-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-cyan-700 dark:text-cyan-300">Total Value</Label>
          <Input
            value={`${currency} ${totalValue.toFixed(2)}`}
            readOnly
            className="bg-cyan-50 border-cyan-200 dark:bg-cyan-950 font-medium"
          />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">SRO Details</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-yellow-700 dark:text-yellow-300">SRO Schedule</Label>
            <SearchableSelect
              options={sroScheduleOptions}
              value={item.sroSchedule?.toString() || ""}
              onValueChange={(value) => onUpdate(item.id, 'sroSchedule', Number(value))}
              placeholder="Select SRO Schedule..."
              disabled={!item.rateId || !item.sroScheduleOptions || item.sroScheduleOptions.length === 0}
              className="border-yellow-200 focus:border-yellow-500"
            />
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              {!item.rateId ? "Select tax rate first" : "SRO Schedule"}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-amber-700 dark:text-amber-300">SRO Item</Label>
            <SearchableSelect
              options={sroItemOptions}
              value={item.sroItem?.toString() || ""}
              onValueChange={(value) => onUpdate(item.id, 'sroItem', Number(value))}
              placeholder="Select SRO Item..."
              disabled={!item.sroSchedule || !item.sroItemOptions || item.sroItemOptions.length === 0}
              className="border-amber-200 focus:border-amber-500"
            />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {!item.sroSchedule ? "Select SRO schedule first" : "SRO Item Serial"}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-orange-700 dark:text-orange-300">Annexure ID</Label>
            <Input
              type="number"
              value={item.annexureId}
              readOnly
              className="bg-orange-50 border-orange-200 dark:bg-orange-950"
            />
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Rate ID: {item.rateId || "Not selected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}