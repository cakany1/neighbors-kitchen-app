import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Etwas ist schiefgelaufen
              </h1>
              <p className="text-muted-foreground">
                Die Anwendung ist auf einen unerwarteten Fehler gestoßen.
                Bitte lade die Seite neu oder kehre zur Startseite zurück.
              </p>
            </div>
            {this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium mb-2">
                  Technische Details
                </summary>
                <code className="text-xs text-muted-foreground break-all">
                  {this.state.error.toString()}
                </code>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Seite neu laden
              </Button>
              <Button onClick={this.handleReload}>
                Zur Startseite
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
