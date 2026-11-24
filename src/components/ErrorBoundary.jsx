import React from 'react';
import { RotateCw } from 'lucide-react';

// Shows a friendly message instead of a blank page if a page crashes
// (for example when its code can't be downloaded). `resetKey` (the URL)
// clears the error when the visitor goes to another page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, key: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey };
    return null;
  }

  componentDidCatch(error, info) {
    console.error('Page error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center" role="alert">
          <h1 className="text-xl font-black text-secondary">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            This page couldn&apos;t be shown. Reloading usually fixes it; your cart is kept.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-6">
            <RotateCw className="h-4 w-4" aria-hidden="true" /> Reload the page
          </button>
        </div>
      </div>
    );
  }
}
