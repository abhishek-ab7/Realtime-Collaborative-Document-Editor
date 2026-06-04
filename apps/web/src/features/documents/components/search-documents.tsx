'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchDocumentsProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchDocuments({
  onSearch,
  placeholder = 'Search documents...',
  defaultValue = '',
}: SearchDocumentsProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative w-full md:w-90" data-testid="search-documents-container">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="border-[var(--color-border-default)] bg-[var(--color-bg-primary)] py-2 pr-9 pl-9 font-normal shadow-sm focus-visible:ring-1 focus-visible:ring-[var(--color-brand-primary)]"
        data-testid="search-documents-input"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
          data-testid="search-clear-button"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
