import { Badge } from '@/components/ui/badge';
import { Package, PackageCheck, PackageX, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockStatusProps {
  availableForSale: boolean;
  quantityAvailable?: number | null;
  showQuantity?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StockStatus({ 
  availableForSale, 
  quantityAvailable, 
  showQuantity = false,
  size = 'md',
  className 
}: StockStatusProps) {
  const getStockStatus = () => {
    if (!availableForSale) {
      return {
        label: 'Out of Stock',
        variant: 'destructive' as const,
        icon: PackageX,
        color: 'text-destructive'
      };
    }
    
    if (quantityAvailable === null) {
      return {
        label: 'In Stock',
        variant: 'secondary' as const,
        icon: PackageCheck,
        color: 'text-green-600'
      };
    }
    
    if (quantityAvailable <= 0) {
      return {
        label: 'Out of Stock',
        variant: 'destructive' as const,
        icon: PackageX,
        color: 'text-destructive'
      };
    }
    
    if (quantityAvailable <= 3) {
      return {
        label: showQuantity ? `Only ${quantityAvailable} left` : 'Low Stock',
        variant: 'outline' as const,
        icon: AlertTriangle,
        color: 'text-amber-600'
      };
    }
    
    if (quantityAvailable <= 10) {
      return {
        label: showQuantity ? `${quantityAvailable} in stock` : 'Limited Stock',
        variant: 'secondary' as const,
        icon: Package,
        color: 'text-amber-500'
      };
    }
    
    return {
      label: showQuantity ? `${quantityAvailable} available` : 'In Stock',
      variant: 'secondary' as const,
      icon: PackageCheck,
      color: 'text-green-600'
    };
  };

  const status = getStockStatus();
  const Icon = status.icon;
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-3',
    lg: 'text-base py-1.5 px-4'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const variantStyles = {
    'text-green-600': 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
    'text-amber-600': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    'text-amber-500': 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  };

  return (
    <Badge 
      variant={status.variant}
      className={cn(
        'font-body tracking-wide inline-flex items-center gap-1.5',
        sizeClasses[size],
        status.variant === 'secondary' && variantStyles[status.color as keyof typeof variantStyles],
        status.variant === 'outline' && variantStyles[status.color as keyof typeof variantStyles],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {status.label}
    </Badge>
  );
}

// Simple text-based stock indicator for compact displays
export function StockIndicator({ 
  availableForSale, 
  quantityAvailable,
  className 
}: Omit<StockStatusProps, 'showQuantity' | 'size'>) {
  if (!availableForSale || (quantityAvailable !== null && quantityAvailable <= 0)) {
    return (
      <span className={cn('text-xs font-body text-destructive', className)}>
        Out of Stock
      </span>
    );
  }
  
  if (quantityAvailable !== null && quantityAvailable <= 3) {
    return (
      <span className={cn('text-xs font-body text-amber-700 dark:text-amber-400', className)}>
        Only {quantityAvailable} left
      </span>
    );
  }
  
  return (
    <span className={cn('text-xs font-body text-emerald-700 dark:text-emerald-400', className)}>
      In Stock
    </span>
  );
}
