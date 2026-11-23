import React from 'react';
import { CheckCircle2, X, Check } from 'lucide-react';

interface RoadmapModalProps {
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ onClose }) => {
  const phases = [
    {
      stepNumber: '01',
      step: 'Giai đoạn 1',
      title: 'Khảo Sát & Thu Thập Dữ Liệu Thực Địa',
      timeline: 'Quý I - Quý II',
      status: 'completed' as const,
      statusLabel: 'Đã hoàn thành',
      description:
        'Rà soát danh mục di tích chính thức từ Sở Văn hóa & Thể thao TP.HCM; đo đạc tọa độ GPS thực địa và số hóa không gian 3D/VR360 tại các di tích trọng điểm.',
      deliverables: [
        'Hồ sơ trắc địa số hóa định vị vệ tinh GPS WGS-84 / VN-2000',
        'Bộ tư liệu hình ảnh và quét LiDAR Dinh Độc Lập, Bưu điện, Nhà hát, Chợ Bến Thành',
        'Bộ bản đồ số hóa Sài Gòn - Gia Định các thời kỳ (1815, 1898, 1966)',
      ],
    },
    {
      stepNumber: '02',
      step: 'Giai đoạn 2',
      title: 'Xây Dựng CSDL Không Gian & Lập Trình Hệ Thống GIS',
      timeline: 'Quý III',
      status: 'completed' as const,
      statusLabel: 'Đã hoàn thành',
      description:
        'Thiết kế cơ sở dữ liệu không gian PostGIS, kiến trúc API bản đồ vector phân tầng, tích hợp lớp bản đồ quá khứ - hiện tại và mô hình tương tác 3D WebGL.',
      deliverables: [
        'Hệ thống CSDL PostGIS chuẩn hóa 7 nhóm trường dữ liệu di sản',
        'Công cụ đối chiếu bản đồ lịch sử dạng thanh trượt trực quan',
        'Giao diện tương tác Web GIS đáp ứng thời gian tải < 2.0s',
      ],
    },
    {
      stepNumber: '03',
      step: 'Giai đoạn 3',
      title: 'Thẩm Định Khoa Học & Hiệu Đính Chuyên Môn',
      timeline: 'Quý IV',
      status: 'completed' as const,
      statusLabel: 'Đã hoàn thành',
      description:
        'Hội đồng Khoa học với các nhà nghiên cứu lịch sử văn hóa Nam Bộ thẩm định nội dung niên đại, kiến trúc; kiểm thử tính năng định vị GPS và không gian AR thực địa.',
      deliverables: [
        'Biên bản thẩm định của Hội đồng Khoa học Lịch sử TP.HCM',
        'Tệp thuyết minh Audio Guide 3 ngôn ngữ (Việt - Anh - Pháp) chuẩn âm học',
        'Biển nhận diện di tích và hồ sơ số hóa tại các điểm thực địa',
      ],
    },
    {
      stepNumber: '04',
      step: 'Giai đoạn 4',
      title: 'Vận Hành & Tích Hợp Cổng Đô Thị Thông Minh TP.HCM',
      timeline: 'Hiện Tại - Khai Thác Toàn Diện',
      status: 'active' as const,
      statusLabel: 'Đang khai thác',
      description:
        'Công bố chính thức bản đồ số phục vụ người dân, học sinh, nhà nghiên cứu và du khách quốc tế; kết nối API đồng bộ với Cổng dịch vụ công và Cổng du lịch thông minh TP.HCM.',
      deliverables: [
        'Bản đồ số di sản vận hành 24/7 tải cao phục vụ cộng đồng',
        'Kết nối API Cổng thông tin đô thị thông minh Smart City TP.HCM',
        'Tuyến du lịch di sản tự động hóa cho ngành du lịch thành phố',
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-roadmap-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[85vh] max-w-4xl bg-[#0c0c0e] border-0 sm:border sm:border-white/15 rounded-none sm:rounded-[8px] shadow-2xl overflow-hidden flex flex-col text-white">
        {/* ======================================================== */}
        {/* 1. MODAL HEADER (Cố định, không cuộn)                    */}
        {/* ======================================================== */}
        <div className="shrink-0 flex items-center justify-between px-5 md:px-6 py-4 border-b border-white/10 bg-[#121215]">
          <div className="min-w-0">
            <span className="text-xs font-sans text-[#C8A15A] font-medium block truncate">
              Lộ trình triển khai đề án số hóa
            </span>
            <h2
              id="modal-roadmap-title"
              className="text-[20px] md:text-[24px] font-serif font-semibold text-[#F2F2F2] tracking-normal mt-0.5 truncate"
            >
              Quy trình 4 giai đoạn chuẩn hóa
            </h2>
            <p className="text-[13px] text-[#B8B8B8] mt-0.5 truncate">
              Sở Văn hóa & Thể thao TP.HCM · Đề án chuyển đổi số 2025–2030
            </p>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[4px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A15A]"
            aria-label="Đóng cửa sổ lộ trình"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* 2. PROGRESS STEPPER STRIP (Trực quan hóa 4 giai đoạn)    */}
        {/* ======================================================== */}
        <div className="shrink-0 px-5 md:px-6 py-2.5 bg-[#141418] border-b border-white/10 overflow-x-auto flex-nowrap heritage-scrollbar touch-pan-x">
          <div className="flex items-center justify-between min-w-[580px] gap-3 text-xs">
            {phases.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-sans tabular-nums font-semibold shrink-0 ${
                    p.status === 'active'
                      ? 'bg-[#C8A15A] text-black ring-2 ring-[#C8A15A]/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {p.status === 'active' ? p.stepNumber : <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[#F2F2F2] truncate">{p.step}</div>
                  <div className="text-[11px] text-[#B8B8B8] truncate">{p.timeline}</div>
                </div>
                {idx < phases.length - 1 && (
                  <div className="h-[1px] flex-1 bg-white/10 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. MODAL BODY (Cuộn độc lập, lưới 2 cột desktop)         */}
        {/* ======================================================== */}
        <div className="flex-1 relative min-h-0 overflow-hidden bg-[#0c0c0e]">
          <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-7 modal-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5 items-stretch pb-6">
              {phases.map((p, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col justify-between h-full p-5 md:p-6 rounded-[8px] border transition-all ${
                    p.status === 'active'
                      ? 'bg-[#15130e] border-[#C8A15A] ring-1 ring-[#C8A15A]/40 shadow-[0_0_24px_rgba(200,161,90,0.12)]'
                      : 'bg-[#111114] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top: Metadata & Title */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[12px] font-sans tabular-nums font-medium px-2.5 py-0.5 rounded-[3px] border ${
                          p.status === 'active'
                            ? 'bg-[#C8A15A]/15 text-[#C8A15A] border-[#C8A15A]/35'
                            : 'bg-white/[0.05] text-[#B8B8B8] border-white/10'
                        }`}
                      >
                        {p.step} · {p.timeline}
                      </span>

                      {p.status === 'completed' ? (
                        <span className="flex items-center gap-1.5 text-[13px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{p.statusLabel}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[13px] text-[#C8A15A] font-medium">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8A15A] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8A15A]" />
                          </span>
                          <span>{p.statusLabel}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#F2F2F2] mt-1.5 tracking-normal leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-[13.5px] text-[#B8B8B8] mt-2.5 leading-[1.6]">
                      {p.description}
                    </p>
                  </div>

                  {/* Bottom: Deliverables anchored evenly */}
                  <div className="mt-5 pt-3.5 border-t border-white/10 space-y-2">
                    <span className="text-xs text-[#C8A15A] font-semibold font-sans block">
                      Kết quả bàn giao:
                    </span>
                    {p.deliverables.map((d, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex items-start gap-2 text-[13px] text-[#B8B8B8] leading-[1.6]"
                      >
                        <span className="text-[#C8A15A] shrink-0 mt-0.5">•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fade gradient mask at bottom to signal more scrollable content */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/80 to-transparent z-10" />
        </div>
      </div>
    </div>
  );
};
