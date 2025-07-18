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
import { Seller } from '@/lib/database';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProvinces } from '@/hooks/useProvinces';
import { UniversalTableLayout } from '@/components/ui/universal-table-layout';
import { Column } from '@/components/ui/data-table';

interface ManageSellersProps {
  initialModalOpen?: boolean;
  onSellerAdded?: () => void;
}

export function ManageSellers({ initialModalOpen = false, onSellerAdded }: ManageSellersProps = {}) {
  const { sellers, addSeller, updateSeller, deleteSeller } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(initialModalOpen);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [formData, setFormData] = useState({
    ntn: '',
    businessName: '',
    businessActivity: '',
    sector: '',
    scenarioIds: '',
    registrationType: '',
    registrationStatus: '',
    province: '',
    address: '',
    sandboxToken: '',
    productionToken: '',
  });

  const { provinces } = useProvinces();

  // Filter sellers based on search term
  const filteredSellers = useMemo(() => {
    return sellers.filter(seller =>
      seller.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.ntn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sellers, searchTerm]);

  const resetForm = () => {
    setFormData({
      ntn: '',
      businessName: '',
      businessActivity: '',
      sector: '',
      scenarioIds: '',
      registrationType: '',
      registrationStatus: '',
      province: '',
      address: '',
      sandboxToken: '',
      productionToken: '',
    });
    setEditingSeller(null);
  };

  const handleEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setFormData({
      ntn: seller.ntn,
      businessName: seller.businessName,
      businessActivity: seller.businessActivity || '',
      sector: seller.sector || '',
      scenarioIds: seller.scenarioIds ? seller.scenarioIds.join(',') : '',
      registrationType: seller.registrationType,
      registrationStatus: seller.registrationStatus || '',
      province: seller.province,
      address: seller.address,
      sandboxToken: seller.sandboxToken || '',
      productionToken: seller.productionToken || '',
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
    if (formData.ntn && !editingSeller) {
      validationResult = await validateNTN(formData.ntn);
    }

    const sellerData: Seller = {
      id: editingSeller?.id || Date.now().toString(),
      ntn: formData.ntn,
      businessName: formData.businessName,
      businessActivity: formData.businessActivity,
      sector: formData.sector,
      scenarioIds: formData.scenarioIds ? formData.scenarioIds.split(',').filter(Boolean) : [],
      registrationType: validationResult?.regType?.type || formData.registrationType || 'Registered',
      province: formData.province,
      address: formData.address,
      registrationStatus: validationResult?.regStatus?.status || editingSeller?.registrationStatus || 'Active',
      sandboxToken: formData.sandboxToken,
      productionToken: formData.productionToken,
      createdAt: editingSeller?.createdAt || new Date(),
      updatedAt: new Date(),
      lastSaleInvoiceId: 0,
      lastDebitNoteId: 0
    };

    try {
      if (editingSeller) {
        await updateSeller(sellerData);
        toast.success('Seller updated successfully');
      } else {
        await addSeller(sellerData);
        toast.success('Seller added successfully');
        
        // Call the onSellerAdded callback if provided
        if (onSellerAdded) {
          onSellerAdded();
        }
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save seller:', error);
      toast.error('Failed to save seller');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this seller?')) {
      await deleteSeller(id);
      toast.success('Seller deleted successfully');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(sellers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sellers.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Sellers exported successfully');
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
      cell: (seller: Seller) => <div className="text-primary">{seller.businessName}</div>
    },
    {
      header: "Province",
      accessorKey: "province",
      className: "text-primary"
    },
    {
      header: "Registration Type",
      accessorKey: "registrationType",
      cell: (seller: Seller) => (
        <Badge 
          variant={seller.registrationType === 'Registered' ? 'default' : 'secondary'}
          className={cn(
            seller.registrationType === 'Registered' 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          )}
        >
          {seller.registrationType}
        </Badge>
      ),
      className: "text-primary"
    },
    {
      header: "Registration Status",
      accessorKey: "registrationStatus",
      cell: (seller: Seller) => (
        <Badge 
          variant={seller.registrationStatus === 'Active' ? 'default' : 'secondary'}
          className={cn(
            seller.registrationStatus === 'Active' 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          )}
        >
          {seller.registrationStatus}
        </Badge>
      )
    },
    {
      header: "Activity",
      accessorKey: "businessActivity",
      className: "text-primary"
    }
  ];

  // Define actions for the data table
  const actions = [
    {
      icon: <span className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">Edit</span>,
      onClick: handleEdit,
      className: "text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950"
    },
    {
      icon: <span className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Delete</span>,
      onClick: (seller: Seller) => handleDelete(seller.id),
      className: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
    }
  ];

  // Special case for initial setup mode
  if (initialModalOpen && sellers.length === 0) {
    return (
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-purple-700 dark:text-purple-300">
                Add Your First Seller
              </DialogTitle>
              <DialogDescription>
                Add a seller profile to get started with invoice generation
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ntn" className="text-purple-700">NTN/CNIC *</Label>
                  <Input
                    id="ntn"
                    value={formData.ntn}
                    onChange={(e) => setFormData(prev => ({ ...prev, ntn: e.target.value }))}
                    onBlur={async (e) => await validateNTN(e.target.value)}
                    placeholder="Enter NTN or CNIC"
                    className="border-purple-200"
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
                <Label htmlFor="businessName" className="text-purple-700">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Enter business name"
                  className="border-purple-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessActivity" className="text-purple-700">Business Activity</Label>
                  <Input
                    id="businessActivity"
                    value={formData.businessActivity}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessActivity: e.target.value }))}
                    placeholder="Enter business activity"
                    className="border-purple-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-purple-700">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="Enter business sector"
                    className="border-purple-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenarioIds" className="text-purple-700">Scenario IDs</Label>
                <Input
                  id="scenarioIds"
                  value={formData.scenarioIds}
                  onChange={(e) => setFormData(prev => ({ ...prev, scenarioIds: e.target.value }))}
                  placeholder="Enter scenario IDs (comma separated)"
                  className="border-purple-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-purple-700">Business Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter complete address"
                  className="border-purple-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sandboxToken" className="text-purple-700">Sandbox API Token</Label>
                  <Input
                    id="sandboxToken"
                    value={formData.sandboxToken}
                    onChange={(e) => setFormData(prev => ({ ...prev, sandboxToken: e.target.value }))}
                    placeholder="Enter sandbox API token"
                    className="border-purple-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionToken" className="text-purple-700">Production API Token</Label>
                  <Input
                    id="productionToken"
                    value={formData.productionToken}
                    onChange={(e) => setFormData(prev => ({ ...prev, productionToken: e.target.value }))}
                    placeholder="Enter production API token"
                    className="border-purple-200"
                  />
                </div>
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
                <Button type="submit" disabled={isValidating} className="bg-purple-600 hover:bg-purple-700">
                  {isValidating ? 'Validating...' : 'Add Seller'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UniversalTableLayout
        title="Manage Sellers"
        description="Add and manage seller profiles for invoice generation"
        icon={<Users className="h-5 w-5" />}
        data={sellers}
        filteredData={filteredSellers}
        columns={columns as Column<Seller>[]}
        actions={actions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search sellers..."
        addButtonLabel="Add Seller"
        onAddClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}
        onExportClick={handleExport}
        emptyState={{
          icon: <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />,
          title: "No sellers found",
          description: "Add your first seller to get started"
        }}
        headerClassName="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
        rowClassName="hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 dark:hover:from-gray-900 dark:hover:to-purple-900/30 transition-colors"
        accentColor="purple"
      />

      {/* Add/Edit Seller Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-purple-700 dark:text-purple-300">
              {editingSeller ? `Editing Seller - ${editingSeller.businessName}` : 'Add New Seller'}
            </DialogTitle>
            <DialogDescription>
              {editingSeller 
                ? 'Update seller information'
                : 'Add a new seller profile for invoice generation'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ntn" className="text-purple-700">NTN/CNIC *</Label>
                <Input
                  id="ntn"
                  value={formData.ntn}
                  onChange={(e) => setFormData(prev => ({ ...prev, ntn: e.target.value }))}
                  onBlur={async (e) => await validateNTN(e.target.value)}
                  placeholder="Enter NTN or CNIC"
                  className="border-purple-200"
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
              <Label htmlFor="businessName" className="text-purple-700">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Enter business name"
                className="border-purple-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessActivity" className="text-purple-700">Business Activity</Label>
                <Input
                  id="businessActivity"
                  value={formData.businessActivity}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessActivity: e.target.value }))}
                  placeholder="Enter business activity"
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector" className="text-purple-700">Sector</Label>
                <Input
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                  placeholder="Enter business sector"
                  className="border-purple-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenarioIds" className="text-purple-700">Scenario IDs</Label>
              <Input
                id="scenarioIds"
                value={formData.scenarioIds}
                onChange={(e) => setFormData(prev => ({ ...prev, scenarioIds: e.target.value }))}
                placeholder="Enter scenario IDs (comma separated)"
                className="border-purple-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-purple-700">Business Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete address"
                className="border-purple-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sandboxToken" className="text-purple-700">Sandbox API Token</Label>
                <Input
                  id="sandboxToken"
                  value={formData.sandboxToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, sandboxToken: e.target.value }))}
                  placeholder="Enter sandbox API token"
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionToken" className="text-purple-700">Production API Token</Label>
                <Input
                  id="productionToken"
                  value={formData.productionToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionToken: e.target.value }))}
                  placeholder="Enter production API token"
                  className="border-purple-200"
                />
              </div>
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
              <Button type="submit" disabled={isValidating} className="bg-purple-600 hover:bg-purple-700">
                {isValidating ? 'Validating...' : (editingSeller ? 'Update Seller' : 'Add Seller')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}