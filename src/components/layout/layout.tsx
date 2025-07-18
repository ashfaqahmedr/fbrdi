import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background w-full max-w-7xl mx-auto">
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main className={cn(
          "w-full max-w-7xl mx-auto flex-1 transition-all duration-300 ",
          "lg:ml-64", // Always show sidebar on large screens
          sidebarOpen ? "ml-64" : "ml-0" // Toggle on smaller screens
        )}>
          <div className="w-full max-w-full mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}