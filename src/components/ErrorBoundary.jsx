import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>😔</div>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>משהו השתבש</h1>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>אירעה שגיאה בלתי צפויה. אנא רענן את הדף.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#1E5FA8', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}
              >
                רענן דף
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                style={{ backgroundColor: 'white', color: '#1E5FA8', border: '1px solid #1E5FA8', borderRadius: 10, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}
              >
                חזור לדשבורד
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}