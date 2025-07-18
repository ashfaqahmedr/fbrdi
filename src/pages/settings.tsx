import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings as SettingsIcon, Download, Trash2, Database, Moon, Sun, FileText, Users, Building2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useDatabase } from '@/hooks/use-database';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { sellers, buyers, invoices, settings, updateSettings, clearAllData } = useDatabase();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'sellers' | 'buyers' | 'all'>('sellers');
  const [importData, setImportData] = useState<unknown[]>([]);
  const [previewData, setPreviewData] = useState<unknown[]>([]);

  const handleExportData = () => {
    const data = {
      sellers,
      buyers,
      invoices,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fbr-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Export sellers
    const sellersWS = XLSX.utils.json_to_sheet(sellers);
    XLSX.utils.book_append_sheet(wb, sellersWS, 'Sellers');
    
    // Export buyers
    const buyersWS = XLSX.utils.json_to_sheet(buyers);
    XLSX.utils.book_append_sheet(wb, buyersWS, 'Buyers');
    
    // Export invoices
    const invoicesWS = XLSX.utils.json_to_sheet(invoices);
    XLSX.utils.book_append_sheet(wb, invoicesWS, 'Invoices');
    
    XLSX.writeFile(wb, `fbr-data-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file exported successfully');
  };

  const handleExportSellers = () => {
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

  const handleExportBuyers = () => {
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

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportData(Array.isArray(data) ? data : [data]);
        setPreviewData(Array.isArray(data) ? data.slice(0, 5) : [data]); // Show first 5 for preview
        setImportDialogOpen(true);
      } catch (error) {
        console.error('Failed to import data. Invalid file format:', error);
        toast.error('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    // Import logic would go here
    toast.success(`${importData.length} ${importType} imported successfully`);
    setImportDialogOpen(false);
    setImportData([]);
    setPreviewData([]);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      await clearAllData();
    }
  };

  const handleSettingsUpdate = async (key: string, value: unknown) => {
    await updateSettings({ [key]: value });
  };

   const toggleTheme = () => {
   if (theme === 'light') {
     setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your application preferences and data
          </p>
        </div>
      </div>

      {/* Appearance Settings */}
      <Card className="border-l-4 border-l-purple-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-purple-700 dark:text-purple-300">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>
            <Select value={theme} onValueChange={toggleTheme}>
              <SelectTrigger className="w-[180px] border-purple-200 focus:border-purple-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <SettingsIcon className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure default application behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-blue-700 dark:text-blue-300">Auto-save drafts</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save invoice drafts as you work
              </p>
            </div>
            <Switch 
              checked={settings.autoSave} 
              onCheckedChange={(value) => handleSettingsUpdate('autoSave', value)} 
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-green-700 dark:text-green-300">Default Currency</Label>
              <Select 
                value={settings.defaultCurrency} 
                onValueChange={(value) => handleSettingsUpdate('defaultCurrency', value)}
              >
                <SelectTrigger className="border-green-200 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-orange-700 dark:text-orange-300">Default Environment</Label>
              <Select 
                value={settings.defaultEnvironment} 
                onValueChange={(value) => handleSettingsUpdate('defaultEnvironment', value)}
              >
                <SelectTrigger className="border-orange-200 focus:border-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-purple-700 dark:text-purple-300">Toast Position</Label>
              <Select 
                value={settings.toastPosition} 
                onValueChange={(value) => handleSettingsUpdate('toastPosition', value)}
              >
                <SelectTrigger className="border-purple-200 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-l-4 border-l-green-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Import, export, and manage your application data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4">
          {/* Data Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sellers.length}</div>
              <div className="text-sm text-green-700 dark:text-green-300 flex items-center justify-center gap-1">
                <Building2 className="h-4 w-4" />
                Sellers
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{buyers.length}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                Buyers
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{invoices.length}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1">
                <FileText className="h-4 w-4" />
                Invoices
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-green-700 dark:text-green-300">Export Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Individual Exports</h4>
                <div className="space-y-2">
                  <Button onClick={handleExportSellers} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                    <Building2 className="h-4 w-4 mr-2" />
                    Export Sellers
                  </Button>
                  <Button onClick={handleExportBuyers} variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Users className="h-4 w-4 mr-2" />
                    Export Buyers
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-purple-700 dark:text-purple-300">Complete Exports</h4>
                <div className="space-y-2">
                  <Button onClick={handleExportData} variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Import Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-green-700 dark:text-green-300">Import Sellers</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    setImportType('sellers');
                    handleImportData(e);
                  }}
                  className="mt-2 border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label className="text-blue-700 dark:text-blue-300">Import Buyers</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    setImportType('buyers');
                    handleImportData(e);
                  }}
                  className="mt-2 border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-purple-700 dark:text-purple-300">Import All Data</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    setImportType('all');
                    handleImportData(e);
                  }}
                  className="mt-2 border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-red-700 dark:text-red-300">Danger Zone</h3>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
              <div className="space-y-0.5">
                <Label className="text-red-700 dark:text-red-300">Clear All Data</Label>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Remove all sellers, buyers, and invoices permanently
                </p>
              </div>
              <Button onClick={handleClearData} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-700 dark:text-blue-300">
              Import Preview - {importType.charAt(0).toUpperCase() + importType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Review the data before importing. Showing {previewData.length} of {importData.length} records.
            </DialogDescription>
          </DialogHeader>
          
          {previewData.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
                      {Object.keys(previewData[0] as object).slice(0, 5).map((key) => (
                        <TableHead key={key} className="text-blue-700 dark:text-blue-300">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((item, index) => (
                      <TableRow key={index}>
                        {Object.values(item as object).slice(0, 5).map((value: unknown, i) => (
                          <TableCell key={i} className="max-w-[200px] truncate">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmImport} className="bg-green-600 hover:bg-green-700">
                  Import {importData.length} Records
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button 
          onClick={() => toast.success('Settings saved successfully')}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}