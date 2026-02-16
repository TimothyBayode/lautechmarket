import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_error: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6 bg-white rounded-xl border-2 border-dashed border-red-100 m-4">
                    <div className="text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We encountered a display error in this section.
                        </p>
                        <div className="flex flex-col gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("This will clear all app data and reset the app. Are you sure?")) {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        if ('serviceWorker' in navigator) {
                                            navigator.serviceWorker.getRegistrations().then(regs => {
                                                regs.forEach(r => r.unregister());
                                                window.location.reload();
                                            });
                                        } else {
                                            window.location.reload();
                                        }
                                    }
                                }}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                🔧 Factory Reset (Fix Crashes)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
