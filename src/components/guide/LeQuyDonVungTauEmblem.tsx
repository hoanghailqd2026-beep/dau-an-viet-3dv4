import React from 'react';

export interface LeQuyDonVungTauEmblemProps {
  className?: string;
}

const TOOLTIP_TEXT = 'Trường THPT Chuyên Lê Quý Đôn – Vũng Tàu';
const SCHOOL_LOGO_SRC = '/assets/aistudio/image_91a2175a.png';

export const LeQuyDonVungTauEmblem: React.FC<LeQuyDonVungTauEmblemProps> = ({
  className = 'w-11 h-11 shrink-0',
}) => {
  return (
    <img
      src={SCHOOL_LOGO_SRC}
      alt={TOOLTIP_TEXT}
      title={TOOLTIP_TEXT}
      draggable={false}
      className={`rounded-full bg-[#F7F3EB] p-1 object-contain ring-1 ring-[#C9A46A]/70 shrink-0 select-none ${className}`}
    />
  );
};
