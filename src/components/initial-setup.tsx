import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Building2 } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { Seller } from '@/lib/database';
import { toast } from 'sonner';

interface InitialSetupProps {
  onComplete: () => void;
}

export function InitialSetup({ onComplete }: InitialSetupProps) {
  const { addSeller } = useDatabase();
  const [formData, setFormData] = useState({
    ntn: '',
    businessName: '',
    businessActivity: '',
    sector: '',
    province: '',
    address: '',
    sandboxToken: '',
    productionToken: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ntn || !formData.businessName || !formData.sandboxToken) {
      toast.error('Please fill in all required fields');
      return;
    }

    const seller: Seller = {
      id: Date.now().toString(),
      ntn: formData.ntn,
      businessName: formData.businessName,
      businessActivity: formData.businessActivity,
      sector: formData.sector,
      scenarioIds: ['SN018', 'SN019'], // Default scenarios
      province: formData.province,
      address: formData.address,
      sandboxToken: formData.sandboxToken.startsWith('Bearer ') 
        ? formData.sandboxToken 
        : `Bearer ${formData.sandboxToken}`,
      productionToken: formData.productionToken 
        ? (formData.productionToken.startsWith('Bearer ') 
          ? formData.productionToken 
          : `Bearer ${formData.productionToken}`)
        : undefined,
      registrationStatus: 'In-Active',
      registrationType: 'unregistered',
      lastSaleInvoiceId: 1,
      lastDebitNoteId: 1,
      preferredMode: 'sandbox',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addSeller(seller);
      toast.success('Initial setup completed successfully!');
      onComplete();
    } catch (error) {
      console.error('Error adding seller:', error);
      toast.error('Failed to save seller information');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <FileText className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to FBR Digital Invoicing</CardTitle>
          <CardDescription>
            Let's set up your first seller profile to get started with digital invoicing
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ntn">NTN *</Label>
                <Input
                  id="ntn"
                  value={formData.ntn}
                  onChange={(e) => setFormData(prev => ({ ...prev, ntn: e.target.value }))}
                  placeholder="Enter your NTN"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Enter business name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessActivity">Business Activity</Label>
                <Select
                  value={formData.businessActivity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, businessActivity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="Importer">Importer</SelectItem>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                    <SelectItem value="Service Provider">Service Provider</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUNJAB">Punjab</SelectItem>
                  <SelectItem value="SINDH">Sindh</SelectItem>
                  <SelectItem value="KHYBER PAKHTUNKHWA">Khyber Pakhtunkhwa</SelectItem>
                  <SelectItem value="BALOCHISTAN">Balochistan</SelectItem>
                  <SelectItem value="CAPITAL TERRITORY">Capital Territory</SelectItem>
                  <SelectItem value="AZAD JAMMU AND KASHMIR">Azad Jammu and Kashmir</SelectItem>
                  <SelectItem value="GILGIT BALTISTAN">Gilgit Baltistan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter business address"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">API Tokens</h3>
              
              <div className="space-y-2">
                <Label htmlFor="sandboxToken">Sandbox Token *</Label>
                <Input
                  id="sandboxToken"
                  value={formData.sandboxToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, sandboxToken: e.target.value }))}
                  placeholder="Bearer your-sandbox-token-here"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Required for testing in sandbox environment
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productionToken">Production Token (Optional)</Label>
                <Input
                  id="productionToken"
                  value={formData.productionToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionToken: e.target.value }))}
                  placeholder="Bearer your-production-token-here"
                />
                <p className="text-sm text-muted-foreground">
                  Add this later when ready for production
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Building2 className="mr-2 h-4 w-4" />
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}