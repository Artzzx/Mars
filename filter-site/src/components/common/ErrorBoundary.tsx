import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  retry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-le-red" />
        <div>
          <p className="font-semibold text-white text-lg">Something went wrong</p>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            {this.state.error?.message ?? 'Unknown error'}
          </p>
        </div>
        <button
          type="button"
          onClick={this.retry}
          className="btn-secondary text-sm"
        >
          Try again
        </button>
      </div>
    );
  }
}
