import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  loading = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full justify-between text-left font-normal",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2" />
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {option.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}