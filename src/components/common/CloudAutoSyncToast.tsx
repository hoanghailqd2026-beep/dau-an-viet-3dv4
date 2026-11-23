import React from 'react';
import { Check, CloudUpload, ShieldAlert, X } from 'lucide-react';
import { emitCloudAutoSyncToast, useCloudAutoSyncToast } from '../../utils/cloudSync';

/**
 * Compact dark-museum corner progress toast shown automatically when Admin saves
 * a new photo, audio track, 3D model, video, account, or CMS update in the background.
 */
export const CloudAutoSyncToast: React.FC = () => {
  const toast = useCloudAutoSyncToast();

  if (!toast.active || !toast.label) return null;

  const accentBorder =
    toast.status === 'ok'
      ? 'border-[#47796D]/65'
      : toast.status === 'error'
      ? 'border-[#A94F3D]/65'
      : 'border-[#C9A46A]/55';

  const barColor =
    toast.status === 'ok'
      ? 'bg-[#47796D]'
      : toast.status === 'error'
      ? 'bg-[#A94F3D]'
      : 'bg-[#C9A46A]';

  return (
    <div
      className="fixed bottom-4 right-4 z-[95] max-w-sm w-[calc(100vw-2rem)] pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-md border ${accentBorder} bg-[#141514]/96 backdrop-blur-md shadow-[0_14px_40px_rgba(0,0,0,0.65)] overflow-hidden`}
      >
        <div className="px-3.5 py-2.5 flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            {toast.status === 'syncing' ? (
              <CloudUpload className="w-4 h-4 text-[#C9A46A] animate-pulse" />
            ) : toast.status === 'ok' ? (
              <Check className="w-4 h-4 text-[#7EC4B2]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#E07A66]" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="text-xs font-medium text-[#F7F3EB] leading-snug truncate">
              {toast.label}
            </div>
            {toast.detail && (
              <div className="text-[11px] font-mono text-[#D8C9A9]/75 truncate">
                {toast.detail}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => emitCloudAutoSyncToast({ active: false, status: 'ok', label: '' })}
            className="text-[#D8C9A9]/55 hover:text-[#F7F3EB] cursor-pointer shrink-0 p-0.5"
            aria-label="Đóng thông báo đồng bộ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {typeof toast.percent === 'number' && (
          <div className="h-[3px] w-full bg-white/10">
            <div
              className={`h-full ${barColor} transition-all duration-200`}
              style={{ width: `${Math.max(4, Math.min(100, toast.percent))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
