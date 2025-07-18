import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/contexts/database-context';
import { useEffect } from 'react';



export function ThemeToggle() {

 const { theme, setTheme } = useTheme();
 const {  updateSettings } = useDatabase();

 
 const toggleTheme = () => {
   if (theme === 'light') {
     setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
    console.log("theme", theme);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-blue-400" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
  console.log("theme was changed from Header to", theme);
   updateSettings({'theme': theme });
}, [theme]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        "border-2 hover:scale-105",
        theme === 'light' && "border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-700",
        theme === 'dark' && "border-blue-400 bg-blue-950 hover:bg-blue-900 text-blue-300",
        theme === 'system' && "border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
      )}
    >
      {getIcon()}
      <span className="text-xs font-medium capitalize">{theme}</span>
    </Button>
  );
}

