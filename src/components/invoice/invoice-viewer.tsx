import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Eye, FileText, QrCode } from 'lucide-react';
import { Invoice } from '@/lib/database';
import { useDatabase } from '@/hooks/use-database';
import { format } from 'date-fns';

interface InvoiceViewerProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceViewer({ invoice, open, onOpenChange }: InvoiceViewerProps) {
  const { sellers, buyers } = useDatabase();
  const [activeTab, setActiveTab] = useState('details');

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

  const handleDownloadPDF = () => {
    // Implement PDF download functionality
    console.log('Download PDF for invoice:', invoice.id);
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
            View complete invoice information and download options
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
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Information */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Seller Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-green-700 dark:text-green-300">Name:</span> {seller?.businessName}</p>
                    <p><span className="font-medium text-green-700 dark:text-green-300">NTN:</span> {seller?.ntn}</p>
                    <p><span className="font-medium text-green-700 dark:text-green-300">Address:</span> {seller?.address}</p>
                    <p><span className="font-medium text-green-700 dark:text-green-300">Province:</span> {seller?.province}</p>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Buyer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-blue-700 dark:text-blue-300">Name:</span> {buyer?.businessName}</p>
                    <p><span className="font-medium text-blue-700 dark:text-blue-300">NTN:</span> {buyer?.ntn}</p>
                    <p><span className="font-medium text-blue-700 dark:text-blue-300">Address:</span> {buyer?.address}</p>
                    <p><span className="font-medium text-blue-700 dark:text-blue-300">Province:</span> {buyer?.province}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">Invoice Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-300">Type:</p>
                    <p>{invoice.invoiceType}</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-300">Currency:</p>
                    <p>{invoice.currency}</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-300">Gross Amount:</p>
                    <p>{invoice.currency} {invoice.grossAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-300">Total Amount:</p>
                    <p className="font-bold">{invoice.currency} {invoice.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-blue-700 dark:text-blue-300">Item {index + 1}</h5>
                      <Badge variant="outline" className="text-green-700 bg-green-50">
                        {invoice.currency} {((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">HS Code:</p>
                        <p className="font-mono">{item.hsCode}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Quantity:</p>
                        <p>{item.quantity} {item.uom}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Unit Price:</p>
                        <p>{invoice.currency} {item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Tax Rate:</p>
                        <p>{item.taxRate}%</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="font-medium text-gray-700 dark:text-gray-300">Description:</p>
                      <p className="text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <pre className="text-sm overflow-x-auto">
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
            <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}