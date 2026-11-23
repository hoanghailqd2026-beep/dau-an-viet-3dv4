import React from 'react';
import { useI18n } from '../../i18n/I18nContext';

export type LogoVariant =
  | 'roof_curved' // Phương án A (KHUYẾN NGHỊ): Mái đao cong đình/chùa Nam Bộ
  | 'tile_flower' // Phương án B: Hoa văn gạch bông Sài Gòn xưa 4 cánh
  | 'louver_window' // Phương án C: Cửa sổ lá sách + mái ngói kiến trúc Nam Bộ
  // Backward compatibility:
  | 'arch_pin'
  | 'roof_dragon'
  | 'monogram_s';

export type LogoLayout = 'horizontal' | 'vertical' | 'icon_only';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  animated?: boolean;
}

/**
 * PHƯƠNG ÁN A (KHUYẾN NGHỊ): MÁI ĐAO CONG ĐÌNH / CHÙA NAM BỘ
 * - Nét mái đình/chùa truyền thống với hai đầu mái cong vút thanh thoát (đầu đao).
 * - Dưới là đường ngói âm dương và hệ kết cấu rường cột tối giản.
 * - Nét liền tối thiểu 2px, hoàn toàn không viền ô vuông bo góc, nhận diện rõ ở 32px.
 */
export const LogoRoofCurved: React.FC<IconProps> = ({
  size = 34,
  color = '#C9A15B',
  className = '',
  animated = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${animated ? 'animate-logo-draw' : ''} ${className}`}
    style={{ overflow: 'visible' }}
    aria-hidden="true"
  >
    {/* Đỉnh chóp nóc / kìm nóc thanh lịch */}
    <path
      d="M18 4.5V7.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Bờ nóc và hai đầu mái đao cong vút truyền thống */}
    <path
      d="M3 13.5C7.5 14 12 12 18 7.5C24 12 28.5 14 33 13.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Mũi đao uốn cong thanh thoát ở hai đầu hồi */}
    <path
      d="M3 13.5C2.5 10.8 5 9.8 7 10.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M33 13.5C33.5 10.8 31 9.8 29 10.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Đường tầng ngói hạ / diềm mái âm dương */}
    <path
      d="M5 19.5C9.5 19 13.5 16.8 18 13.8C22.5 16.8 26.5 19 31 19.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Xà ngang đỡ mái */}
    <path
      d="M7.5 24C11.5 23.5 14.5 22 18 20C21.5 22 24.5 23.5 28.5 24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Cột đình đôi vững chãi */}
    <line
      x1="12"
      y1="23.5"
      x2="12"
      y2="28"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="24"
      y1="23.5"
      x2="24"
      y2="28"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Bậc thềm móng nền di sản */}
    <line
      x1="8.5"
      y1="28.5"
      x2="27.5"
      y2="28.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * PHƯƠNG ÁN B: HOA VĂN GẠCH BÔNG SÀI GÒN XƯA
 * - Hình hoa bốn cánh đối xứng (hoa thị) kinh điển trên nền gạch bông Sài Gòn.
 * - Khung hình thoi mảnh 2px, đường nét cân đối, tôn vinh ký ức đô thị Nam Bộ.
 */
export const LogoTileFlower: React.FC<IconProps> = ({
  size = 34,
  color = '#C9A15B',
  className = '',
  animated = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${animated ? 'animate-logo-draw' : ''} ${className}`}
    aria-hidden="true"
  >
    {/* Khung hình thoi mảnh viền ngoài */}
    <path
      d="M18 3.5L32.5 18L18 32.5L3.5 18Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Cánh hoa trên & dưới */}
    <path
      d="M18 18C14 12.5 14 7.5 18 5.5C22 7.5 22 12.5 18 18Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 18C14 23.5 14 28.5 18 30.5C22 28.5 22 23.5 18 18Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Cánh hoa trái & phải */}
    <path
      d="M18 18C12.5 14 7.5 14 5.5 18C7.5 22 12.5 22 18 18Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 18C23.5 14 28.5 14 30.5 18C28.5 22 23.5 22 18 18Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Tâm điểm hoa thị */}
    <circle cx="18" cy="18" r="1.8" fill={color} />
  </svg>
);

/**
 * PHƯƠNG ÁN C: CỬA SỔ LÁ SÁCH + MÁI NGÓI KIẾN TRÚC NAM BỘ
 * - Tổ hợp hình học tối giản: mái ngói che vát phía trên và cửa sổ lá sách hai cánh.
 * - Đặc trưng của biệt thự, dinh thự và công trình di sản Sài Gòn - Nam Bộ.
 */
export const LogoLouverWindow: React.FC<IconProps> = ({
  size = 34,
  color = '#C9A15B',
  className = '',
  animated = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${animated ? 'animate-logo-draw' : ''} ${className}`}
    aria-hidden="true"
  >
    {/* Mái ngói hiên che dốc */}
    <path
      d="M3.5 9.5L18 4L32.5 9.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Diềm mái ngang */}
    <line
      x1="2"
      y1="11"
      x2="34"
      y2="11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Khung bao cửa sổ hình học */}
    <rect
      x="7"
      y="13.5"
      width="22"
      height="18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Đố dọc chia hai cánh cửa */}
    <line
      x1="18"
      y1="13.5"
      x2="18"
      y2="31.5"
      stroke={color}
      strokeWidth="2"
    />

    {/* Các lá sách nghiêng thông gió cánh trái */}
    <line x1="10" y1="17.5" x2="15" y2="17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="10" y1="21.5" x2="15" y2="21.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="10" y1="25.5" x2="15" y2="25.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />

    {/* Các lá sách nghiêng thông gió cánh phải */}
    <line x1="21" y1="17.5" x2="26" y2="17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="21" y1="21.5" x2="26" y2="21.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="21" y1="25.5" x2="26" y2="25.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export interface HeritageBrandLogoProps {
  variant?: LogoVariant;
  layout?: LogoLayout;
  size?: number;
  className?: string;
  animated?: boolean;
  monochrome?: boolean;
  showSubtitle?: boolean;
}

/**
 * THƯƠNG HIỆU SAIGON HERITAGE - BẢN ĐỒ DI SẢN VĂN HÓA VẬT THỂ TP.HCM
 * Phong cách truyền thống Việt Nam:
 * - Đơn sắc vàng đồng #C9A15B (hoặc trắng ấm #F5EFE6 nếu monochrome)
 * - Nét tối thiểu 2px, không viền ô vuông bo góc, không biểu tượng chữ S/ghim
 * - Typography Serif Cormorant Garamond cao cấp với nét thanh đậm tinh tế
 * - Hai bố cục: 'horizontal' (ngang cho header) và 'vertical' (dọc cho loading/poster)
 */
export const HeritageBrandLogo: React.FC<HeritageBrandLogoProps> = ({
  variant = 'roof_curved',
  layout = 'horizontal',
  size = 34,
  className = '',
  animated = true,
  monochrome = false,
  showSubtitle = true,
}) => {
  const { lang } = useI18n();
  const primaryColor = monochrome ? '#171817' : '#A94F3D';

  const subtitleText =
    lang === 'en'
      ? 'Virtual Tour Guide & Inter-regional 3D Heritage Anatomy Map'
      : lang === 'zh'
      ? '虚拟导游与跨区域3D遗产解剖数字地图'
      : 'Hướng dẫn viên Du lịch Ảo & Bản đồ số Giải phẫu Di sản Liên vùng';

  const renderIcon = () => {
    switch (variant) {
      case 'tile_flower':
      case 'monogram_s':
        return <LogoTileFlower size={size} color={primaryColor} animated={animated} />;
      case 'louver_window':
        return <LogoLouverWindow size={size} color={primaryColor} animated={animated} />;
      case 'roof_curved':
      case 'arch_pin':
      case 'roof_dragon':
      default:
        return <LogoRoofCurved size={size} color={primaryColor} animated={animated} />;
    }
  };

  if (layout === 'icon_only') {
    return <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>{renderIcon()}</div>;
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <div className="relative mb-3 flex items-center justify-center">
          {renderIcon()}
        </div>

        <div className="flex flex-col items-center">
          <span className="font-serif text-xl sm:text-2xl text-[#171817] font-semibold leading-tight">
            {lang === 'zh' ? '越南印记 3D' : lang === 'en' ? 'Dau An Viet 3D' : 'Dấu Ấn Việt 3D'}
          </span>
          <span className="font-sans text-xs font-medium text-[#A94F3D] mt-1">
            {lang === 'en'
              ? 'HeritageGuide 3D · Archival Edition'
              : lang === 'zh'
              ? 'HeritageGuide 3D · 数字档案馆版'
              : 'HeritageGuide 3D · Phiên bản Bảo tàng Số'}
          </span>
        </div>

        {showSubtitle && (
          <span className="font-sans text-[11px] font-normal text-[#171817]/70 mt-2 max-w-[420px]">
            {subtitleText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col text-left justify-center min-w-0 select-none ${className}`}>
      <span className="font-serif text-base sm:text-lg text-[#171817] group-hover:text-[#A94F3D] transition-colors font-semibold leading-none whitespace-nowrap">
        {lang === 'zh' ? '越南印记 3D' : 'Dấu Ấn Việt 3D'}
      </span>
      {showSubtitle && (
        <span className="font-sans text-[11px] text-[#171817]/70 mt-1 whitespace-nowrap truncate max-w-[220px] sm:max-w-[320px]">
          {lang === 'en'
            ? 'Southern Vietnam Architectural Archive'
            : lang === 'zh'
            ? '越南东南部建筑与历史遗产数字档案馆'
            : 'Bảo tàng số Kiến trúc & Di sản Đông Nam Bộ'}
        </span>
      )}
    </div>
  );
};
