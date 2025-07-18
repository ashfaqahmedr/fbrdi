import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Server, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDatabase } from '@/contexts/database-context';


interface EnvironmentToggleProps {
  onEnvironmentChange?: (isProduction: boolean) => void;
}

export function EnvironmentToggle({ onEnvironmentChange }: EnvironmentToggleProps) {
  const [isProduction, setIsProduction] = useState(false);
 const {  updateSettings } = useDatabase();
  
  const handleToggle = async (checked: boolean) => {
    setIsProduction(checked);
    onEnvironmentChange?.(checked);

    updateSettings({'defaultEnvironment': checked ? 'production' : 'sandbox'});

    toast.info(
      `Switched to ${checked ? 'Production' : 'Sandbox'} environment`,
      {
        description: checked 
          ? 'You are now using live FBR APIs' 
          : 'You are now using test FBR APIs'
      }
    );
  };

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border-2 px-4 py-2 transition-all duration-200",
      isProduction 
        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950" 
        : "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
    )}>
      <div className="flex items-center gap-2">
        <TestTube className={cn(
          "h-4 w-4",
          !isProduction ? "text-green-600 dark:text-green-400" : "text-gray-400"
        )} />
        <Label 
          htmlFor="env-toggle" 
          className={cn(
            "text-sm font-medium cursor-pointer",
            !isProduction ? "text-green-700 dark:text-green-300" : "text-gray-500"
          )}
        >
          Sandbox
        </Label>
      </div>
      
      <Switch
        id="env-toggle"
        checked={isProduction}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-green-500"
      />
      
      <div className="flex items-center gap-2">
        <Label 
          htmlFor="env-toggle" 
          className={cn(
            "text-sm font-medium cursor-pointer",
            isProduction ? "text-red-700 dark:text-red-300" : "text-gray-500"
          )}
        >
          Production
        </Label>
        <Server className={cn(
          "h-4 w-4",
          isProduction ? "text-red-600 dark:text-red-400" : "text-gray-400"
        )} />
      </div>
      
      <Badge 
        variant={isProduction ? "destructive" : "default"}
        className={cn(
          "ml-2 text-xs",
          isProduction 
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        )}
      >
        {isProduction ? 'LIVE' : 'TEST'}
      </Badge>
    </div>
  );
}