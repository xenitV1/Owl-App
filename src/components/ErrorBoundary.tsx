'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import debugLogger from '@/lib/debug';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error with our debug logger
    debugLogger.error('ui', `ErrorBoundary caught error in ${this.props.context || 'component'}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    debugLogger.info('ui', 'Error boundary reset by user', { context: this.props.context });
  };

  handleCopyError = () => {
    if (this.state.error) {
      const errorText = `
Error: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Context: ${this.props.context}
Timestamp: ${new Date().toISOString()}
      `.trim();

      navigator.clipboard.writeText(errorText).then(() => {
        debugLogger.info('ui', 'Error details copied to clipboard');
      }).catch((err) => {
        debugLogger.error('ui', 'Failed to copy error details to clipboard', err);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription>
              {this.props.context ? `Error in ${this.props.context}` : 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {this.state.error?.message}
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details (Development Mode)
                </summary>
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-48">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleCopyError} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Error
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              This error has been logged for debugging purposes.
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const captureError = (error: Error, context?: string) => {
    setError(error);
    debugLogger.error('ui', `Error captured by useErrorBoundary in ${context || 'component'}`, error);
  };

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        resetError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return { error, resetError, captureError };
}