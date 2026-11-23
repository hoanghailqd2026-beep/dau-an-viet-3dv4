// Ensure window.fetch has both getter and setter in iframe environments
try {
  let currentFetch = window.fetch;
  const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (!desc || !desc.set) {
    Object.defineProperty(window, 'fetch', {
      get() {
        return currentFetch;
      },
      set(val) {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore if already configured
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './i18n/I18nContext.tsx';
import './index.css';

interface RootErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RootErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Lỗi khởi tạo không gian số.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-[#F5F5F7] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-white/15 bg-[#1D1D1F] p-6 text-center space-y-4">
            <h1 className="text-lg font-semibold text-[#D4AF37]">
              Dấu Ấn Việt 3D — Khôi phục phiên hiển thị
            </h1>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Trình duyệt vừa gặp sự cố tạm thời khi dựng cảnh 3D hoặc đọc dữ liệu cục bộ ({this.state.message}).
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full bg-[#0071E3] text-white text-xs font-medium cursor-pointer"
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.localStorage.clear();
                  } catch {
                    // ignore storage clear errors
                  }
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-full border border-white/15 text-xs text-[#F5F5F7] cursor-pointer"
              >
                Đặt lại bộ nhớ tạm
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <I18nProvider>
      <App />
    </I18nProvider>
  </RootErrorBoundary>
);
