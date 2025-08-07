'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  onRetry: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ 
  onRetry, 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again."
}: ErrorFallbackProps) {
  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </Card>
  );
}

export function NetworkErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorFallback
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  );
}

export function GenerationErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorFallback
      title="Recipe Generation Failed"
      message="We couldn't generate your recipe right now. This might be due to high demand or a temporary issue."
      onRetry={onRetry}
    />
  );
}