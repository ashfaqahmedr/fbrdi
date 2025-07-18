import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useDatabase } from '@/hooks/use-database';

export function ToastContainer() {
  const { settings } = useDatabase();

  const getToastPosition = () => {
    switch (settings.toastPosition) {
      case 'top-left':
        return 'top-left';
      case 'top-center':
        return 'top-center';
      case 'top-right':
        return 'top-right';
      case 'bottom-left':
        return 'bottom-left';
      case 'bottom-center':
        return 'bottom-center';
      case 'bottom-right':
        return 'bottom-right';
      default:
        return 'top-right';
    }
  };

  return (
    <Toaster 
      position={getToastPosition()}
      richColors
      closeButton
      duration={4000}
    />
  );
}