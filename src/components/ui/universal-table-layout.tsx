import React, { ReactNode, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface DynamicFilterConfig {
  enableDateFilter?: boolean;
  dateField?: string;
  enableStatusFilter?: boolean;
  statusOptions?: string[];
  enableRegistrationTypeFilter?: boolean;
  registrationTypeOptions?: string[];
  enableRegistrationStatusFilter?: boolean;
  registrationStatusOptions?: string[];
  enableActivityFilter?: boolean;
  activityOptions?: string[];
  customFilters?: Filter[];
}

interface UniversalTableLayoutProps<T> {
  title: string;
  description?: string;
  icon: ReactNode;
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Filter[];
  dynamicFilters?: DynamicFilterConfig;
  showInternalFilters?: boolean;
  dateFilter?: string;
  setDateFilter?: (value: string) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  registrationTypeFilter?: string;
  setRegistrationTypeFilter?: (value: string) => void;
  registrationStatusFilter?: string;
  setRegistrationStatusFilter?: (value: string) => void;
  activityFilter?: string;
  setActivityFilter?: (value: string) => void;
  isInfiniteScroll?: boolean;
  setIsInfiniteScroll?: (value: boolean) => void;
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

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchPlaceholder?: string;
  dateFilter?: string;
  setDateFilter?: (value: string) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  registrationTypeFilter?: string;
  setRegistrationTypeFilter?: (value: string) => void;
  registrationStatusFilter?: string;
  setRegistrationStatusFilter?: (value: string) => void;
  activityFilter?: string;
  setActivityFilter?: (value: string) => void;
  filters?: Filter[];
  dynamicFilters?: DynamicFilterConfig;
  isInfiniteScroll?: boolean;
  onInfiniteScrollToggle?: () => void;
  accentColor?: 'blue' | 'green' | 'purple' | 'indigo' | 'cyan';
  showSearch?: boolean;
  showInfiniteScrollToggle?: boolean;
}

export function FilterControls({
  searchTerm,
  setSearchTerm,
  searchPlaceholder = "Search...",
  dateFilter = 'all',
  setDateFilter,
  statusFilter = 'all',
  setStatusFilter,
  registrationTypeFilter = 'all',
  setRegistrationTypeFilter,
  registrationStatusFilter = 'all',
  setRegistrationStatusFilter,
  activityFilter = 'all',
  setActivityFilter,
  filters = [],
  dynamicFilters,
  isInfiniteScroll = false,
  onInfiniteScrollToggle,
  accentColor = 'blue',
  showSearch = true,
  showInfiniteScrollToggle = true,
}: FilterControlsProps) {
  // Get color classes based on accent color
  const getColorClasses = () => {
    switch (accentColor) {
      case 'green':
        return {
          input: 'border-green-200 focus:border-green-500 focus:ring-green-500',
          button: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'purple':
        return {
          input: 'border-purple-200 focus:border-purple-500 focus:ring-purple-500',
          button: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      case 'indigo':
        return {
          input: 'border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500',
          button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        };
      case 'cyan':
        return {
          input: 'border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500',
          button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        };
      default: // blue
        return {
          input: 'border-blue-200 focus:border-blue-500 focus:ring-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      {showSearch && (
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${colorClasses.input}`}
            />
          </div>
        </div>
      )}
      
      {/* Date Filter */}
      {dynamicFilters?.enableDateFilter && setDateFilter && (
        <div className="min-w-[150px]">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className={`h-10 ${colorClasses.input}`}>
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Status Filter */}
      {dynamicFilters?.enableStatusFilter && dynamicFilters.statusOptions && setStatusFilter && (
        <div className="min-w-[150px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`h-10 ${colorClasses.input}`}>
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {dynamicFilters.statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Registration Type Filter */}
      {dynamicFilters?.enableRegistrationTypeFilter && dynamicFilters.registrationTypeOptions && setRegistrationTypeFilter && (
        <div className="min-w-[180px]">
          <Select value={registrationTypeFilter} onValueChange={setRegistrationTypeFilter}>
            <SelectTrigger className={`h-10 ${colorClasses.input}`}>
              <SelectValue placeholder="Registration Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Registration Types</SelectItem>
              {dynamicFilters.registrationTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Registration Status Filter */}
      {dynamicFilters?.enableRegistrationStatusFilter && dynamicFilters.registrationStatusOptions && setRegistrationStatusFilter && (
        <div className="min-w-[180px]">
          <Select value={registrationStatusFilter} onValueChange={setRegistrationStatusFilter}>
            <SelectTrigger className={`h-10 ${colorClasses.input}`}>
              <SelectValue placeholder="Registration Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Registration Status</SelectItem>
              {dynamicFilters.registrationStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Activity Filter */}
      {dynamicFilters?.enableActivityFilter && dynamicFilters.activityOptions && setActivityFilter && (
        <div className="min-w-[180px]">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className={`h-10 ${colorClasses.input}`}>
              <SelectValue placeholder="Business Activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {dynamicFilters.activityOptions.map((activity) => (
                <SelectItem key={activity} value={activity}>
                  {activity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Custom Filters */}
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
      
      {/* Infinite scroll toggle */}
      {showInfiniteScrollToggle && onInfiniteScrollToggle && (
        <Button 
          variant={isInfiniteScroll ? "default" : "outline"} 
          size="sm"
          onClick={onInfiniteScrollToggle}
          className={cn(isInfiniteScroll ? colorClasses.button : `border-${accentColor}-200`)}
        >
          {isInfiniteScroll ? "Paginated" : "Infinite Scroll"}
        </Button>
      )}
    </div>
  );
}

export function UniversalTableLayout<T extends { id: string }>({ 
  title,
  description,
  data,
  columns,
  actions,
  searchTerm,
  setSearchTerm,
  searchPlaceholder = "Search...",
  filters = [],
  dynamicFilters,
  showInternalFilters = true,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  registrationTypeFilter,
  setRegistrationTypeFilter,
  registrationStatusFilter,
  setRegistrationStatusFilter,
  activityFilter,
  setActivityFilter,
  isInfiniteScroll,
  setIsInfiniteScroll,
  addButtonLabel = "Add New",
  onAddClick,
  onExportClick,
  emptyState,
  headerClassName,
  rowClassName,
  accentColor = 'blue',
}: UniversalTableLayoutProps<T>) {
  const [rowsPerPage, setRowsPerPage] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [internalIsInfiniteScroll, setInternalIsInfiniteScroll] = useState<boolean>(false);
  const [internalDateFilter, setInternalDateFilter] = useState<string>('all');
  const [internalStatusFilter, setInternalStatusFilter] = useState<string>('all');
  
  const isInfiniteScrollState = isInfiniteScroll ?? internalIsInfiniteScroll;
  const setIsInfiniteScrollState = setIsInfiniteScroll ?? setInternalIsInfiniteScroll;
  
  const dateFilterState = dateFilter ?? internalDateFilter;
  const setDateFilterState = setDateFilter ?? setInternalDateFilter;
  
  const statusFilterState = statusFilter ?? internalStatusFilter;
  const setStatusFilterState = setStatusFilter ?? setInternalStatusFilter;
  
  // Dynamic filtering logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Date filter (if enabled)
      let matchesDate = true;
      if (dynamicFilters?.enableDateFilter && dynamicFilters.dateField) {
        const dateField = dynamicFilters.dateField as keyof T;
        const itemDate = item[dateField] as any;
        if (itemDate && dateFilterState !== 'all') {
          const date = new Date(itemDate);
          const now = new Date();
          
          switch (dateFilterState) {
            case 'today':
              matchesDate = (
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
              );
              break;
            case 'week':
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(now.getDate() - 7);
              matchesDate = date >= oneWeekAgo;
              break;
            case 'month':
              matchesDate = (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
              );
              break;
            case 'year':
              matchesDate = date.getFullYear() === now.getFullYear();
              break;
            default:
              matchesDate = true;
          }
        }
      }
      
      // Status filter (if enabled)
      let matchesStatus = true;
      if (dynamicFilters?.enableStatusFilter && statusFilterState !== 'all') {
        const statusField = 'status' as keyof T;
        matchesStatus = item[statusField] === statusFilterState;
      }
      
      // Custom filters
      let matchesCustomFilters = true;
      filters.forEach(filter => {
        if (filter.value !== 'all' && filter.value !== '') {
          const fieldValue = item[filter.id as keyof T];
          matchesCustomFilters = matchesCustomFilters && fieldValue === filter.value;
        }
      });
      
      return matchesSearch && matchesDate && matchesStatus && matchesCustomFilters;
    });
  }, [data, searchTerm, dateFilterState, statusFilterState, filters, dynamicFilters]);
  
  // Calculate pagination
  const rowsPerPageNumber = parseInt(rowsPerPage, 10);
  const totalPages = Math.ceil(filteredData.length / rowsPerPageNumber);
  
  // Get current page data
  const paginatedData = isInfiniteScrollState 
    ? filteredData.slice(0, currentPage * rowsPerPageNumber)
    : filteredData.slice((currentPage - 1) * rowsPerPageNumber, currentPage * rowsPerPageNumber);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };
  
  // Handle infinite scroll toggle
  const handleInfiniteScrollToggle = () => {
    setIsInfiniteScrollState(!isInfiniteScrollState);
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
    switch (accentColor) {
      case 'green':
        return {
          title: 'text-green-900 dark:text-green-100',
          button: 'bg-green-600 hover:bg-green-700 text-white',
          badge: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 text-green-700 dark:text-green-300',
          input: 'border-green-200 focus:border-green-500 focus:ring-green-500',
        };
      case 'purple':
        return {
          title: 'text-purple-900 dark:text-purple-100',
          button: 'bg-purple-600 hover:bg-purple-700 text-white',
          badge: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 text-purple-700 dark:text-purple-300',
          input: 'border-purple-200 focus:border-purple-500 focus:ring-purple-500',
        };
      case 'indigo':
        return {
          title: 'text-indigo-900 dark:text-indigo-100',
          button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          badge: 'from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 text-indigo-700 dark:text-indigo-300',
          input: 'border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500',
        };
      case 'cyan':
        return {
          title: 'text-cyan-900 dark:text-cyan-100',
          button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
          badge: 'from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 text-cyan-700 dark:text-cyan-300',
          input: 'border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500',
        };
      default: // blue
        return {
          title: 'text-blue-900 dark:text-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          badge: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 text-blue-700 dark:text-blue-300',
          input: 'border-blue-200 focus:border-blue-500 focus:ring-blue-500',
        };
    }
  };

  const colorClasses = getColorClasses();

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className={cn(
            i === currentPage ? colorClasses.button : `border-${accentColor}-200`,
            "min-w-[32px]"
          )}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${colorClasses.title}`}>
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAddClick && (
            <Button 
              onClick={onAddClick} 
              className={colorClasses.button}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
          {onExportClick && (
            <Button 
              variant="outline" 
              onClick={onExportClick}
              size="sm"
              className={`border-${accentColor}-200 text-${accentColor}-700 hover:bg-${accentColor}-50`}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {showInternalFilters && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <FilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder={searchPlaceholder}
            dateFilter={dateFilterState}
            setDateFilter={setDateFilterState}
            statusFilter={statusFilterState}
            setStatusFilter={setStatusFilterState}
            registrationTypeFilter={registrationTypeFilter}
            setRegistrationTypeFilter={setRegistrationTypeFilter}
            registrationStatusFilter={registrationStatusFilter}
            setRegistrationStatusFilter={setRegistrationStatusFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            filters={filters}
            dynamicFilters={dynamicFilters}
            isInfiniteScroll={isInfiniteScrollState}
            onInfiniteScrollToggle={handleInfiniteScrollToggle}
            accentColor={accentColor}
          />
        </div>
      )}

      {/* Table Container - Full Height */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 rounded-md border overflow-hidden">
          <DataTable
            data={paginatedData}
            columns={columns}
            actions={actions}
            emptyState={emptyState}
            headerClassName={headerClassName || `bg-${accentColor}-50 dark:bg-${accentColor}-950 text-${accentColor}-700 dark:text-${accentColor}-300`}
            rowClassName={rowClassName}
          />
        </div>
      </div>
      
      {/* Pagination at Bottom */}
      {filteredData.length > 0 && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between bg-background">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filteredData.length} {title.toLowerCase()}
          </div>
          
          {isInfiniteScrollState ? (
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
    </div>
  );
}
