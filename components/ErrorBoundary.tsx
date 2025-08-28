import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-full max-w-lg bg-red-100/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 space-y-4 border-2 border-red-300">
                <h1 className="text-3xl font-bold text-red-800">Something went wrong.</h1>
                <p className="text-red-700">
                    The application has encountered a critical error and cannot continue.
                </p>
                <p className="text-sm text-slate-600">
                    Please try refreshing the page. If the problem persists, clearing your browser's local storage for this site may help.
                </p>
                <button
                    onClick={() => {
                        try {
                           window.localStorage.clear();
                        } catch(e) { console.error("Failed to clear local storage", e) }
                        window.location.reload();
                    }}
                    className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-md"
                >
                    Clear Data & Reload
                </button>
                 {this.state.error && (
                    <details className="text-left text-xs bg-red-50 p-2 rounded mt-4">
                        <summary className="cursor-pointer text-slate-500">Error Details</summary>
                        <pre className="mt-2 text-red-900 whitespace-pre-wrap break-all">
                            {this.state.error.toString()}
                        </pre>
                    </details>
                )}
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
