import React, { useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface Action<T> {
  icon: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
  disabled?: (row: T) => boolean;
  tooltip?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  rowClassName?: string | ((row: T) => string);
  headerClassName?: string;
  onRowClick?: (row: T) => void;
  onScroll?: () => void;
  isLoading?: boolean;
  hideSearch?: boolean;
}

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  actions, 
  searchPlaceholder = "Search...",
  searchTerm = "",
  onSearchChange,
  emptyState,
  rowClassName,
  headerClassName,
  onRowClick,
  onScroll,
  isLoading,
  hideSearch = false
}: DataTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll event for infinite scrolling
  useEffect(() => {
    if (!onScroll) return;
    
    const handleScroll = () => {
      if (!tableRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      // If scrolled to bottom (with a small threshold)
      if (scrollHeight - scrollTop - clientHeight < 50) {
        onScroll();
      }
    };
    
    const currentRef = tableRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [onScroll]);

  const renderCell = (row: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(row);
    }
    
    if (typeof column.accessorKey === 'function') {
      return column.accessorKey(row);
    }
    
    return row[column.accessorKey as keyof T];
  };

  const getRowClassName = (row: T) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row);
    }
    return rowClassName || 'bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900';
  };

  return (
    <div className="space-y-4">
      {!hideSearch && onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {data.length === 0 ? (
        emptyState ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyState.icon}
            <p className="font-medium">{emptyState.title}</p>
            <p className="text-sm">{emptyState.description}</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No data available</p>
          </div>
        )
      ) : (
        <div 
          ref={tableRef} 
          className="rounded-md border overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className={headerClassName || "bg-muted text-muted-foreground"}>
                {columns.map((column, index) => (
                  <TableHead key={index} className={`${column.className || ""} font-semibold`}>
                    {column.header}
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={getRowClassName(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((column, index) => (
                    <TableCell key={index} className={column.className}>
                      {renderCell(row, column) as React.ReactNode}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click when clicking action
                                    action.onClick(row);
                                  }}
                                  disabled={action.disabled ? action.disabled(row) : false}
                                  className={action.className}
                                >
                                  {action.icon}
                                </Button>
                              </TooltipTrigger>
                              {action.tooltip && (
                                <TooltipContent>
                                  <p>{action.tooltip}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}