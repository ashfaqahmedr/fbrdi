import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, Copy, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabase } from '@/hooks/use-database';

const API_ENDPOINTS = [
  { id: 'provinces', name: '/provinces', method: 'GET', description: 'Get list of provinces', color: 'blue' },
  { id: 'doctypecode', name: '/doctypecode', method: 'GET', description: 'Get document type codes', color: 'green' },
  { id: 'itemdesccode', name: '/itemdesccode', method: 'GET', description: 'Get HS codes and descriptions', color: 'purple' },
  { id: 'transtypecode', name: '/transtypecode', method: 'GET', description: 'Get transaction type codes', color: 'orange' },
  { id: 'uom', name: '/uom', method: 'GET', description: 'Get units of measurement', color: 'teal' },
  { id: 'statl', name: '/statl', method: 'POST', description: 'Validate registration status', color: 'red' },
  { id: 'Get_Reg_Type', name: '/Get_Reg_Type', method: 'POST', description: 'Get registration type', color: 'pink' },
  { id: 'SroSchedule', name: '/SroSchedule', method: 'GET', description: 'Get SRO schedules', color: 'indigo' },
  { id: 'SaleTypeToRate', name: '/SaleTypeToRate', method: 'GET', description: 'Get sale type to rate mapping', color: 'yellow' },
  { id: 'HS_UOM', name: '/HS_UOM', method: 'GET', description: 'Get HS code UOM mapping', color: 'cyan' },
  { id: 'SROItem', name: '/SROItem', method: 'GET', description: 'Get SRO items', color: 'emerald' },
];

const colorClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  orange: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300',
  red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  pink: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

export function APITesting() {
  const { sellers } = useDatabase();
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parameters, setParameters] = useState({
    rate_id: '413',
    date: '25-Mar-2025',
    date_iso: '2025-03-25',
    transTypeId: apiService.transactionTypes?.length ? String(apiService.transactionTypes[0].transactioN_TYPE_ID) : '',
    originationSupplier: apiService.provinces?.length ? String(apiService.provinces[0].stateProvinceCode) : '',
    origination_supplier_csv: apiService.provinces?.length ? String(apiService.provinces[0].stateProvinceCode) : '',
    hs_code: '5904.9000',
    annexure_id: '3',
    sro_id: '372',
    regno: '7908224',
    post_date: '2025-05-18',
    Registration_No: '7908224',
  });

  // Prepare options for searchable selects
  const handleTest = async () => {
    if (sellers.length === 0) {
      toast.error('Please add a seller first to test API endpoints');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setResponse('');
    
    try {
      const seller = sellers[0];
      apiService.setToken(seller.sandboxToken);
      
      // Build request parameters based on endpoint
      const requestParams: Record<string, unknown> = {
        method: selectedEndpoint.method || 'GET',
      };

      // Add parameters based on endpoint
      const endpointParams: Record<string, unknown> = {};
      
      switch (selectedEndpoint.id) {
        case 'SroSchedule':
          endpointParams.rate_id = parameters.rate_id;
          endpointParams.date = parameters.date;
          endpointParams.origination_supplier_csv = parameters.origination_supplier_csv;
          break;
        case 'SaleTypeToRate':
          { let dateValue = parameters.date_iso;
          if (dateValue) {
            dateValue = apiService.formatDateForAPI(dateValue, "DD-MMM-YYYY");
          }
          endpointParams.date = dateValue;
          endpointParams.transTypeId = parseInt(parameters.transTypeId);
          endpointParams.originationSupplier = parameters.originationSupplier;
          break; }
        case 'HS_UOM':
          endpointParams.hs_code = parameters.hs_code;
          endpointParams.annexure_id = parameters.annexure_id;
          break;
        case 'SROItem':
          endpointParams.date = parameters.date_iso;
          endpointParams.sro_id = parameters.sro_id;
          break;
        case 'statl':
          endpointParams.regno = parameters.regno;
          endpointParams.date = parameters.post_date;
          break;
        case 'Get_Reg_Type':
          endpointParams.Registration_No = parameters.Registration_No;
          break;
      }

      // For GET requests, add parameters as query params
      if (requestParams.method === 'GET') {
        requestParams.queryParams = { ...endpointParams };
      } 
      // For non-GET requests, add parameters to the request body
      else if (Object.keys(endpointParams).length > 0) {
        requestParams.body = { ...endpointParams };
      }

      // Make the API call
      const baseUrl = `https://gw.fbr.gov.pk/pdi/v1/${selectedEndpoint.id}`;
      const apiResponse = await apiService.testEndpoint(baseUrl, requestParams);
      
      setResponse(JSON.stringify(apiResponse, null, 2));
      setStatus('success');
      toast.success('API test completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResponse(`Error: ${errorMessage}`);
      setStatus('error');
      toast.error('API test failed');
      console.error('API Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    toast.success('Response copied to clipboard');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Testing...';
    switch (status) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  const needsParameters = (endpointId: string) => {
    return ['SroSchedule', 'SaleTypeToRate', 'HS_UOM', 'SROItem', 'statl', 'Get_Reg_Type'].includes(endpointId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            API Testing
          </h1>
          <p className="text-muted-foreground">
            Test FBR API endpoints and validate responses
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </div>

      {/* Endpoint Selection */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <TestTube className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            Select an endpoint to test
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {API_ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.id}
                className={cn(
                  "p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedEndpoint.id === endpoint.id
                    ? colorClasses[endpoint.color as keyof typeof colorClasses]
                    : "border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700"
                )}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{endpoint.name}</h3>
                  <Badge 
                    variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
                    className={cn(
                      "text-xs",
                      endpoint.method === 'GET' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    )}
                  >
                    {endpoint.method}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      {needsParameters(selectedEndpoint.id) && (
        <Card className="border-l-4 border-l-green-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardTitle className="text-green-700 dark:text-green-300">Parameters</CardTitle>
            <CardDescription>
              Configure parameters for {selectedEndpoint.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* SRO Schedule Parameters */}
            {selectedEndpoint.id === 'SroSchedule' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-700 dark:text-blue-300">Rate ID</Label>
                  <Input
                    id="rate_id"
                    value={parameters.rate_id}
                    onChange={(e) => setParameters(prev => ({ ...prev, rate_id: e.target.value }))}
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-700 dark:text-green-300">Date (DD-MMM-YYYY)</Label>
                  <Input
                    id="date"
                    value={parameters.date}
                    onChange={(e) => setParameters(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                <Label className="text-teal-700 dark:text-teal-300">Origination Supplier (CSV)</Label>
                    <Select
                       value={parameters.origination_supplier_csv || apiService.provinces[0].stateProvinceDesc}
                       onValueChange={(value) => setParameters(prev => ({ ...prev, origination_supplier_csv: value }))}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiService.provinces.map((prov) => (
                          <SelectItem key={prov.stateProvinceCode} value={String(prov.stateProvinceCode)}>
                            {prov.stateProvinceDesc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

              </div>
            )}

            {/* Sale Type to Rate Parameters */}
            {selectedEndpoint.id === 'SaleTypeToRate' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-orange-700 dark:text-orange-300">Date (YYYY-MM-DD)</Label>
                  <Input
                    id="date_iso"
                    type="date"
                    value={parameters.date_iso}
                    onChange={(e) => setParameters(prev => ({ ...prev, date_iso: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                <Label className="text-teal-700 dark:text-teal-300">Transaction Type ID</Label>
                    <Select
                     value={parameters.transTypeId || String(apiService.transactionTypes[0].transactioN_DESC)}
                     onValueChange={(value) => setParameters(prev => ({ ...prev, transTypeId: value }))}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiService.transactionTypes.map((prov) => (
                          <SelectItem key={prov.transactioN_TYPE_ID} value={String(prov.transactioN_TYPE_ID)}>
                           {prov.transactioN_TYPE_ID} - {prov.transactioN_DESC}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                <div className="space-y-2">
                <Label className="text-teal-700 dark:text-teal-300">Origination Supplier</Label>
                    <Select
                     value={parameters.originationSupplier || apiService.provinces[0].stateProvinceDesc}
                       onValueChange={(value) => setParameters(prev => ({ ...prev, originationSupplier: value }))}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiService.provinces.map((prov) => (
                          <SelectItem key={prov.stateProvinceCode} value={String(prov.stateProvinceCode)}>
                            {prov.stateProvinceDesc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

              </div>
            )}

            {/* HS UOM Parameters */}
            {selectedEndpoint.id === 'HS_UOM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-indigo-700 dark:text-indigo-300">HS Code</Label>
                  <Input
                    id="hs_code"
                    value={parameters.hs_code}
                    onChange={(e) => setParameters(prev => ({ ...prev, hs_code: e.target.value }))}
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-cyan-700 dark:text-cyan-300">Annexure ID</Label>
                  <Input
                    id="annexure_id"
                    value={parameters.annexure_id}
                    onChange={(e) => setParameters(prev => ({ ...prev, annexure_id: e.target.value }))}
                    className="border-cyan-200 focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* SRO Item Parameters */}
            {selectedEndpoint.id === 'SROItem' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-red-700 dark:text-red-300">Date (YYYY-MM-DD)</Label>
                  <Input
                    id="date_iso"
                    type="date"
                    value={parameters.date_iso}
                    onChange={(e) => setParameters(prev => ({ ...prev, date_iso: e.target.value }))}
                    className="border-red-200 focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-700 dark:text-yellow-300">SRO ID</Label>
                  <Input
                    id="sro_id"
                    value={parameters.sro_id}
                    onChange={(e) => setParameters(prev => ({ ...prev, sro_id: e.target.value }))}
                    className="border-yellow-200 focus:border-yellow-500"
                  />
                </div>
              </div>
            )}

            {/* STATL Parameters */}
            {selectedEndpoint.id === 'statl' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-emerald-700 dark:text-emerald-300">Registration Number</Label>
                  <Input
                    id="regno"
                    value={parameters.regno}
                    onChange={(e) => setParameters(prev => ({ ...prev, regno: e.target.value }))}
                    placeholder="Enter registration number"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-lime-700 dark:text-lime-300">Date (YYYY-MM-DD)</Label>
                  <Input
                    id="post_date"
                    type="date"
                    value={parameters.post_date}
                    onChange={(e) => setParameters(prev => ({ ...prev, post_date: e.target.value }))}
                    className="border-lime-200 focus:border-lime-500"
                  />
                </div>
              </div>
            )}
            
            {/* Get Registration Type Parameters */}
            {selectedEndpoint.id === 'Get_Reg_Type' && (
              <div className="space-y-2">
                <Label className="text-violet-700 dark:text-violet-300">Registration Number</Label>
                <Input
                  id="Registration_No"
                  value={parameters.Registration_No}
                  onChange={(e) => setParameters(prev => ({ ...prev, Registration_No: e.target.value }))}
                  placeholder="Enter registration number"
                  className="border-violet-200 focus:border-violet-500"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Button - Compact */}
      <div className="flex justify-center">
        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          size="lg"
          className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Testing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Test Endpoint
            </>
          )}
        </Button>
      </div>

      {/* Response - Compact */}
      <Card className="border-l-4 border-l-purple-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-700 dark:text-purple-300">API Response</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!response}
                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-950"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Badge variant="outline" className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Textarea
            value={response || 'No response yet. Click "Test Endpoint" to see results.'}
            readOnly
            className="min-h-[200px] font-mono text-xs bg-gray-50 dark:bg-gray-900 border-purple-200 focus:border-purple-500"
            placeholder="API response will appear here..."
          />
        </CardContent>
      </Card>
    </div>
  );
}