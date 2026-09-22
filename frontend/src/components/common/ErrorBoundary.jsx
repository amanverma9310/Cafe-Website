import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('UI error:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="grid min-h-[60svh] place-items-center px-6 text-center text-fg">
        <div>
          <p className="font-display text-4xl">Something went wrong.</p>
          <p className="mt-3 text-muted">Please refresh the page. If it keeps happening, call the cafe.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink">Refresh</button>
        </div>
      </div>
    );
  }
}
