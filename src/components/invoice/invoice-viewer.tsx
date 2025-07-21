import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Eye, FileText, Code, Printer } from 'lucide-react';
import { Invoice } from '@/lib/database';
import { useDatabase } from '@/hooks/use-database';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InvoiceViewerProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceViewer({ invoice, open, onOpenChange }: InvoiceViewerProps) {
  const { sellers, buyers } = useDatabase();
  const [activeTab, setActiveTab] = useState('preview');

  if (!invoice) return null;

  const seller = sellers.find(s => s.id === invoice.sellerId);
  const buyer = buyers.find(b => b.id === invoice.buyerId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'submitted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Submitted</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(invoice, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoiceRefNo}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('JSON downloaded successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <FileText className="h-5 w-5" />
            Invoice Details - {invoice.invoiceRefNo}
          </DialogTitle>
          <DialogDescription>
            View invoice preview and JSON data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                {invoice.invoiceRefNo}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(invoice.status)}
              {invoice.fbrInvoiceNumber && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  FBR: {invoice.fbrInvoiceNumber}
                </p>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              {/* Invoice Preview - Printable Format */}
              <div className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none print:border-none" id="invoice-preview">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                    <p className="text-gray-600 mt-2">Invoice #: {invoice.invoiceRefNo}</p>
                    {invoice.fbrInvoiceNumber && (
                      <p className="text-gray-600">FBR Invoice #: {invoice.fbrInvoiceNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Date: {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</p>
                    <p className="text-gray-600">Type: {invoice.invoiceType}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>

                {/* Seller and Buyer Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">From:</h3>
                    <div className="text-gray-700">
                      <p className="font-medium">{seller?.businessName}</p>
                      <p>NTN: {seller?.ntn}</p>
                      <p>{seller?.address}</p>
                      <p>{seller?.province}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">To:</h3>
                    <div className="text-gray-700">
                      <p className="font-medium">{buyer?.businessName}</p>
                      <p>NTN: {buyer?.ntn}</p>
                      <p>{buyer?.address}</p>
                      <p>{buyer?.province}</p>
                    </div>
                  </div>
                </div>
                {/* Items Table */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Items:</h3>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">HS Code</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Tax %</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => {
                        const lineTotal = (item.quantity * item.unitPrice) * (1 + item.taxRate / 100);
                        return (
                          <tr key={item.id}>
                            <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.hsCode}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity} {item.uom}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{invoice.currency} {item.unitPrice.toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{item.taxRate}%</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{invoice.currency} {lineTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-b">
                      <span>Gross Amount:</span>
                      <span>{invoice.currency} {invoice.grossAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Sales Tax:</span>
                      <span>{invoice.currency} {invoice.salesTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg border-b-2 border-gray-900">
                      <span>Total Amount:</span>
                      <span>{invoice.currency} {invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <pre className="text-sm">
                  {JSON.stringify(invoice, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadJSON} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}