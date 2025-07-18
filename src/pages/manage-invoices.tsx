import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Edit, Download, Trash2 } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { Invoice } from '@/lib/database';
// import { InvoiceViewer } from '@/components/invoice-viewer';
import { UniversalTableLayout } from '@/components/ui/universal-table-layout';
import { InvoiceViewer } from '@/components/invoice/invoice-viewer';
import { Column } from '@/components/ui/data-table';

export function ManageInvoices() {
  const { invoices, sellers, buyers, deleteInvoice } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Filter invoices based on search term, status, and date
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Search filter
      const matchesSearch = 
        invoice.invoiceRefNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.fbrInvoiceNumber && invoice.fbrInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sellers.find(s => s.id === invoice.sellerId)?.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyers.find(b => b.id === invoice.buyerId)?.businessName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      const invoiceDate = new Date(invoice.invoiceDate);
      const now = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = (
          invoiceDate.getDate() === now.getDate() &&
          invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear()
        );
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchesDate = invoiceDate >= oneWeekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = (
          invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear()
        );
      } else if (dateFilter === 'year') {
        matchesDate = invoiceDate.getFullYear() === now.getFullYear();
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter, sellers, buyers]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewerOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Navigate to edit page
    window.location.href = `/edit-invoice/${invoice.id}`;
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Placeholder for download functionality
    console.log('Download invoice:', invoice.id);
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
    const dataStr = JSON.stringify(invoices, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invoices.json';
    link.click();
    URL.revokeObjectURL(url);
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

  // Define filters for the universal table layout
  const filters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'failed', label: 'Failed' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      id: 'date',
      label: 'Date Range',
      options: [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' }
      ],
      value: dateFilter,
      onChange: setDateFilter
    }
  ];

  // Define columns for the data table
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
      <UniversalTableLayout
        title="Manage Invoices"
        description="Create and manage invoices for your business"
        icon={<FileText className="h-5 w-5" />}
        data={invoices}
        filteredData={filteredInvoices}
        columns={columns as Column<Invoice>[]}
        actions={actions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search invoices..."
        filters={filters}
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

      {/* Invoice Viewer Modal */}
      <InvoiceViewer 
        invoice={selectedInvoice}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}