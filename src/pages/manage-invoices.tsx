import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Eye, Edit, Download, Trash2, Printer, FileDown } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { Invoice } from '@/lib/database';
import { UniversalTableLayout } from '@/components/ui/universal-table-layout';
import { InvoiceViewer } from '@/components/invoice/invoice-viewer';
import { Column } from '@/components/ui/data-table';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function ManageInvoices() {
  const { invoices, sellers, buyers, deleteInvoice } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState('all');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');

  // Get unique values for filter options from sellers data
  const registrationTypes = useMemo(() => {
    const types = [...new Set(sellers.map(seller => seller.registrationType).filter(Boolean))];
    return types.sort();
  }, [sellers]);

  const registrationStatuses = useMemo(() => {
    const statuses = [...new Set(sellers.map(seller => seller.registrationStatus).filter(Boolean))];
    return statuses.sort();
  }, [sellers]);

  const businessActivities = useMemo(() => {
    const activities = [...new Set(sellers.map(seller => seller.businessActivity).filter(Boolean))];
    return activities.sort();
  }, [sellers]);

  // Filter invoices with date range
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Date range filter
      if (dateRangeStart && dateRangeEnd) {
        const invoiceDate = new Date(invoice.invoiceDate);
        const startDate = new Date(dateRangeStart);
        const endDate = new Date(dateRangeEnd);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      }
      return true;
    });
  }, [invoices, dateRangeStart, dateRangeEnd]);
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewerOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Navigate to edit page
    window.location.href = `/edit-invoice/${invoice.id}`;
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDownloadDialogOpen(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewerOpen(true);
    // Print functionality will be handled in the viewer
  };

  const executeDownload = () => {
    if (!selectedInvoice) return;

    switch (downloadFormat) {
      case 'pdf':
        // PDF download logic
        toast.info('PDF download functionality will be implemented');
        break;
      case 'excel':
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([selectedInvoice]);
        XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
        XLSX.writeFile(wb, `invoice-${selectedInvoice.invoiceRefNo}.xlsx`);
        toast.success('Excel file downloaded successfully');
        break;
      case 'json':
        const dataStr = JSON.stringify(selectedInvoice, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${selectedInvoice.invoiceRefNo}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('JSON file downloaded successfully');
        break;
    }
    setDownloadDialogOpen(false);
  };

  const handleDelete = (id: string, status: string) => {
    if (status === 'submitted') {
      alert('Cannot delete a submitted invoice');
      return;
    }
    
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
    }
  };

  const handleAddInvoice = () => {
    // Navigate to create page
    window.location.href = '/create-invoice';
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredInvoices, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invoices.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Invoices exported successfully');
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Draft</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Submitted</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Dynamic filter configuration for UniversalTableLayout
  const dynamicFilters = {
    enableDateFilter: true,
    dateField: 'invoiceDate',
    enableStatusFilter: true,
    statusOptions: ['draft', 'submitted', 'failed']
  };

  const columns = [
    {
      header: "Invoice Ref",
      accessorKey: "invoiceRefNo",
      cell: (invoice: Invoice) => (
        <div className="font-medium">
          {invoice.invoiceRefNo}
          {invoice.isDummy && <Badge variant="outline" className="ml-2 text-xs">DUMMY</Badge>}
        </div>
      )
    },
    {
      header: "FBR Invoice No",
      accessorKey: "fbrInvoiceNumber",
      cell: (invoice: Invoice) => (
        <span>
          {invoice.fbrInvoiceNumber || '-'}
        </span>
      )
    },
    {
      header: "Date",
      accessorKey: "invoiceDate",
      cell: (invoice: Invoice) => (
        <span>
          {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
        </span>
      )
    },
    {
      header: "Seller",
      accessorKey: "sellerId",
      cell: (invoice: Invoice) => {
        const seller = sellers.find(s => s.id === invoice.sellerId);
        return (
          <div>
            <div className="font-medium">{seller?.businessName}</div>
            <div className="text-xs text-muted-foreground">{seller?.ntn}</div>
          </div>
        );
      }
    },
    {
      header: "Buyer",
      accessorKey: "buyerId",
      cell: (invoice: Invoice) => {
        const buyer = buyers.find(b => b.id === invoice.buyerId);
        return (
          <div>
            <div className="font-medium">{buyer?.businessName}</div>
            <div className="text-xs text-muted-foreground">{buyer?.ntn}</div>
          </div>
        );
      }
    },
    {
      header: "Amount",
      accessorKey: "totalAmount",
      cell: (invoice: Invoice) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          {invoice.currency} {invoice.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (invoice: Invoice) => getStatusBadge(invoice.status)
    }
  ];

  // Define actions for the data table
  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewInvoice,
      tooltip: "View Invoice"
    },
    {
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditInvoice,
      disabled: (invoice: Invoice) => invoice.status === 'submitted',
      tooltip: "Edit Invoice"
    },
    {
      icon: <Download className="h-4 w-4" />,
      onClick: handleDownloadInvoice,
      tooltip: "Download Invoice"
    },
    {
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (invoice: Invoice) => handleDelete(invoice.id, invoice.status),
      disabled: (invoice: Invoice) => invoice.status === 'submitted',
      className: "hover:bg-red-50 dark:hover:bg-red-950/30",
      tooltip: "Delete Invoice"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Custom Header with External Filters */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Manage Invoices
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage invoices for your business
              </p>
            </div>
          </div>
          
          {/* Stats Badge */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 text-blue-700 dark:text-blue-300">
              {filteredInvoices.length} total invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-700 dark:text-blue-300">From Date</label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-700 dark:text-blue-300">To Date</label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Table with Internal Filters Disabled */}
      <UniversalTableLayout
        title="Invoices"
        description=""
        icon={<FileText className="h-5 w-5" />}
        data={filteredInvoices}
        columns={columns as Column<Invoice>[]}
        actions={actions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search invoices..."
        dynamicFilters={dynamicFilters}
        showInternalFilters={true}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isInfiniteScroll={isInfiniteScroll}
        setIsInfiniteScroll={setIsInfiniteScroll}
        addButtonLabel="Add Invoice"
        onAddClick={handleAddInvoice}
        onExportClick={handleExport}
        emptyState={{
          icon: <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />,
          title: "No invoices found",
          description: "Create your first invoice to get started"
        }}
        headerClassName="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
        rowClassName="bg-white dark:bg-gray-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/30"
        accentColor="blue"
      />

      {/* Download Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-700 dark:text-blue-300">
              Download Invoice
            </DialogTitle>
            <DialogDescription>
              Choose the format to download the invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Download Format</label>
              <Select value={downloadFormat} onValueChange={(value: 'pdf' | 'excel' | 'json') => setDownloadFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeDownload} className="bg-blue-600 hover:bg-blue-700">
                <FileDown className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Invoice Viewer Modal */}
      <InvoiceViewer 
        invoice={selectedInvoice}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}