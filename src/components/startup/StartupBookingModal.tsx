import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  X,
  GraduationCap,
  Headphones,
  Layers,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  WifiOff,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { activateUserSchoolPackage } from '../../utils/adminPlatformStore';

interface StartupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemoTour?: (routeId?: string) => void;
}

const REGIONAL_B2C_ROUTES = [
  {
    id: 'TOUR-INTER-02',
    label: 'Tuyến Sài Gòn Pháp Cổ & Đông Dương',
  },
  {
    id: 'TOUR-INTER-01',
    label: 'Tuyến Địa Đạo Chiến Tranh Lạnh (Củ Chi - Tam Giác Sắt - Long Phước)',
  },
  {
    id: 'TOUR-INTER-03',
    label: 'Tuyến Văn Hóa Biển & Mở Cõi (TP.HCM - Bình Dương - BRVT)',
  },
];

export const StartupBookingModal: React.FC<StartupBookingModalProps> = ({
  isOpen,
  onClose,
  onStartDemoTour,
}) => {
  const { user, openAuthModal, refreshEntitlements } = useAuth();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-b2c-regional');
  const [selectedB2cRouteId, setSelectedB2cRouteId] = useState<string>('TOUR-INTER-01');
  const [activatedPackage, setActivatedPackage] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');

  if (!isOpen) return null;

  const packages = [
    {
      id: 'pkg-b2c-regional',
      badge: 'Phổ biến nhất · B2C',
      title: 'Gói Tour Âm Thanh 3D Khu Vực (B2C)',
      price: '19.000đ',
      unit: '/ Tuyến',
      icon: Headphones,
      blockBg: 'bg-[#A94F3D] border-[#171817]/25 text-[#D8C9A9]',
      description:
        'Mở khóa trọn vẹn 1 trong 3 tuyến du lịch thông sử liên vùng: Tuyến Sài Gòn Pháp Cổ, Tuyến Địa Đạo Chiến Tranh Lạnh (Củ Chi - Tam Giác Sắt - Long Phước), hoặc Tuyến Văn Hóa Biển & Mở Cõi (TP.HCM - Bình Dương - BRVT).',
      features: [
        'Tuyến Sài Gòn Pháp Cổ · Tuyến Địa Đạo Chiến Tranh Lạnh · Tuyến Văn Hóa Biển & Mở Cõi',
        'Thuyết minh tự động 4 trạm chuyên sâu kèm phụ đề chạy trực tiếp',
        'Camera 3D tự động bay mượt (lerp) đến từng điểm nhấn kiến trúc',
        'Tích hợp Định vị GPS lộ trình & Bộ nhớ đệm Offline tại điểm di tích',
      ],
      ctaText: 'Mở khóa Gói 19.000đ (Demo)',
      routeId: selectedB2cRouteId,
    },
    {
      id: 'pkg-vip-combo',
      badge: 'VIP Pass + Offline Mode',
      title: 'Gói Combo Toàn Vùng Đông Nam Bộ (VIP Pass + Offline Mode)',
      price: '49.000đ',
      unit: '/ Toàn vùng 3 tỉnh',
      icon: WifiOff,
      blockBg: 'bg-[#47796D] border-[#171817]/25 text-[#D8C9A9]',
      description:
        'Mở khóa toàn bộ mô hình giải phẫu 3D liên vùng (TP.HCM - Bình Dương - Bà Rịa Vũng Tàu), tải trước dữ liệu Offline Wi-Fi Cache chống mất sóng và hỏi đáp Sử Quan Dấu Ấn không giới hạn.',
      features: [
        'Mở khóa 100% mô hình giải phẫu 3D (X-Ray xuyên lòng đất & Bóc tách tầng)',
        'Tải trước dữ liệu 3D & Audio (Offline Mode) dùng dưới hầm địa đạo / rừng núi',
        'Hỏi đáp không giới hạn cùng Sử Quan Dấu Ấn (Chuyên gia & Nhân chứng)',
        'Bao gồm toàn bộ 3 Tuyến di sản liên vùng TP.HCM - Bình Dương - BRVT',
      ],
      ctaText: 'Mở khóa VIP Pass 49.000đ (Demo)',
      routeId: 'TOUR-INTER-01',
    },
    {
      id: 'pkg-b2b-edtech',
      badge: 'Giáo dục địa phương · B2B EdTech',
      title: 'Gói Học Liệu Số 3D Trường Học (B2B EdTech)',
      price: 'Hợp đồng B2B',
      unit: '/ Trường THCS & THPT',
      icon: GraduationCap,
      blockBg: 'bg-[#526D8B] border-[#171817]/25 text-[#D8C9A9]',
      description:
        'Dành cho các trường THCS/THPT trải nghiệm ngoại khóa và giảng dạy Lịch sử - Giáo dục địa phương chuẩn Chương trình GDPT 2018 tại TP.HCM, Bình Dương và Bà Rịa - Vũng Tàu.',
      features: [
        'Mở khóa độc quyền Kho Học Liệu Mở, Phiếu Học Tập 3 Tỉnh & Bài Kiểm Tra Trắc Nghiệm Tương Tác',
        'Cấp quyền truy cập bộ công cụ Giải phẫu 3D (X-Ray & Exploded View) cho lớp học',
        'Tổ chức tham quan ngoại khóa ảo liên vùng cho hàng ngàn học sinh cùng lúc',
        'Tích hợp Sử Quan Dấu Ấn đóng vai Nhân chứng Lịch sử giao lưu cùng học sinh',
      ],
      ctaText: 'Mở khóa Học liệu Trường học (Demo)',
      routeId: 'TOUR-INTER-03',
    },
  ];

  const comparisonRows = [
    {
      criterion: 'Chi phí trải nghiệm',
      traditional: '~500.000đ - 1.500.000đ / người (Thuê HDV thực tế, xe đi lại liên tỉnh, vé)',
      platform3d: 'Chỉ 19.000đ - 29.000đ (Rẻ hơn 95% chi phí, mở khóa tức thì)',
    },
    {
      criterion: 'Tính chủ động thời gian',
      traditional: 'Phụ thuộc lịch đoàn, mất 1 - 2 ngày di chuyển qua 3 tỉnh',
      platform3d: 'Chủ động 100% thời gian (Trải nghiệm 24/7 tại chỗ hoặc từ xa)',
    },
    {
      criterion: 'Khả năng quan sát kiến trúc & lòng đất',
      traditional: 'Chỉ nhìn được mặt ngoài hoặc chui qua 1 đoạn hầm ngắn, tối và hẹp',
      platform3d: 'Giải phẫu X-Ray nhìn xuyên 3 tầng đất Địa đạo & Bóc tách từng tầng mái',
    },
    {
      criterion: 'Quản trị rủi ro mất sóng GPS / 4G',
      traditional: 'Dễ lạc hướng hoặc mất kết nối khi xuống hầm ngầm / rừng núi',
      platform3d: 'Tích hợp Định vị GPS điểm di tích & Tải trước Offline Wi-Fi Cache',
    },
    {
      criterion: 'Chuyên gia thuyết minh & Hỏi đáp',
      traditional: 'Thuyết minh 1 chiều theo kịch bản cố định, khó hỏi sâu từng chi tiết',
      platform3d: 'Sử Quan Dấu Ấn 2 chế độ (Chuyên gia Sử học & Nhân chứng) điều khiển 3D',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cửa hàng Dịch vụ E-commerce - HERITAGEGUIDE 3D"
      className="fixed inset-0 z-[70] bg-[#171817]/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92dvh] overflow-y-auto ar-modal-scrollbar rounded-sm bg-[#D8C9A9] border border-[#171817]/25 shadow-[0_24px_80px_rgba(23,24,23,0.4)] text-[#171817] p-4 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#171817]/20 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
              <span className="text-[#A94F3D] font-semibold inline-flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#A94F3D]" />
                <span>Cửa hàng Tour 3D (E-commerce) · HeritageGuide 3D</span>
              </span>
              <span className="text-[#171817]/40">·</span>
              <span className="text-[#171817]/70 font-medium">
                Dấu Ấn Việt 3D · TP.HCM - Bình Dương - Bà Rịa Vũng Tàu
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-[#171817] leading-tight">
              HERITAGEGUIDE 3D (Dấu Ấn Việt 3D) — Cửa Hàng Dịch Vụ Tour Âm Thanh 3D &amp; Học Liệu Số
            </h2>
            <p className="text-xs sm:text-sm text-[#171817]/80 max-w-4xl leading-relaxed">
              Mô hình thương mại hóa khởi nghiệp kết hợp{' '}
              <strong className="text-[#A94F3D]">Hướng dẫn viên Du lịch Ảo</strong>,{' '}
              <strong className="text-[#171817]">Định vị GPS / QR Code chống nhiễu sóng</strong> và{' '}
              <strong className="text-[#47796D]">Giải phẫu Kiến trúc 3D Liên vùng</strong> với chi phí chỉ từ 19.000đ.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-sm bg-[#EDE3CE] hover:bg-[#A94F3D] border border-[#171817]/20 text-[#171817] hover:text-[#D8C9A9] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: VISUAL COMPARISON BANNER & TABLE */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Traditional Tour Card */}
            <div className="p-4 sm:p-5 rounded-sm bg-[#EDE3CE] border border-[#171817]/20 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <span className="inline-block text-[#A94F3D] font-sans text-xs font-semibold">
                  Phương thức truyền thống
                </span>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#171817]">
                  Thuê HDV thực tế &amp; Đi lại liên tỉnh (~500.000đ - 1.500.000đ)
                </h3>
                <p className="text-xs text-[#171817]/80 leading-relaxed">
                  Tốn kém chi phí thuê hướng dẫn viên tại điểm, xe di chuyển qua TP.HCM - Bình Dương - Bà Rịa Vũng Tàu; bị giới hạn tầm nhìn vật lý (không thể nhìn xuyên kết cấu ngầm 3 tầng địa đạo hoặc kết cấu mái).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans tabular-nums text-[#A94F3D] font-medium pt-2 border-t border-[#171817]/15">
                <span>• Chi phí cao (~500.000đ - 1.500.000đ)</span>
                <span>• Phụ thuộc giờ giấc</span>
                <span>• Không có giải phẫu X-Ray 3D</span>
              </div>
            </div>

            {/* HeritageGuide 3D Online Card */}
            <div className="p-4 sm:p-5 rounded-sm bg-[#47796D] border border-[#171817]/25 text-[#D8C9A9] flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-semibold text-[#C9A46A]">
                    Lợi thế cạnh tranh đột phá
                  </span>
                  <span className="text-xs font-sans tabular-nums font-bold text-[#C9A46A] flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Rẻ hơn 95% · Chủ động 100%</span>
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#D8C9A9]">
                  HeritageGuide 3D Online (Chỉ 19.000đ - 29.000đ | Rẻ hơn 95% | Chủ động 100% thời gian)
                </h3>
                <p className="text-xs text-[#D8C9A9]/90 leading-relaxed">
                  Tích hợp chế độ kép <strong className="text-[#C9A46A]">On-site (Định vị GPS &amp; Bộ nhớ đệm Offline tại di tích)</strong> &amp;{' '}
                  <strong className="text-[#C9A46A]">Remote Auto-Tour (Bay Camera 3D, X-Ray &amp; Sử Quan Dấu Ấn)</strong> mọi lúc mọi nơi.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans tabular-nums text-[#C9A46A] font-semibold pt-2 border-t border-[#D8C9A9]/25">
                <span>✓ Chỉ 19.000đ - 29.000đ</span>
                <span>✓ Rẻ hơn 95%</span>
                <span>✓ Chủ động 100% thời gian</span>
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="overflow-x-auto rounded-sm border border-[#171817]/20 bg-[#EDE3CE]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#171817]/20 bg-[#E4D7BC] text-xs font-sans font-semibold text-[#171817]">
                  <th className="py-2.5 px-4">Tiêu chí so sánh lợi thế cạnh tranh</th>
                  <th className="py-2.5 px-4 text-[#A94F3D]">
                    Thuê HDV thực tế &amp; Đi lại liên tỉnh (~500.000đ - 1.500.000đ)
                  </th>
                  <th className="py-2.5 px-4 text-[#47796D]">
                    HeritageGuide 3D Online (Chỉ 19.000đ - 29.000đ | Rẻ hơn 95% | Chủ động 100% thời gian)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171817]/15">
                {comparisonRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[#E4D7BC]/60 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-[#171817]">{r.criterion}</td>
                    <td className="py-2.5 px-4 text-[#171817]/75">{r.traditional}</td>
                    <td className="py-2.5 px-4 text-[#171817] font-medium">{r.platform3d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: 3 STARTUP PRODUCT PACKAGES */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#171817] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#A94F3D]" />
              <span>Chọn Mua / Mở Khóa Demo 3 Gói Sản Phẩm Khởi Nghiệp (B2C &amp; B2B EdTech)</span>
            </h3>
            <span className="text-xs font-sans text-[#171817]/75">
              Bấm chọn gói bất kỳ để mở khóa trải nghiệm Demo ngay lập tức
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              const isSelected = selectedPackageId === pkg.id;
              const isActivated = activatedPackage === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`rounded-sm p-5 border ${pkg.blockBg} flex flex-col justify-between gap-4 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#171817]' : 'opacity-95 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[11px] font-semibold text-[#C9A46A]">
                        {pkg.badge}
                      </span>
                      <div className="w-9 h-9 rounded-sm bg-[#171817]/25 border border-[#D8C9A9]/25 flex items-center justify-center text-[#C9A46A]">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-base sm:text-lg text-[#D8C9A9] leading-snug">
                      {pkg.title}
                    </h4>

                    <div className="flex items-baseline gap-1.5 pb-2 border-b border-[#D8C9A9]/25">
                      <span className="text-2xl sm:text-3xl font-extrabold font-serif tabular-nums text-[#C9A46A]">
                        {pkg.price}
                      </span>
                      <span className="text-xs text-[#D8C9A9]/80 font-sans">{pkg.unit}</span>
                    </div>

                    <p className="text-xs text-[#D8C9A9]/90 leading-relaxed">{pkg.description}</p>

                    {/* Route selector inside Package 1 (B2C Regional) */}
                    {pkg.id === 'pkg-b2c-regional' && (
                      <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-sans font-medium text-[#C9A46A] flex items-center gap-1">
                          <Compass className="w-3 h-3 text-[#C9A46A]" />
                          <span>Chọn Tuyến 3D muốn mở khóa (19.000đ/Tuyến):</span>
                        </span>
                        <div className="space-y-1">
                          {REGIONAL_B2C_ROUTES.map((rt) => (
                            <button
                              key={rt.id}
                              type="button"
                              onClick={() => {
                                setSelectedPackageId('pkg-b2c-regional');
                                setSelectedB2cRouteId(rt.id);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-sm border text-[11px] transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                selectedB2cRouteId === rt.id
                                  ? 'bg-[#C9A46A] border-[#171817] text-[#171817] font-semibold'
                                  : 'bg-[#171817]/25 border-[#D8C9A9]/25 text-[#D8C9A9] hover:bg-[#171817]/40'
                              }`}
                            >
                              <span className="truncate">{rt.label}</span>
                              {selectedB2cRouteId === rt.id && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#171817] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <ul className="space-y-2 pt-1">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#D8C9A9]/95">
                          <CheckCircle2 className="w-4 h-4 text-[#C9A46A] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {pkg.id === 'pkg-b2b-edtech' && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Nhập tên Trường THCS/THPT nhận Học liệu Demo..."
                          className="w-full h-9 px-3 rounded-sm bg-[#F4EFE4] border border-[#171817]/25 text-xs text-[#171817] placeholder:text-[#171817]/50 focus:outline-none focus:border-[#C9A46A]"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        onClose();
                        openAuthModal({
                          prompt:
                            'Vui lòng đăng nhập tài khoản để kích hoạt và lưu trữ vé điện tử vĩnh viễn.',
                        });
                        return;
                      }
                      setSelectedPackageId(pkg.id);
                      setActivatedPackage(pkg.id);
                      if (pkg.id === 'pkg-b2b-edtech') {
                        activateUserSchoolPackage({
                          userId: user.userId,
                          userEmail: user.email || undefined,
                          schoolName: schoolName.trim() || undefined,
                        });
                        refreshEntitlements();
                      }
                      if (onStartDemoTour) {
                        onStartDemoTour(pkg.routeId);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-sm bg-[#171817] hover:bg-[#D8C9A9] text-[#D8C9A9] hover:text-[#171817] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {!user && (
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="#C9A46A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      >
                        <rect x="4" y="9" width="12" height="8" rx="2" />
                        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
                      </svg>
                    )}
                    <span>
                      {!user
                        ? 'Đăng nhập để mở khóa'
                        : isActivated
                        ? 'Đã mở khóa! Bắt đầu Tour 3D ngay'
                        : pkg.ctaText}
                    </span>
                    {user && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVATION CONFIRMATION BANNER */}
        {activatedPackage && (
          <div className="p-4 rounded-sm bg-[#EDE3CE] border border-[#47796D] flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#47796D] shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong className="text-[#47796D] block">
                  Đã mở khóa thành công Gói Trải nghiệm HERITAGEGUIDE 3D!
                </strong>
                <span className="text-[#171817]/85">
                  {schoolName
                    ? `Đơn vị thụ hưởng: ${schoolName} — Đã cấp quyền truy cập Học liệu 3D, X-Ray, Offline Cache & Sử Quan Dấu Ấn.`
                    : 'Toàn bộ tính năng Auto-Tour Thuyết minh, Định vị GPS/QR Offline, X-Ray Địa đạo & Sử Quan Dấu Ấn đã sẵn sàng.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm bg-[#47796D] hover:bg-[#3A655B] text-[#D8C9A9] font-semibold text-xs cursor-pointer transition-colors"
            >
              Trải nghiệm Không gian 3D ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
