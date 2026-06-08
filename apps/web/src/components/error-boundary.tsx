'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    Sentry.captureException(error, { extra: { errorInfo } });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center bg-white p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-xl font-bold text-[#1e293b]">Something went wrong</h1>
            <p className="text-sm text-[#64748b]">
              An unexpected error occurred. We have been notified and are looking into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4f46e5]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
