import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App error:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-4 text-sm max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
