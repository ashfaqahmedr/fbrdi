import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} className="sticky top-0 z-50" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} className="fixed top-0 left-0 h-screen z-40" />
        <main className={cn(
          "flex-1 transition-all duration-300 overflow-y-auto",
          "lg:ml-64", // Always show sidebar on large screens
          sidebarOpen ? "ml-64" : "ml-0" // Toggle on smaller screens
        )}>
          <div className="container mx-auto p-6 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}