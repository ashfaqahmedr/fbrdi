import React, { ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Download } from 'lucide-react';
import { DataTable, Column, Action } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

interface Filter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  type?: 'select' | 'date';
  disabled?: boolean;
}

interface UniversalTableLayoutProps<T> {
  title: string;
  description?: string;
  icon: ReactNode;
  data: T[];
  filteredData: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Filter[];
  addButtonLabel?: string;
  onAddClick?: () => void;
  onExportClick?: () => void;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
  accentColor?: 'blue' | 'green' | 'purple' | 'indigo' | 'cyan';
}

export function UniversalTableLayout<T extends { id: string }>({ 
  title,
  description,
  filteredData,
  columns,
  actions,
  searchTerm,
  setSearchTerm,
  searchPlaceholder = "Search...",
  filters = [],
  addButtonLabel = "Add New",
  onAddClick,
  onExportClick,
  emptyState,
  headerClassName,
  rowClassName,
  accentColor = 'blue'
}: UniversalTableLayoutProps<T>) {
  const [rowsPerPage, setRowsPerPage] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isInfiniteScroll, setIsInfiniteScroll] = useState<boolean>(false);
  
  // Calculate pagination
  const rowsPerPageNumber = parseInt(rowsPerPage, 10);
  const totalPages = Math.ceil(filteredData.length / rowsPerPageNumber);
  
  // Get current page data
  const paginatedData = isInfiniteScroll 
    ? filteredData.slice(0, currentPage * rowsPerPageNumber)
    : filteredData.slice((currentPage - 1) * rowsPerPageNumber, currentPage * rowsPerPageNumber);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };
  
  // Handle infinite scroll toggle
  const handleInfiniteScrollToggle = () => {
    setIsInfiniteScroll(!isInfiniteScroll);
    setCurrentPage(1); // Reset to first page when toggling infinite scroll
  };
  
  // Handle load more for infinite scroll
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Get color classes based on accent color
  const getColorClasses = () => {
    const colorMap = {
      blue: {
        gradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
        border: 'border-l-blue-500',
        title: 'text-blue-700 dark:text-blue-300',
        badge: 'from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700',
        input: 'border-blue-200 focus:border-blue-500',
        action: {
          edit: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
          delete: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
          view: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
        }
      },
      green: {
        gradient: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
        border: 'border-l-green-500',
        title: 'text-green-700 dark:text-green-300',
        badge: 'from-green-50 to-emerald-50 text-green-700 border-green-200',
        button: 'bg-green-600 hover:bg-green-700',
        input: 'border-green-200 focus:border-green-500',
        action: {
          edit: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
          delete: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
          view: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
        }
      },
      purple: {
        gradient: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
        border: 'border-l-purple-500',
        title: 'text-purple-700 dark:text-purple-300',
        badge: 'from-purple-50 to-pink-50 text-purple-700 border-purple-200',
        button: 'bg-purple-600 hover:bg-purple-700',
        input: 'border-purple-200 focus:border-purple-500',
        action: {
          edit: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
          delete: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
          view: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
        }
      },
      indigo: {
        gradient: 'from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900',
        border: 'border-l-indigo-500',
        title: 'text-indigo-700 dark:text-indigo-300',
        badge: 'from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200',
        button: 'bg-indigo-600 hover:bg-indigo-700',
        input: 'border-indigo-200 focus:border-indigo-500'
      },
      cyan: {
        gradient: 'from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900',
        border: 'border-l-cyan-500',
        title: 'text-cyan-700 dark:text-cyan-300',
        badge: 'from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200',
        button: 'bg-cyan-600 hover:bg-cyan-700',
        input: 'border-cyan-200 focus:border-cyan-500'
      }
    };
    
    return colorMap[accentColor];
  };
  
  const colorClasses = getColorClasses();
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    
    // Always show first page
    buttons.push(
      <Button 
        key="first"
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className={cn(currentPage === 1 ? colorClasses.button : '')}
      >
        1
      </Button>
    );
    
    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - Math.floor(maxVisibleButtons / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisibleButtons - 3);
    
    // Adjust if we're near the beginning
    if (startPage > 2) {
      buttons.push(<span key="ellipsis1">...</span>);
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className={cn(currentPage === i ? colorClasses.button : '')}
        >
          {i}
        </Button>
      );
    }
    
    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      buttons.push(<span key="ellipsis2">...</span>);
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      buttons.push(
        <Button
          key="last"
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(currentPage === totalPages ? colorClasses.button : '')}
        >
          {totalPages}
        </Button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight bg-gradient-to-r from-${accentColor}-600 to-${accentColor === 'blue' ? 'cyan' : accentColor === 'green' ? 'emerald' : accentColor}-600 bg-clip-text text-transparent`}>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onExportClick && (
            <Button onClick={onExportClick} variant="outline" className={`border-${accentColor}-200 text-${accentColor}-700 hover:bg-${accentColor}-50`}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Badge variant="outline" className={`text-sm bg-gradient-to-r ${colorClasses.badge}`}>
            {filteredData.length} {title.toLowerCase()}{filteredData.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Card className={`border-l-4 ${colorClasses.border} shadow-lg`}>
        <CardHeader className={`bg-gradient-to-r ${colorClasses.gradient}`}>
          <div className="flex items-center justify-between">
            <CardTitle className={colorClasses.title}>{title}</CardTitle>
            {onAddClick && (
              <Button onClick={onAddClick} className={colorClasses.button}>
                <Plus className="h-4 w-4 mr-2" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${colorClasses.input}`}
              />
            </div>
            
            {/* Filters */}
            {filters.map((filter) => (
              <div key={filter.id} className="min-w-[150px]">
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className={`h-10 ${colorClasses.input}`}>
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            
            {/* Rows per page selector */}
            <div className="min-w-[120px]">
              <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className={`h-10 ${colorClasses.input}`}>
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Infinite scroll toggle */}
            <Button 
              variant={isInfiniteScroll ? "default" : "outline"} 
              size="sm"
              onClick={handleInfiniteScrollToggle}
              className={cn(isInfiniteScroll ? colorClasses.button : `border-${accentColor}-200`)}
            >
              {isInfiniteScroll ? "Paginated" : "Infinite Scroll"}
            </Button>
          </div>

          <div className="rounded-md border overflow-hidden">
            <DataTable
              data={paginatedData}
              columns={columns}
              actions={actions}
              emptyState={emptyState}
              headerClassName={headerClassName || `bg-${accentColor}-50 dark:bg-${accentColor}-950 text-${accentColor}-700 dark:text-${accentColor}-300`}
              rowClassName={rowClassName}
            />
          </div>
          
          {/* Pagination or Load More */}
          {filteredData.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedData.length} of {filteredData.length} {title.toLowerCase()}
              </div>
              
              {isInfiniteScroll ? (
                currentPage < totalPages && (
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    className={`border-${accentColor}-200 text-${accentColor}-700 hover:bg-${accentColor}-50`}
                  >
                    Load More
                  </Button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`border-${accentColor}-200`}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {renderPaginationButtons()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`border-${accentColor}-200`}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}