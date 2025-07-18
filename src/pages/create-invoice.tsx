import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Building2, Save, Send, RotateCcw, Code } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { useAPI } from '@/contexts/api-context';
import { useInvoice } from '@/contexts/invoice-context';
import { Invoice } from '@/lib/database';
import { InvoiceItems } from '@/components/invoice/invoice-items';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface CreateInvoiceProps {
  editingInvoice?: Invoice | null;
}

export function CreateInvoice({ editingInvoice }: CreateInvoiceProps) {
  const { sellers, buyers, addInvoice, updateInvoice, settings } = useDatabase();
  const { setApiToken } = useAPI();
  const { items, clearItems, setItems } = useInvoice();
  
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [invoiceType, setInvoiceType] = useState<'Sale Invoice' | 'Debit Note'>('Sale Invoice');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState(settings.defaultCurrency || 'PKR');
  const [scenarioId, setScenarioId] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [invoicePayload, setInvoicePayload] = useState<Record<string, unknown>>({});

  // Load editing invoice data
  useEffect(() => {
    if (editingInvoice) {
      setSelectedSeller(editingInvoice.sellerId);
      setSelectedBuyer(editingInvoice.buyerId);
      setInvoiceType(editingInvoice.invoiceType);
      setInvoiceDate(editingInvoice.invoiceDate);
      setCurrency(editingInvoice.currency);
      setScenarioId(editingInvoice.scenarioId || '');
      setInvoiceRef(editingInvoice.invoiceRefNo);
      setItems(editingInvoice.items);
    }
  }, [editingInvoice, setItems]);

  // Apply settings defaults
  useEffect(() => {
    setCurrency(settings.defaultCurrency || 'PKR');
    // Set API environment based on settings
    if (sellers.length > 0) {
      const seller = sellers[0];
      const token = settings.defaultEnvironment === 'production' 
        ? seller.productionToken 
        : seller.sandboxToken;
      if (token) {
        setApiToken(token, settings.defaultEnvironment === 'production');
      }
    }
  }, [settings.defaultCurrency, settings.defaultEnvironment, sellers, setApiToken]);

  useEffect(() => {
    if (selectedSeller) {
      const seller = sellers.find(s => s.id === selectedSeller);
      if (seller) {
        const prefix = invoiceType === 'Sale Invoice' ? 'SI' : 'DN';
        const nextId = invoiceType === 'Sale Invoice' 
          ? seller.lastSaleInvoiceId 
          : seller.lastDebitNoteId;
        setInvoiceRef(`${prefix}-${nextId.toString().padStart(4, '0')}`);
      }
    }
  }, [selectedSeller, invoiceType, sellers]);

  useEffect(() => {
    if (sellers.length > 0 && !selectedSeller && !editingInvoice) {
      setSelectedSeller(sellers[0].id);
    }
  }, [sellers, selectedSeller, editingInvoice]);

  useEffect(() => {
    if (buyers.length > 0 && !selectedBuyer && !editingInvoice) {
      setSelectedBuyer(buyers[0].id);
    }
  }, [buyers, selectedBuyer, editingInvoice]);

  const generateInvoicePayload = () => {
    const seller = sellers.find(s => s.id === selectedSeller);
    const buyer = buyers.find(b => b.id === selectedBuyer);

    if (!seller || !buyer) return null;

    const payload = {
      invoiceType,
      invoiceDate,
      sellerNTNCNIC: seller.ntn,
      sellerBusinessName: seller.businessName,
      sellerProvince: seller.province,
      sellerAddress: seller.address,
      buyerNTNCNIC: buyer.ntn,
      buyerBusinessName: buyer.businessName,
      buyerRegistrationType: buyer.registrationType,
      buyerProvince: buyer.province,
      buyerAddress: buyer.address,
      invoiceRefNo: invoiceRef,
      currency,
      items: items.map((item, index) => {
        const value = item.quantity * item.unitPrice;
        const salesTaxApplicable = (value * item.taxRate) / 100;
        const totalValues = value + salesTaxApplicable;

        const sroSchedule = item.sroScheduleOptions?.find(s => s.srO_ID == item.sroSchedule);
        const sroScheduleNo = sroSchedule && 'srO_DESC' in sroSchedule ? sroSchedule.srO_DESC : "";

        const sroItemData = item.sroItemOptions?.find(si => si.srO_ITEM_ID == item.sroItem);
        const sroItemSerialNo = sroItemData ? sroItemData.srO_ITEM_DESC : "" as string;

        return {
          itemSNo: (index + 1).toString(),
          hsCode: item.hsCode,
          productDescription: item.description,
          rate: `${item.taxRate.toFixed(2)}%`,
          uoM: item.uom || "",
          quantity: item.quantity,
          valueSalesExcludingST: value,
          salesTaxApplicable: salesTaxApplicable,
          salesTaxWithheldAtSource: 0,
          extraTax: 0,
          furtherTax: 0,
          totalValues: totalValues,
          sroScheduleNo: sroScheduleNo,
          fedPayable: scenarioId === "SN018" ? 50 : 0,
          discount: 0,
          saleType: item.saleType || "Services",
          sroItemSerialNo: sroItemSerialNo,
          fixedNotifiedValueOrRetailPrice: 0,
        };
      }),
    };

    // Add scenario ID only for sandbox mode
    if (settings.defaultEnvironment === 'sandbox' && scenarioId) {
      (payload as Record<string, unknown>).scenarioId = scenarioId;
    }

    return payload;
  };

  const handleViewJSON = () => {
    const payload = generateInvoicePayload();
    if (payload) {
      setInvoicePayload(payload);
      setJsonDialogOpen(true);
    } else {
      toast.error('Please select seller and buyer first');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedSeller || !selectedBuyer) {
      toast.error('Please fill in all required fields');
      return;
    }

    const confirmed = confirm('Are you sure you want to save as draft? This will save the current invoice and reset the form.');
    if (!confirmed) return;

    try {
      const seller = sellers.find(s => s.id === selectedSeller);
      const buyer = buyers.find(b => b.id === selectedBuyer);
      
      if (!seller || !buyer) {
        toast.error('Selected seller or buyer not found');
        return;
      }

      const grossAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const salesTax = items.reduce((sum, item) => {
        const amount = item.quantity * item.unitPrice;
        return sum + (amount * item.taxRate / 100);
      }, 0);

      const invoice: Invoice = {
        id: editingInvoice?.id || Date.now().toString(),
        invoiceRefNo: invoiceRef,
        invoiceType,
        invoiceDate,
        sellerId: selectedSeller,
        buyerId: selectedBuyer,
        scenarioId: scenarioId || undefined,
        currency,
        items: [...items],
        status: 'draft',
        grossAmount,
        salesTax,
        totalAmount: grossAmount + salesTax,
        createdAt: editingInvoice?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (editingInvoice) {
        await updateInvoice(invoice);
      } else {
        await addInvoice(invoice);
        
        // Update seller's invoice counter
        // Note: You would need to add updateSeller to the database context
      }

      // Reset form
      setSelectedSeller('');
      setSelectedBuyer('');
      setInvoiceType('Sale Invoice');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setCurrency(settings.defaultCurrency || 'PKR');
      setScenarioId('');
      setInvoiceRef('');
      clearItems();
      
      toast.success('Invoice saved as draft successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSeller || !selectedBuyer) {
      toast.error('Please select seller and buyer');
      return;
    }

    if (settings.defaultEnvironment === 'sandbox' && !scenarioId) {
      toast.error('Please select a scenario for sandbox mode');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item to the invoice');
      return;
    }

    setIsSubmitting(true);

    try {
      const seller = sellers.find(s => s.id === selectedSeller);
      const buyer = buyers.find(b => b.id === selectedBuyer);
      
      if (!seller || !buyer) {
        toast.error('Selected seller or buyer not found');
        return;
      }

      // Set up API service
      const token = settings.defaultEnvironment === 'production' 
        ? seller.productionToken 
        : seller.sandboxToken;
      
      if (!token) {
        toast.error(`No ${settings.defaultEnvironment} token available for seller`);
        return;
      }

      apiService.setToken(token);
      apiService.setEnvironment(settings.defaultEnvironment === 'production');

      const payload = generateInvoicePayload();
      if (!payload) {
        toast.error('Failed to generate invoice payload');
        return;
      }

      // Step 1: Validate
      toast.info('📋 Validating invoice data...');
      const validateResponse = await apiService.validateInvoice(payload);
      
      const statusCode = (validateResponse.validationResponse as { statusCode?: string })?.statusCode || '';
      
      if (statusCode === "00") {
        // Step 2: Submit
        toast.info('📤 Submitting invoice to FBR system...');
        const submitResponse = await apiService.submitInvoice(payload);

        // Save to database
        const grossAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const salesTax = items.reduce((sum, item) => {
          const amount = item.quantity * item.unitPrice;
          return sum + (amount * item.taxRate / 100);
        }, 0);

        const invoice: Invoice = {
          id: editingInvoice?.id || Date.now().toString(),
          invoiceRefNo: invoiceRef,
          fbrInvoiceNumber: submitResponse.invoiceNumber as string | undefined,
          invoiceType,
          invoiceDate,
          sellerId: selectedSeller,
          buyerId: selectedBuyer,
          scenarioId: scenarioId || undefined,
          currency,
          items: [...items],
          status: 'submitted',
          grossAmount,
          salesTax,
          totalAmount: grossAmount + salesTax,
          submissionResponse: submitResponse,
          createdAt: editingInvoice?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        if (editingInvoice) {
          await updateInvoice(invoice);
        } else {
          await addInvoice(invoice);
        }

        toast.success(`Invoice submitted successfully! FBR Invoice ID: ${submitResponse.invoiceNumber}`);
        
        // Reset form after successful submission
        setSelectedSeller('');
        setSelectedBuyer('');
        setInvoiceType('Sale Invoice');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setCurrency(settings.defaultCurrency || 'PKR');
        setScenarioId('');
        setInvoiceRef('');
        clearItems();
        
      } else {
        const vr = validateResponse.validationResponse;
        throw new Error(typeof vr === 'object' && vr !== null && 'error' in vr ? String(vr.error) : 'Validation failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const confirmed = confirm('Are you sure you want to reset the form? All entered data will be lost.');
    if (!confirmed) return;

    setSelectedSeller('');
    setSelectedBuyer('');
    setInvoiceType('Sale Invoice');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setCurrency(settings.defaultCurrency || 'PKR');
    setScenarioId('');
    setInvoiceRef('');
    clearItems();
    toast.info('Form has been reset');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="text-muted-foreground">
            {editingInvoice ? 'Update your digital invoice' : 'Generate digital invoices for FBR submission'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 dark:from-blue-950 dark:to-purple-950 dark:text-blue-300 dark:border-blue-800">
          {editingInvoice ? 'Edit Mode' : 'Create Mode'}
        </Badge>
      </div>

      {/* Seller & Buyer Information */}
      <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Building2 className="h-5 w-5" />
            Seller & Buyer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seller" className="text-green-700 dark:text-green-300 font-medium">Seller</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger className="border-green-200 focus:border-green-500 hover:border-green-300 transition-colors">
                  <SelectValue placeholder="Select seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.businessName} ({seller.ntn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer" className="text-blue-700 dark:text-blue-300 font-medium">Buyer</Label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Select buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.businessName} ({buyer.ntn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <FileText className="h-5 w-5" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceType" className="text-purple-700 dark:text-purple-300 font-medium">Invoice Type</Label>
              <Select value={invoiceType} onValueChange={(value: 'Sale Invoice' | 'Debit Note') => setInvoiceType(value)}>
                <SelectTrigger className="border-purple-200 focus:border-purple-500 hover:border-purple-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sale Invoice">Sale Invoice</SelectItem>
                  <SelectItem value="Debit Note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate" className="text-pink-700 dark:text-pink-300 font-medium">Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border-pink-200 focus:border-pink-500 hover:border-pink-300 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-indigo-700 dark:text-indigo-300 font-medium">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="border-indigo-200 focus:border-indigo-500 hover:border-indigo-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.defaultEnvironment === 'sandbox' && (
              <div className="space-y-2">
                <Label htmlFor="scenarioId" className="text-orange-700 dark:text-orange-300 font-medium">Scenario ID</Label>
                <Select value={scenarioId} onValueChange={setScenarioId}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-500 hover:border-orange-300 transition-colors">
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SN001">SN001 - Standard Rate to Registered</SelectItem>
                    <SelectItem value="SN002">SN002 - Standard Rate to Unregistered</SelectItem>
                    <SelectItem value="SN018">SN018 - Sale of Services (FED)</SelectItem>
                    <SelectItem value="SN019">SN019 - Sale of Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invoiceRef" className="text-teal-700 dark:text-teal-300 font-medium">Invoice Reference No</Label>
              <Input
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="Auto-generated"
                className="bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800 font-medium"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items Component */}
      <InvoiceItems 
        selectedSeller={selectedSeller}
        selectedBuyer={selectedBuyer}
        invoiceDate={invoiceDate}
        currency={currency}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-6 rounded-lg shadow-sm border">
        <Button 
          variant="outline" 
          onClick={handleReset} 
          className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950 transition-all duration-200"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Form
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleViewJSON} 
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950 transition-all duration-200"
        >
          <Code className="h-4 w-4 mr-2" />
          View JSON
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSaveDraft} 
          className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-950 transition-all duration-200"
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {editingInvoice ? 'Update Invoice' : 'Submit to FBR'}
            </>
          )}
        </Button>
      </div>

      {/* JSON Viewer Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-700 dark:text-blue-300">
              Invoice JSON Payload
            </DialogTitle>
            <DialogDescription>
              Review the JSON payload that will be sent to FBR
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={invoicePayload ? JSON.stringify(invoicePayload, null, 2) : ''}
              readOnly
              className="min-h-[400px] font-mono text-sm bg-gray-50 dark:bg-gray-900"
            />
            
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (invoicePayload) {
                    navigator.clipboard.writeText(JSON.stringify(invoicePayload, null, 2));
                    toast.success('JSON copied to clipboard');
                  }
                }}
              >
                Copy JSON
              </Button>
              <Button onClick={() => setJsonDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}