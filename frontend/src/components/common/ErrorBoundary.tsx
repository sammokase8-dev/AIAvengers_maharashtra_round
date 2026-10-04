import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-slate-50 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something unexpected happened</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              An error was encountered rendering this view. Your session and content data remain intact.
            </p>
            {this.state.error && (
              <pre className="w-full text-left text-xs bg-slate-50 text-rose-700 p-3 rounded-lg overflow-x-auto mb-6 border border-slate-200">
                {this.state.error.message}
              </pre>
            )}
            <Button variant="primary" onClick={this.handleReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Reload Interface
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
