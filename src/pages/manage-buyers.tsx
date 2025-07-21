import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { Buyer } from '@/lib/database';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProvinces } from '@/hooks/useProvinces';
import { UniversalTableLayout } from '@/components/ui/universal-table-layout';
import { Column } from '@/components/ui/data-table';

export function ManageBuyers() {
  const { buyers, addBuyer, updateBuyer, deleteBuyer } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState('all');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [formData, setFormData] = useState({
    ntn: '',
    businessName: '',
    registrationType: '',
    registrationStatus: '',
    province: '',
    address: '',
  });

  const { provinces } = useProvinces();

  // Get unique values for filter options
  const registrationTypes = useMemo(() => {
    const types = [...new Set(buyers.map(buyer => buyer.registrationType).filter(Boolean))];
    return types.sort();
  }, [buyers]);

  const registrationStatuses = useMemo(() => {
    const statuses = [...new Set(buyers.map(buyer => buyer.registrationStatus).filter(Boolean))];
    return statuses.sort();
  }, [buyers]);

  // Filter buyers based on search term and filters
  const filteredBuyers = useMemo(() => {
    return buyers.filter(buyer => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        buyer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.ntn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.province.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Registration Type filter
      const matchesRegistrationType = registrationTypeFilter === 'all' || 
        buyer.registrationType === registrationTypeFilter;
      
      // Registration Status filter
      const matchesRegistrationStatus = registrationStatusFilter === 'all' || 
        buyer.registrationStatus === registrationStatusFilter;
      
      return matchesSearch && matchesRegistrationType && matchesRegistrationStatus;
    });
  }, [buyers, searchTerm, registrationTypeFilter, registrationStatusFilter]);

  const resetForm = () => {
    setFormData({
      ntn: '',
      businessName: '',
      registrationType: '',
      registrationStatus: '',
      province: '',
      address: '',
    });
    setEditingBuyer(null);
  };

  const handleEdit = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setFormData({
      ntn: buyer.ntn,
      businessName: buyer.businessName,
      registrationType: buyer.registrationType,
      registrationStatus: buyer.registrationStatus || '',
      province: buyer.province,
      address: buyer.address,
    });
    setIsDialogOpen(true);
  };

  const validateNTN = async (ntn: string) => {
    try {
      setIsValidating(true);
      const result = await apiService.validateNTN(ntn);
      if (result) {
        setFormData(prev => ({
          ...prev,
          registrationStatus: result.regStatus.status,
          registrationType: result.regType.type
        }));
      }
      return result;
    } catch (error) {
      console.error('NTN validation error:', error);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ntn || !formData.businessName) {
      toast.error('Please fill in all required fields');
      return;
    }

    let validationResult = null;
    if (formData.ntn && !editingBuyer) {
      validationResult = await validateNTN(formData.ntn);
    }

    const buyerData: Buyer = {
      id: editingBuyer?.id || Date.now().toString(),
      ntn: formData.ntn,
      businessName: formData.businessName,
      registrationType: validationResult?.regType?.type || formData.registrationType || 'Registered',
      province: formData.province,
      address: formData.address,
      registrationStatus: validationResult?.regStatus?.status || editingBuyer?.registrationStatus || 'Active',
      createdAt: editingBuyer?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      if (editingBuyer) {
        await updateBuyer(buyerData);
        toast.success('Buyer updated successfully');
      } else {
        await addBuyer(buyerData);
        toast.success('Buyer added successfully');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save buyer:', error);
      toast.error('Failed to save buyer');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this buyer?')) {
      await deleteBuyer(id);
      toast.success('Buyer deleted successfully');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(buyers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'buyers.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Buyers exported successfully');
  };

  // Define columns for the data table
  const columns = [
    {
      header: "NTN/CNIC",
      accessorKey: "ntn",
      className: "font-medium text-primary"
    },
    {
      header: "Business Name",
      accessorKey: "businessName",
      cell: (buyer: Buyer) => <div className="text-primary">{buyer.businessName}</div>
    },
    {
      header: "Province",
      accessorKey: "province",
      className: "text-primary"
    },
    {
      header: "Registration Type",
      accessorKey: "registrationType",
      cell: (buyer: Buyer) => (
        <Badge 
          variant={buyer.registrationType === 'Registered' ? 'default' : 'secondary'}
          className={cn(
            buyer.registrationType === 'Registered' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          )}
        >
          {buyer.registrationType}
        </Badge>
      ),
      className: "text-primary"
    },
    {
      header: "Registration Status",
      accessorKey: "registrationStatus",
      cell: (buyer: Buyer) => (
        <Badge 
          variant={buyer.registrationStatus === 'Active' ? 'default' : 'secondary'}
          className={cn(
            buyer.registrationStatus === 'Active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          )}
        >
          {buyer.registrationStatus}
        </Badge>
      )
    }
  ];

  // Define actions for the data table
  const actions = [
    {
      icon: <span className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">Edit</span>,
      onClick: handleEdit,
      className: "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
    },
    {
      icon: <span className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Delete</span>,
      onClick: (buyer: Buyer) => handleDelete(buyer.id),
      className: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Custom Header with External Filters */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-green-900 dark:text-green-100">
                Manage Buyers
              </h1>
              <p className="text-muted-foreground mt-1">
                Add and manage buyer profiles for invoice generation
              </p>
            </div>
          </div>
          
          {/* Stats Badge */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 text-green-700 dark:text-green-300">
              {buyers.length} total buyer{buyers.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

      </div>
      
      {/* Table with Internal Filters Enabled */}
      <UniversalTableLayout
        title="Buyers"
        description=""
        icon={<Users className="h-5 w-5" />}
        data={filteredBuyers}
        columns={columns as Column<Buyer>[]}
        actions={actions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search buyers..."
        showInternalFilters={true}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dynamicFilters={{
          enableDateFilter: true,
          enableStatusFilter: true,
          statusOptions: registrationStatuses
        }}
        addButtonLabel="Add Buyer"
        onAddClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}
        onExportClick={handleExport}
        emptyState={{
          icon: <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />,
          title: "No buyers found",
          description: "Add your first buyer to get started"
        }}
        headerClassName="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
        rowClassName="bg-white dark:bg-gray-950 hover:bg-green-50/30 dark:hover:bg-green-950/30"
        accentColor="green"
      />

      {/* Add/Edit Buyer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-green-700 dark:text-green-300">
              {editingBuyer ? `Editing Buyer - ${editingBuyer.businessName}` : 'Add New Buyer'}
            </DialogTitle>
            <DialogDescription>
              {editingBuyer 
                ? 'Update buyer information'
                : 'Add a new buyer profile for invoice generation'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ntn" className="text-green-700">NTN/CNIC *</Label>
                <Input
                  id="ntn"
                  value={formData.ntn}
                  onChange={(e) => setFormData(prev => ({ ...prev, ntn: e.target.value }))}
                  onBlur={async (e) => await validateNTN(e.target.value)}
                  placeholder="Enter NTN or CNIC"
                  className="border-green-200"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="province" className="text-indigo-700 dark:text-indigo-300">Province *</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                >
                  <SelectTrigger className="border-indigo-200 focus:border-indigo-500">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((prov) => (
                      <SelectItem key={prov.stateProvinceCode} value={prov.stateProvinceDesc}>
                        {prov.stateProvinceDesc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-green-700">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Enter business name"
                className="border-green-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-green-700">Business Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete address"
                className="border-green-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationType" className="text-indigo-700">Registration Type *</Label>
                <Input
                  placeholder="Will be validated automatically"
                  value={formData.registrationType}
                  readOnly
                  required
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationStatus" className="text-indigo-700">Registration Status *</Label>
                <Input
                  value={formData.registrationStatus}
                  readOnly
                  required
                  placeholder="Will be validated automatically"
                  className="bg-gray-50"
                />
              </div>
            </div>
          
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isValidating} className="bg-green-600 hover:bg-green-700">
                {isValidating ? 'Validating...' : (editingBuyer ? 'Update Buyer' : 'Add Buyer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}