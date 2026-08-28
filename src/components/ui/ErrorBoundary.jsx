import { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="text-center max-w-md">
            <i className="bi bi-exclamation-triangle text-6xl text-amber-500 mb-4 block" />
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Algo salió mal</h1>
            <p className="text-slate-500 mb-6">
              Ocurrió un error inesperado. Por favor, intenta de nuevo.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-slate-400 mb-4 font-mono bg-slate-100 p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <Button variant="primary" onClick={this.handleRetry}>
              <i className="bi bi-arrow-clockwise" />
              Intentar de nuevo
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
