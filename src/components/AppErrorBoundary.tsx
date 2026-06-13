import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

/** Presentational crash fallback — also used when the app chunk fails to load. */
export function CrashScreen({ error }: { error?: Error }) {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-muted-foreground mb-5">
          واجه التطبيق مشكلة أثناء التحميل. حاول إعادة تحميل الصفحة.
        </p>
        {error?.message && (
          <pre dir="ltr" className="text-start text-xs bg-foreground/5 text-muted-foreground rounded-lg p-3 mb-5 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition"
        >
          إعادة التحميل
        </button>
      </div>
    </div>
  );
}

interface State {
  error?: Error;
}

/** Root error boundary so an uncaught render error shows a fallback, not a blank page. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) return <CrashScreen error={this.state.error} />;
    return this.props.children;
  }
}
