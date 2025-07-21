import { Menu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { EnvironmentToggle } from '@/components/ui/environment-toggle';

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className = '' }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-800 dark:via-purple-800 dark:to-blue-900 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/20"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">FBR Digital Invoicing</h1>
              <p className="text-xs text-white/80">
                Pakistan Revenue Authority
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <EnvironmentToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}