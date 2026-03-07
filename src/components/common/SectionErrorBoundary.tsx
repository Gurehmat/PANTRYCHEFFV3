import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../../utils/logger';

const SOURCE = 'SectionErrorBoundary';

interface Props {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(SOURCE, `Section "${this.props.sectionName}" crashed`, {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
          <p className="mt-2 text-sm text-red-700">
            This section couldn&apos;t load. Please try again.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
