import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/hooks/use-database';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { settings, updateSettings } = useDatabase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(settings.sidebarCollapsed || false);

  const handleSidebarCollapse = async (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    await updateSettings({ sidebarCollapsed: collapsed });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[1920px] mx-auto">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} className="sticky top-0 z-50" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          open={sidebarOpen} 
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)} 
          onCollapse={handleSidebarCollapse}
          className="fixed top-0 left-0 h-screen z-40" 
        />
        <main className={cn(
          "flex-1 transition-all duration-300 overflow-y-auto",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", // Responsive sidebar width
          sidebarOpen ? (sidebarCollapsed ? "ml-16" : "ml-64") : "ml-0" // Toggle on smaller screens
        )}>
          <div className="container mx-auto p-6 pb-20 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}