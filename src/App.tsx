import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastContainer } from '@/components/ui/toast-container';
import { Layout } from '@/components/layout/layout';
import { InvoiceProvider } from '@/contexts/invoice-context';
import { DatabaseProvider } from '@/contexts/database-context';
import { APIProvider } from '@/contexts/api-context';
import { CreateInvoice } from '@/pages/create-invoice';
import { ManageInvoices } from '@/pages/manage-invoices';
import { ManageSellers } from '@/pages/manage-sellers';
import { ManageBuyers } from '@/pages/manage-buyers';
import { APITesting } from '@/pages/api-testing';
import { Settings } from '@/pages/settings';


import { useDatabase } from '@/hooks/use-database';
import { useEffect, useState } from 'react';

function AppContent() {
  const { sellers, isLoading } = useDatabase();
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  useEffect(() => {
    if (!isLoading && sellers.length === 0) {
      setShowInitialSetup(true);
      setShowSellerModal(true);
    }
  }, [sellers, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen max-w-7xl mx-auto px-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showInitialSetup) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <ManageSellers initialModalOpen={showSellerModal} onSellerAdded={() => setShowInitialSetup(false)} />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CreateInvoice />} />
        <Route path="/invoices" element={<ManageInvoices />} />
        <Route path="/sellers" element={<ManageSellers />} />
        <Route path="/buyers" element={<ManageBuyers />} />
        <Route path="/api-testing" element={<APITesting />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="fbr-theme">
      <DatabaseProvider>
        <APIProvider>
          <InvoiceProvider>
            <Router>
              <AppContent />
              <ToastContainer />
            </Router>
          </InvoiceProvider>
        </APIProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

export default App;