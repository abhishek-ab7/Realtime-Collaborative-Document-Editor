'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { updateDocument } from '@/features/documents/actions/document-actions';

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

interface SWRDocumentsData {
  documents: Document[];
  pagination: Pagination;
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

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
};

export function useDocuments(
  initialOptions: FetchDocumentsOptions = {},
  fallbackData?: SWRDocumentsData,
) {
  const [options, setOptions] = useState<FetchDocumentsOptions>({
    status: 'ACTIVE',
    sort: 'accessed',
    order: 'desc',
    page: 1,
    limit: 20,
    ...initialOptions,
  });

  const queryParams = useMemo(() => {
    const query = new URLSearchParams();
    if (options.status) query.set('status', options.status);
    if (options.starred !== undefined) query.set('starred', String(options.starred));
    if (options.search) query.set('search', options.search);
    if (options.sort) query.set('sort', options.sort);
    if (options.order) query.set('order', options.order);
    if (options.page) query.set('page', String(options.page));
    if (options.limit) query.set('limit', String(options.limit));
    return query.toString();
  }, [options]);

  const key = `/api/documents?${queryParams}`;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    fallbackData,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  const documents = data?.documents || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

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

  const toggleStar = useCallback(
    async (id: string, isStarred: boolean) => {
      await mutate(
        async (current: SWRDocumentsData | undefined) => {
          await updateDocument(id, { isStarred });
          if (!current) return current;
          return {
            ...current,
            documents: current.documents.map((d: Document) =>
              d.id === id ? { ...d, isStarred } : d,
            ),
          };
        },
        {
          optimisticData: (current: SWRDocumentsData | undefined) => {
            if (!current) return current;
            return {
              ...current,
              documents: current.documents.map((d: Document) =>
                d.id === id ? { ...d, isStarred } : d,
              ),
            };
          },
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      );
    },
    [mutate],
  );

  return {
    documents,
    pagination,
    isLoading,
    error: error ? error.message : null,
    options,
    setPage,
    setSearch,
    setSort,
    setStatus,
    refresh: mutate,
    toggleStar,
  };
}
