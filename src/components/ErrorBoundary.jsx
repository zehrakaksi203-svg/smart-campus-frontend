import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary yakaladı:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
            <div className="text-4xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Bir şeyler ters gitti
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Beklenmeyen bir hata oluştu. Ana sayfaya dönüp tekrar
              deneyebilirsiniz.
            </p>
            <button
              onClick={this.handleReload}
              className="bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;