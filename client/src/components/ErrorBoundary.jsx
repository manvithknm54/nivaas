import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error(err); }
  componentDidUpdate(prev) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="card mx-auto mt-16 max-w-md text-center">
        <AlertTriangle size={32} className="mx-auto text-gold-500" />
        <h2 className="mt-3 text-xl font-extrabold">Something went wrong on this page</h2>
        <p className="mt-2 text-sm text-ink-900/60">It's not your fault. Try again, or head back to the home page.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button className="btn-gold" onClick={() => this.setState({ failed: false })}>Try again</button>
          <a className="btn-ghost" href="/">Go home</a>
        </div>
      </div>
    );
  }
}