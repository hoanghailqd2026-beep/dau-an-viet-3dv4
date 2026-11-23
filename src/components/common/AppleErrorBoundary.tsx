import React from 'react';
import { RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface AppleErrorBoundaryProps {
  children: React.ReactNode;
  variant?: 'app' | 'spatial3d';
  lang?: 'vi' | 'en' | 'zh';
  onReset?: () => void;
  onReturnHome?: () => void;
}

interface AppleErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

const COPY = {
  vi: {
    badgeApp: 'Bảo vệ hệ thống',
    badge3d: 'Phục hồi không gian 3D',
    titleApp: 'Trạng thái hiển thị đã được bảo vệ',
    title3d: 'Khung cảnh WebGL 3D tạm thời gián đoạn',
    descApp:
      'Một thành phần giao diện gặp sự cố bất ngờ. Hệ thống bảo toàn dữ liệu đã ngăn trang trắng và sẵn sàng khôi phục phiên tham quan ngay lập tức.',
    desc3d:
      'Bộ dựng WebGL 3D vừa gặp tình trạng quá tải hoặc mất ngữ cảnh đồ họa trên thiết bị. Nhấn nút bên dưới để tái khởi tạo không gian triển lãm 3D.',
    recoverBtn: 'Khôi phục không gian 3D',
    reloadBtn: 'Tải lại phiên tham quan',
    homeBtn: 'Về trang Khám phá',
  },
  en: {
    badgeApp: 'System Safeguard',
    badge3d: '3D Viewport Recovery',
    titleApp: 'Display session safely protected',
    title3d: '3D WebGL viewport temporarily interrupted',
    descApp:
      'An unexpected interface error occurred. Our protection boundary prevented a blank screen and is ready to restore your tour immediately.',
    desc3d:
      'The 3D WebGL renderer encountered a temporary GPU context interruption. Click below to cleanly reinitialize the spatial heritage exhibition.',
    recoverBtn: 'Khôi phục không gian 3D',
    reloadBtn: 'Restore Tour Session',
    homeBtn: 'Return to Explore',
  },
  zh: {
    badgeApp: '系统保护',
    badge3d: '3D 空间恢复',
    titleApp: '界面状态已安全保护',
    title3d: '3D WebGL 视图暂时中断',
    descApp:
      '界面组件发生意外异常，系统保护边界已防止白屏并可立即恢复参观会话。',
    desc3d:
      '3D WebGL 渲染引擎遇到临时图形上下文中断。请点击下方按钮重新初始化三维遗产展厅。',
    recoverBtn: 'Khôi phục không gian 3D',
    reloadBtn: '恢复参观会话',
    homeBtn: '返回探索首页',
  },
} as const;

export class AppleErrorBoundary extends React.Component<
  AppleErrorBoundaryProps,
  AppleErrorBoundaryState
> {
  constructor(props: AppleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): AppleErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[AppleErrorBoundary]', error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (this.props.variant === 'app') {
      window.location.reload();
    }
  };

  private handleReturnHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReturnHome) {
      this.props.onReturnHome();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const lang = this.props.lang || 'vi';
    const t = COPY[lang] || COPY.vi;
    const is3D = this.props.variant === 'spatial3d';

    return (
      <div
        className={`w-full flex items-center justify-center p-6 ${
          is3D ? 'min-h-[520px] h-full bg-[#09090B]' : 'min-h-screen bg-[#000000]'
        } text-[#F5F5F7]`}
      >
        <div
          className="relative w-full max-w-lg rounded-[24px] border border-white/[0.12] bg-[#141416]/95 p-7 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          role="alert"
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-[#C5A059]/10 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C5A059]/35 bg-[#C5A059]/12 text-[#E5C17B]">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <span className="font-sans text-xs font-semibold text-[#C5A059]">
              {is3D ? t.badge3d : t.badgeApp}
            </span>

            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[#F5F5F7]">
              {is3D ? t.title3d : t.titleApp}
            </h2>

            <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
              {is3D ? t.desc3d : t.descApp}
            </p>

            {this.state.errorMessage && (
              <div className="mt-4 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2 font-sans tabular-nums text-[11px] text-[#8E8E93] line-clamp-2">
                {this.state.errorMessage}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRecover}
                className="inline-flex items-center gap-2 rounded-full bg-[#C5A059] px-5 py-2.5 text-xs font-semibold text-[#0B0B0C] shadow-[0_0_24px_rgba(197,160,89,0.28)] transition hover:bg-[#D4B06A] active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{is3D ? t.recoverBtn : t.reloadBtn}</span>
              </button>

              {this.props.onReturnHome && (
                <button
                  type="button"
                  onClick={this.handleReturnHome}
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-[#F5F5F7] transition hover:bg-white/[0.1]"
                >
                  <Home className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>{t.homeBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppleErrorBoundary;
