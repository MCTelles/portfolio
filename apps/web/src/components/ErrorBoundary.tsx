import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

/** Isola falhas (ex.: WebGL indisponível) para não derrubar a página inteira. */
export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
