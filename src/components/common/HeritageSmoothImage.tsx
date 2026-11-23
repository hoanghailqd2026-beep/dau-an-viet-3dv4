import React, { useEffect, useRef, useState } from 'react';

export interface HeritageSmoothImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad'> {
  src: string;
  alt: string;
  /** 'dark' -> #171817 (mặc định trên thẻ tối / modal), 'light' -> #E4D7BC (nền giấy kem bảo tàng) */
  waitTone?: 'dark' | 'light';
  /** Class của khung bọc khi cần áp dụng hiệu ứng chuyển động hoặc bo góc */
  wrapperClassName?: string;
  onImageLoad?: () => void;
}

/**
 * Hiển thị ảnh tư liệu chuẩn bảo tàng số:
 * - Nền chờ #171817 hoặc #E4D7BC theo phân khu
 * - Hiệu ứng xuất hiện mượt (transition-opacity duration-500)
 * - Tự động đồng bộ trường hợp ảnh đã có trong browser cache (complete === true)
 */
export const HeritageSmoothImage: React.FC<HeritageSmoothImageProps> = ({
  src,
  alt,
  waitTone = 'dark',
  className = '',
  wrapperClassName,
  onError,
  onImageLoad,
  referrerPolicy = 'no-referrer',
  decoding = 'async',
  loading,
  ...rest
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isLazy = loading === 'lazy';
  const [isInView, setIsInView] = useState<boolean>(() => !isLazy);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLazy) {
      setIsInView(true);
      return;
    }
    if (isInView) return;

    const el = imgRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isLazy, isInView]);

  useEffect(() => {
    setIsLoaded(false);
    if (!isInView) return;
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, isInView]);

  const bgClass = waitTone === 'light' ? 'bg-[#E4D7BC]' : 'bg-[#171817]';

  const imgEl = (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      loading={loading}
      referrerPolicy={referrerPolicy}
      decoding={decoding}
      onLoad={() => {
        if (!isInView) return;
        setIsLoaded(true);
        onImageLoad?.();
      }}
      onError={(e) => {
        if (!isInView) return;
        setIsLoaded(true);
        onError?.(e);
      }}
      className={`${bgClass} transition-opacity duration-500 ease-out ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      {...rest}
    />
  );

  if (wrapperClassName) {
    return <div className={`${bgClass} ${wrapperClassName}`}>{imgEl}</div>;
  }

  return imgEl;
};

export default HeritageSmoothImage;
