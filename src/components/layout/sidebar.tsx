import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Users, 
  Building2, 
  Receipt, 
  TestTube, 
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

const navigation = [
  {
    name: 'Create Invoice',
    href: '/',
    icon: FileText,
  },
  {
    name: 'Manage Invoices',
    href: '/invoices',
    icon: Receipt,
  },
  {
    name: 'Manage Sellers',
    href: '/sellers',
    icon: Building2,
  },
  {
    name: 'Manage Buyers',
    href: '/buyers',
    icon: Users,
  },
  {
    name: 'API Testing',
    href: '/api-testing',
    icon: TestTube,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ open, onClose, className = '' }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out z-40',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0', // Always show on large screens
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-2 py-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}