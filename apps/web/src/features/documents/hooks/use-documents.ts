'use client';

import { useState, useEffect, useCallback } from 'react';

interface DocumentOwner {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  isStarred: boolean;
  status: 'ACTIVE' | 'TRASHED';
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string | null;
  collaboratorCount: number;
  owner: DocumentOwner;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FetchDocumentsOptions {
  status?: 'ACTIVE' | 'TRASHED';
  starred?: boolean;
  search?: string;
  sort?: 'updated' | 'created' | 'title' | 'accessed';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useDocuments(initialOptions: FetchDocumentsOptions = {}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<FetchDocumentsOptions>({
    status: 'ACTIVE',
    sort: 'accessed',
    order: 'desc',
    page: 1,
    limit: 20,
    ...initialOptions,
  });

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (options.status) queryParams.set('status', options.status);
      if (options.starred !== undefined) queryParams.set('starred', String(options.starred));
      if (options.search) queryParams.set('search', options.search);
      if (options.sort) queryParams.set('sort', options.sort);
      if (options.order) queryParams.set('order', options.order);
      if (options.page) queryParams.set('page', String(options.page));
      if (options.limit) queryParams.set('limit', String(options.limit));

      const response = await fetch(`/api/documents?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const setPage = useCallback((page: number) => {
    setOptions((prev) => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setOptions((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setSort = useCallback(
    (sort: FetchDocumentsOptions['sort'], order: FetchDocumentsOptions['order'] = 'desc') => {
      setOptions((prev) => ({ ...prev, sort, order, page: 1 }));
    },
    [],
  );

  const setStatus = useCallback((status: FetchDocumentsOptions['status']) => {
    setOptions((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  return {
    documents,
    pagination,
    isLoading,
    error,
    options,
    setPage,
    setSearch,
    setSort,
    setStatus,
    refresh: fetchDocuments,
  };
}
