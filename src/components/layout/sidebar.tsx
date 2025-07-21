import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileText, 
  Users, 
  Building2, 
  Receipt, 
  TestTube, 
  Settings,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onCollapse: (collapsed: boolean) => void;
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

export function Sidebar({ open, collapsed, onClose, onCollapse, className = '' }: SidebarProps) {
  const location = useLocation();

  return (
    
    <>
    </TooltipProvider>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-40',
        collapsed ? 'w-16' : 'w-64',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0', // Always show on large screens
        className
      )}>
        <div className="flex h-full flex-col relative">
          {/* Close button for mobile */}
          <div className={cn(
            "flex items-center justify-between p-4 lg:hidden",
            collapsed && "justify-center"
          )}>
            {!collapsed && <h2 className="text-lg font-semibold">Navigation</h2>}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Collapse button for desktop */}
          <div className="hidden lg:block absolute -right-3 top-6 z-50">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full bg-white dark:bg-gray-900 border shadow-md"
              onClick={() => onCollapse(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          </div>
          <ScrollArea className="flex-1 px-3 pb-20">
            <nav className="space-y-2 py-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const NavItem = (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed ? "justify-center" : "gap-3",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && item.name}
                  </Link>
                );
                
                return collapsed ? (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {NavItem}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : NavItem;
              })}
            </nav>
          </ScrollArea>

          {/* Settings at bottom */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/settings"
                    onClick={() => onClose()}
                    className={cn(
                      "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      location.pathname === '/settings'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/settings"
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === '/settings'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            )}
          </div>
        </div>
      </aside>
 
    </>
  );
}