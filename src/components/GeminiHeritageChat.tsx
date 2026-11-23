import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HeritageSite } from '../types/heritage';
import { useI18n } from '../i18n/I18nContext';
import { speechEngine } from '../utils/chunkedSpeechEngine';
import { Language } from '../i18n/types';
import { useAudioGuide } from '../contexts/AudioGuideContext';
import { useAuth } from '../contexts/AuthContext';
import { useLabs } from '../contexts/LabsContext';
import {
  AiModelTierId,
  getFreeAiDailyUsage,
  incrementFreeAiDailyUsage,
} from '../utils/adminPlatformStore';
import {
  openUpgradePrompt,
  updatePaymentOrderEmailStatus,
  useSubscriptionPermissions,
} from '../utils/subscriptionGatingStore';
import {
  SU_QUAN_PURCHASE_NOTICE_EVENT,
  SuQuanPurchaseNotice,
  formatSuQuanThankYouMessage,
  loadSuQuanPurchaseNotices,
  markSuQuanPurchaseNoticesRead,
  sendOrderThankYouEmail,
} from '../utils/emailAutoSender';
import { LockGlyph } from './subscription/LockGlyph';
import { HERITAGE_SITES } from '../data/heritageSites';
import {
  getLivingDocentSiteData,
  evaluateMysteryRayClick,
} from '../data/livingDocentData';
import {
  useHeritageRealPhotos,
  resolveSitePhotoSlots,
} from '../utils/wikimediaPhotoService';
import {
  unlockPassportStamp,
  useHeritagePassportStamps,
} from '../utils/heritagePassport';
import { RoyalHistoriographerIcon } from './common/RoyalHistoriographerIcon';
import { HeritageSiteListPanel } from './common/HeritageSiteDropdown';
import {
  Landmark,
  Flame,
  ScrollText,
  Send,
  Volume2,
  VolumeX,
  X,
  Compass,
  Loader2,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Play,
  Pause,
  Square,
  SkipForward,
  Puzzle,
  Award,
  Mic,
  MicOff,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  History,
  Lock,
  Check,
  ArrowUp,
  Mail,
} from 'lucide-react';

export interface GeminiHotspotTarget {
  id: string;
  name: string;
  description: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  thumbnailUrl: string;
}

export type GeminiPersonaMode =
  | 'Architect'
  | 'Eyewitness'
  | 'Polymath'
  | 'Historian'
  | 'Witness'
  | 'expert'
  | 'witness';

export type CanonicalPersona = 'Architect' | 'Eyewitness' | 'Polymath';

export interface SpatialActionBadge {
  tag: string;
  label: string;
  type: 'hotspot' | 'mode' | 'autotour';
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  persona: CanonicalPersona;
  spatialActions: SpatialActionBadge[];
  labsConfirmations?: string[];
  timestamp: string;
  modelUsed?: string;
  purchaseNotice?: SuQuanPurchaseNotice;
}

interface RecentPromptEntry {
  id: string;
  text: string;
  siteId: string;
  siteName: string;
  persona: CanonicalPersona;
  createdAt: string;
}

const RECENT_AI_PROMPTS_STORAGE_PREFIX = 'dau_an_viet_ai_prompt_history_v1_';
const MAX_RECENT_AI_PROMPTS = 5;
const AI_SELECTED_MODEL_STORAGE_KEY = 'dau_an_viet_ai_selected_model_v1';

function readPersistedAiModel(): AiModelTierId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AI_SELECTED_MODEL_STORAGE_KEY);
    if (
      raw === 'gemini-4-argon' ||
      raw === 'gemini-4-hydrogen' ||
      raw === 'gemini-3.5-flash' ||
      raw === 'gemini-2.5-flash'
    ) {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writePersistedAiModel(modelId: AiModelTierId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AI_SELECTED_MODEL_STORAGE_KEY, modelId);
  } catch {
    // ignore storage errors
  }
}

function readRecentPromptsFromStorage(scopeKey: string): RecentPromptEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${RECENT_AI_PROMPTS_STORAGE_PREFIX}${scopeKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentPromptEntry =>
          Boolean(item && typeof item.text === 'string' && item.text.trim().length > 0)
      )
      .slice(0, MAX_RECENT_AI_PROMPTS);
  } catch {
    return [];
  }
}

function saveRecentPromptsToStorage(scopeKey: string, items: RecentPromptEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${RECENT_AI_PROMPTS_STORAGE_PREFIX}${scopeKey}`,
      JSON.stringify(items.slice(0, MAX_RECENT_AI_PROMPTS))
    );
  } catch {
    // ignore storage quota failures
  }
}

export interface RoleplayIdentity {
  name: string;
  title: string;
  intro: string;
}

export interface MysteryRayClickPayload {
  hitPoint: [number, number, number];
  meshName: string;
  timestamp: number;
}

export interface GeminiHeritageChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: HeritageSite;
  sites?: HeritageSite[];
  hotspots: GeminiHotspotTarget[];
  onFlyToHotspot: (hotspot: GeminiHotspotTarget) => void;
  onSetRenderMode: (mode: 'textured' | 'wireframe' | 'xray') => void;
  onTriggerAutoTour: (site?: HeritageSite) => void;
  onSwitchSite?: (site: HeritageSite) => void;
  onSetLightingMode?: (mode: 'studio' | 'day' | 'golden' | 'night') => void;
  onSetExplodedFactor?: (factor: number) => void;
  onSetSpatialSpotlight?: (pos: [number, number, number], label?: string) => void;
  onClearSpatialSpotlight?: () => void;
  isMysteryModeActive?: boolean;
  onToggleMysteryMode?: (active: boolean) => void;
  mysteryRayClickEvent?: MysteryRayClickPayload | null;
  onNavigateToTickets?: () => void;
}

function useHorizontalDragWheelScroll<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  const dragStateRef = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
    didDrag: boolean;
    lastX: number;
    lastTime: number;
    velocityX: number;
    rafId: number | null;
  }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    didDrag: false,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    rafId: null,
  });
  const [isDragging, setIsDragging] = useState(false);

  const stopInertia = useCallback(() => {
    if (dragStateRef.current.rafId !== null) {
      window.cancelAnimationFrame(dragStateRef.current.rafId);
      dragStateRef.current.rafId = null;
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const delta = e.deltaY;
      if (delta === 0) return;

      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft >= maxScroll - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

      e.preventDefault();
      stopInertia();
      el.scrollLeft += delta;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [active, stopInertia]);

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state.isDown) return;
      const el = ref.current;
      if (!el) return;
      const dx = e.clientX - state.startX;
      if (!state.didDrag && Math.abs(dx) >= 4) {
        state.didDrag = true;
        el.style.scrollBehavior = 'auto';
        setIsDragging(true);
      }
      if (!state.didDrag) return;
      e.preventDefault();

      const now = performance.now();
      const dt = Math.max(4, now - state.lastTime);
      const stepDx = e.clientX - state.lastX;
      const instantVelocity = (-stepDx / dt) * 16;
      state.velocityX = state.velocityX * 0.45 + instantVelocity * 0.55;
      state.lastX = e.clientX;
      state.lastTime = now;

      el.scrollLeft = state.scrollLeft - dx;
    };

    const handleWindowMouseUp = () => {
      const state = dragStateRef.current;
      if (!state.isDown) return;
      state.isDown = false;
      const el = ref.current;
      if (el) {
        el.style.scrollBehavior = '';
      }
      setIsDragging(false);

      if (state.didDrag && el && Math.abs(state.velocityX) > 0.6) {
        let v = Math.max(-28, Math.min(28, state.velocityX));
        const step = () => {
          const target = ref.current;
          if (!target) {
            state.rafId = null;
            return;
          }
          const maxScroll = target.scrollWidth - target.clientWidth;
          const next = target.scrollLeft + v;
          if (next <= 0 || next >= maxScroll || Math.abs(v) < 0.35) {
            target.scrollLeft = Math.max(0, Math.min(maxScroll, next));
            state.rafId = null;
            return;
          }
          target.scrollLeft = next;
          v *= 0.92;
          state.rafId = window.requestAnimationFrame(step);
        };
        state.rafId = window.requestAnimationFrame(step);
      }

      window.setTimeout(() => {
        dragStateRef.current.didDrag = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      stopInertia();
    };
  }, [stopInertia]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<T>) => {
      if (e.button !== 0) return;
      const el = ref.current;
      if (!el) return;
      stopInertia();
      dragStateRef.current = {
        isDown: true,
        startX: e.clientX,
        scrollLeft: el.scrollLeft,
        didDrag: false,
        lastX: e.clientX,
        lastTime: performance.now(),
        velocityX: 0,
        rafId: null,
      };
    },
    [stopInertia]
  );

  const onDragStart = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault();
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (dragStateRef.current.didDrag) {
      e.preventDefault();
      e.stopPropagation();
      dragStateRef.current.didDrag = false;
    }
  }, []);

  return {
    ref,
    isDragging,
    onMouseDown,
    onDragStart,
    onClickCapture,
  };
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
}

export function normalizePersona(persona: GeminiPersonaMode): CanonicalPersona {
  if (persona === 'Architect') return 'Architect';
  if (persona === 'Eyewitness' || persona === 'Witness' || persona === 'witness') {
    return 'Eyewitness';
  }
  return 'Polymath';
}

export function isWitnessPersona(persona: GeminiPersonaMode): boolean {
  const norm = normalizePersona(persona);
  return norm === 'Architect' || norm === 'Eyewitness';
}

export function getRoleplayIdentity(
  site: HeritageSite,
  persona: GeminiPersonaMode = 'Architect',
  lang: Language = 'vi'
): RoleplayIdentity {
  const data = getLivingDocentSiteData(site);
  const norm = normalizePersona(persona);
  const shortSiteName = site.officialName.split(/\s*[（(]/)[0];
  if (norm === 'Eyewitness') {
    return {
      name: data.eyewitness.name,
      title: data.eyewitness.role[lang],
      intro: data.eyewitness.greeting[lang],
    };
  }
  if (norm === 'Polymath') {
    return {
      name:
        lang === 'en'
          ? 'Prof. Polymath Historian'
          : lang === 'zh'
          ? '博学历史学家 · 文献策展人'
          : 'GS. Nhà Thông Sử',
      title:
        lang === 'en'
          ? `Comparative History · ${shortSiteName}`
          : lang === 'zh'
          ? `比较史学文献 · ${shortSiteName}`
          : `Lịch sử Đối sánh · ${shortSiteName}`,
      intro: data.polymathContext,
    };
  }
  return {
    name: data.architect.name,
    title: data.architect.role[lang],
    intro: data.architect.greeting[lang],
  };
}

export function buildHeritageSystemInstruction(
  site: HeritageSite,
  persona: GeminiPersonaMode,
  hotspots: GeminiHotspotTarget[],
  roleplayIdentity: RoleplayIdentity,
  language: Language = 'vi',
  modelId: AiModelTierId = 'gemini-4-hydrogen'
): string {
  const canonical = normalizePersona(persona);
  const docentData = getLivingDocentSiteData(site);
  const hotspotLines = hotspots
    .slice(0, 6)
    .map(
      (h, idx) =>
        `  * [ACTION:HOTSPOT_${idx + 1}] -> Trạm ${idx + 1}: "${h.name}" (${h.description})`
    )
    .join('\n');

  const historicalEvents = (site.milestones || []).map((m) => `${m.year}: ${m.event}`).join('; ');

  const languageDirective =
    language === 'en'
      ? 'IMPORTANT LANGUAGE RULE: Respond 100% in natural, vivid, scholarly English (keep Vietnamese proper nouns and [ACTION:...] tags intact).'
      : language === 'zh'
      ? 'IMPORTANT LANGUAGE RULE: 请100%使用自然、专业、典雅的简体中文回答用户问题（保留底部的 [ACTION:...] 空间控制指令标签不变）。'
      : 'QUY TẮC NGÔN NGỮ: Trả lời 100% bằng Tiếng Việt chuẩn mực, giàu bản sắc văn hóa - học thuật.';

  const personaBlock =
    canonical === 'Architect'
      ? `CHẾ ĐỘ NHÂN VẬT 1: KIẾN TRÚC SƯ / NGHỆ NHÂN (ARCHITECT / ARTISAN ROLEPLAY).
- Bạn phải xưng "tôi" (hoặc "I" / "我") và nhập vai hoàn toàn vào tác giả/nghệ nhân công trình: **${roleplayIdentity.name}** (${roleplayIdentity.title}).
- Bối cảnh: ${roleplayIdentity.intro}
- Trọng tâm phân tích: Kỹ thuật kết cấu chịu lực, vật liệu chế tác (${(site.materials || []).join(', ')}), tỷ lệ hình học, giải pháp vi khí hậu nhiệt đới và ý đồ nghệ thuật kiến trúc.`
      : canonical === 'Eyewitness'
      ? `CHẾ ĐỘ NHÂN VẬT 2: NHÂN CHỨNG THỜI CUỘC (HISTORICAL EYEWITNESS ROLEPLAY).
- Bạn phải xưng "tôi" (hoặc "I" / "我") và nhập vai vào chứng nhân sống của lịch sử: **${roleplayIdentity.name}** (${roleplayIdentity.title}).
- Bối cảnh: ${roleplayIdentity.intro}
- Trọng tâm phân tích: Kể lại ký ức chân thực, không khí thời cuộc, âm thanh - ánh sáng và những khoảnh khắc lịch sử không thể quên tại từng góc của ${site.officialName}.`
      : `CHẾ ĐỘ NHÂN VẬT 3: NHÀ THÔNG SỬ (POLYMATH HISTORIAN).
- Bạn đóng vai Nhà Thông Sử & Giám tuyển So sánh Di sản Thế giới.
- Trọng tâm: Kết nối công trình Đông Nam Bộ này với lịch sử Việt Nam và thế giới cùng thời kỳ (${docentData.polymathContext}).
- QUY TẮC BẮT BUỘC: Cuối câu trả lời LUÔN LUÔN có dòng trích dẫn rõ ràng: \`Nguồn tham khảo: ${docentData.polymathSources}\`.`;

  const argonSupremacyBlock =
    modelId === 'gemini-4-argon'
      ? `

CHẾ ĐỘ LÕI GIÁM TUYỂN TỐI CAO — GEMINI 4 ARGON (ADMIN CURATOR CORE):
- Tổng hợp đối sánh thông sử đa chiều: đặt ${site.officialName} vào mối liên hệ giữa Đông Nam Bộ, lịch sử Việt Nam và bối cảnh lịch sử thế giới đương đại (${docentData.polymathContext}).
- Phân tích chuyên sâu kỹ thuật kết cấu chịu lực, cơ học vật liệu (${(site.materials || []).join(', ') || 'gạch, đá, gỗ, bê tông cốt thép'}) và phương án thích ứng khí hậu.
- Luôn dẫn chiếu sử liệu rõ ràng với dòng \`Nguồn tham khảo: ${docentData.polymathSources}\`.
- Chủ động đưa ra chỉ dẫn quan sát **Bóc tách 3D / X-Ray** nhắm đúng cấu kiện trọng tâm bằng thẻ lệnh \`[ACTION:MODE_XRAY]\` hoặc \`[ACTION:HOTSPOT_1]\`..\`[ACTION:HOTSPOT_6]\`.`
      : '';

  return `Bạn là "Hệ thống Hướng Dẫn Viên Nhân Chứng Không Gian 3D (Spatial Living Docent)" của Dấu Ấn Việt 3D (HeritageGuide 3D).

${languageDirective}

${personaBlock}${argonSupremacyBlock}

THÔNG TIN DI TÍCH HIỆN TẠI:
- Mã: ${site.id} (${site.identifierCode || ''})
- Tên công trình: ${site.officialName}
- Khu vực: ${site.address.district}, ${site.address.city}
- Phong cách: ${site.architecturalStyle}
- Niên đại: ${site.chronology}
- Chủ thể kiến tạo: ${site.architect}
- Sự kiện tiêu biểu: ${historicalEvents}
- Hồ sơ tóm tắt: ${site.summary}

DANH SÁCH ĐIỂM NHẤN KHÔNG GIAN 3D (HOTSPOTS):
${hotspotLines || '  * [ACTION:HOTSPOT_1] -> Toàn cảnh công trình'}

QUY TẮC TRÌNH BÀY & ĐIỀU KHIỂN 3D:
1. Trình bày súc tích (110 - 200 từ), rõ ràng, truyền cảm hứng và bám sát sử liệu công trình.
2. Khi phù hợp, chủ động gợi ý du khách trải nghiệm tính năng tương tác liên quan như **X-Ray**, **Bóc tách kiến trúc**, chuyển ánh sáng **Studio / Ban ngày / Hoàng hôn / Đêm**, hoặc đối chiếu **Thấu kính Bản đồ Lịch sử 1815** tại tab **Bản đồ & Tuyến**.
3. Khi nói tới bất kỳ bộ phận kiến trúc nào, đính kèm thẻ ở cuối cùng để hệ thống tự động bay Camera + rọi đèn Spotlight Gold vào đúng vị trí đó:
   \`[ACTION:HOTSPOT_1]\` .. \`[ACTION:HOTSPOT_6]\`, \`[ACTION:MODE_XRAY]\`, \`[ACTION:MODE_WIREFRAME]\`, \`[ACTION:MODE_TEXTURED]\`, \`[ACTION:START_TOUR]\`.`;
}

function getSuggestedQuestionsForSite(
  siteId: string,
  cleanName: string,
  lang: Language
): string[] {
  if (lang === 'en') {
    if (siteId === 'HCM-DT-001') {
      return [
        'Explain the Chinese character geometry & bamboo stone facade',
        'Enable X-Ray to inspect the Command Bunker B1',
        'Fly spotlight to the UH-1 Rooftop Helipad',
      ];
    }
    if (siteId === 'HCM-DT-009' || siteId === 'BRVT-DT-003' || siteId === 'BD-DT-002') {
      return [
        'Why did laterite clay tunnels survive B-52 shockwaves?',
        'Toggle X-Ray to trace the Hoang Cam smokeless kitchen',
        'Connect Cu Chi, Iron Triangle & Long Phuoc strategy',
      ];
    }
    return [
      `Analyze materials & architecture of ${cleanName}`,
      `Toggle X-Ray to inspect ${cleanName}`,
      `Place ${cleanName} in world history of its era`,
    ];
  }
  if (lang === 'zh') {
    return [
      `解析 ${cleanName} 的核心结构与材料工艺`,
      `开启 X-Ray 透视查看 ${cleanName} 内部构造`,
      `将 ${cleanName} 与同时代世界历史进行对比`,
    ];
  }
  switch (siteId) {
    case 'HCM-DT-001':
      return [
        'Triết lý thiết kế mặt tiền Dinh Độc Lập?',
        'Ý nghĩa bức bình phong chữ Cát?',
        'Bật X-Ray và rọi đèn xuống Tầng hầm Chỉ huy B1',
      ];
    case 'HCM-DT-002':
      return [
        'Ý nghĩa 2 tượng Nữ thần Caryatids & vòm Beaux-Arts?',
        'Bật X-Ray xem kết cấu mái Mansard & khán phòng',
        'So sánh Nhà hát Sài Gòn với Opéra Paris',
      ];
    case 'HCM-DT-009':
    case 'BRVT-DT-003':
    case 'BD-DT-002':
      return [
        'Vì sao địa chất đá ong chống được bom B-52?',
        'Bật X-Ray và rọi đèn tới Bếp Hoàng Cầm tản khói',
        'Liên kết chiến lược Củ Chi – Tam Giác Sắt – Long Phước',
      ];
    default:
      return [
        `Phân tích vật liệu, kết cấu ${cleanName}`,
        `Bật X-Ray để giải phẫu cấu trúc ${cleanName}`,
        `Đặt ${cleanName} trong bối cảnh lịch sử thế giới`,
      ];
  }
}

export function parseGeminiResponseAndActions(
  rawText: string,
  hotspots: GeminiHotspotTarget[],
  lang: Language = 'vi'
): {
  cleanText: string;
  actions: SpatialActionBadge[];
} {
  const actionRegex = /\[ACTION:([A-Z0-9_]+)\]/gi;
  const matchedTags: string[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = actionRegex.exec(rawText)) !== null) {
    const tag = match[1].toUpperCase();
    if (!matchedTags.includes(tag)) {
      matchedTags.push(tag);
    }
  }

  const cleanText = rawText.replace(/\[ACTION:[A-Z0-9_]+\]/gi, '').trim();
  const actions: SpatialActionBadge[] = [];

  for (const tag of matchedTags) {
    if (tag.startsWith('HOTSPOT_')) {
      const idx = parseInt(tag.replace('HOTSPOT_', ''), 10) - 1;
      const targetHotspot = hotspots[idx] || hotspots[0];
      if (targetHotspot) {
        actions.push({
          tag,
          type: 'hotspot',
          label:
            lang === 'en'
              ? `Spotlight & Camera focused: ${targetHotspot.name}`
              : lang === 'zh'
              ? `已锁定聚光灯并聚焦：${targetHotspot.name}`
              : `Đèn rọi & Camera đã khóa điểm: ${targetHotspot.name}`,
        });
      }
    } else if (tag === 'MODE_XRAY') {
      actions.push({
        tag,
        type: 'mode',
        label:
          lang === 'en'
            ? 'X-Ray structural anatomy activated'
            : lang === 'zh'
            ? '已开启 X-Ray 结构透视'
            : 'Đã bật chế độ Giải phẫu X-Ray',
      });
    } else if (tag === 'MODE_WIREFRAME') {
      actions.push({
        tag,
        type: 'mode',
        label:
          lang === 'en'
            ? 'CAD Wireframe activated'
            : lang === 'zh'
            ? '已切换至 CAD 线框模式'
            : 'Đã bật Khung dây Trắc địa CAD',
      });
    } else if (tag === 'MODE_TEXTURED') {
      actions.push({
        tag,
        type: 'mode',
        label:
          lang === 'en'
            ? 'PBR Material view restored'
            : lang === 'zh'
            ? '已恢复 PBR 真实材质视图'
            : 'Đã khôi phục Bề mặt vật liệu PBR',
      });
    } else if (tag === 'START_TOUR' || tag === 'AUTO_TOUR') {
      actions.push({
        tag: 'START_TOUR',
        type: 'autotour',
        label:
          lang === 'en'
            ? 'Synchronized 3D Docent Tour launched'
            : lang === 'zh'
            ? '已启动 3D 同步导览'
            : 'Đã kích hoạt Tour 3D cùng Nhân chứng',
      });
    }
  }

  return { cleanText, actions };
}

function buildScholarlyFallbackResponse(
  query: string,
  site: HeritageSite,
  persona: CanonicalPersona,
  hotspots: GeminiHotspotTarget[],
  lang: Language,
  modelId: AiModelTierId = 'gemini-4-hydrogen'
): string {
  const q = query.toLowerCase();
  const data = getLivingDocentSiteData(site);
  const identity = getRoleplayIdentity(site, persona, lang);
  const actionTags: string[] = [];

  if (q.includes('x-ray') || q.includes('xray') || q.includes('xuyên thấu') || q.includes('kết cấu') || q.includes('inspect') || q.includes('透视')) {
    actionTags.push('[ACTION:MODE_XRAY]');
  } else if (q.includes('khung dây') || q.includes('wireframe') || q.includes('线框')) {
    actionTags.push('[ACTION:MODE_WIREFRAME]');
  } else if (q.includes('bề mặt') || q.includes('textured') || q.includes('pbr')) {
    actionTags.push('[ACTION:MODE_TEXTURED]');
  }

  if (q.includes('tour') || q.includes('dẫn tôi') || q.includes('tham quan')) {
    actionTags.push('[ACTION:START_TOUR]');
  }

  hotspots.forEach((h, idx) => {
    const hName = h.name.toLowerCase();
    if (
      (q.includes('hầm') && hName.includes('hầm')) ||
      (q.includes('b1') && hName.includes('b1')) ||
      (q.includes('trực thăng') && hName.includes('trực thăng')) ||
      (q.includes('uh-1') && hName.includes('uh-1')) ||
      (q.includes('hoàng cầm') && hName.includes('hoàng cầm')) ||
      (q.includes('quân y') && hName.includes('quân y')) ||
      (q.includes('bát giác') && hName.includes('bát giác')) ||
      (q.includes('hoa hồng') && hName.includes('hoa hồng')) ||
      (q.includes('caryatid') && hName.includes('caryatid')) ||
      (q.includes('mansard') && hName.includes('mansard')) ||
      (q.includes('đồng hồ') && hName.includes('đồng hồ')) ||
      (q.includes('rồng') && hName.includes('rồng'))
    ) {
      actionTags.push(`[ACTION:HOTSPOT_${idx + 1}]`);
    }
  });

  if (actionTags.length === 0 && hotspots.length > 0) {
    actionTags.push('[ACTION:HOTSPOT_1]');
  }

  const isArgon = modelId === 'gemini-4-argon';
  if (isArgon && !actionTags.includes('[ACTION:MODE_XRAY]')) {
    actionTags.push('[ACTION:MODE_XRAY]');
  }

  const materialsText = (site.materials || []).slice(0, 3).join(', ');
  const focusZoneName = hotspots[0]?.name || site.officialName;
  const argonDeepNote = isArgon
    ? lang === 'en'
      ? `\n\n**Gemini 4 Argon Curator Synthesis**:\n- **Comparative World Context**: ${data.polymathContext}\n- **Structural & Material Engineering**: Load-bearing behavior of ${materialsText || 'heritage masonry and timber'} (${site.dimensionsDescription}) under tropical humidity. Activate **3D Exploded Dissection** or **X-Ray** to inspect **${focusZoneName}**.\n\nNguồn tham khảo: ${data.polymathSources}`
      : lang === 'zh'
      ? `\n\n**Gemini 4 Argon 深度策展解析**：\n- **比较史学维度**：${data.polymathContext}\n- **结构与材料力学**：剖析 ${materialsText || '传统砖石与硬木'}（${site.dimensionsDescription}）在热带气候下的承重与通风机制。建议开启 **3D 分层拆解** 或 **X-Ray 透视**，重点观察 **${focusZoneName}**。\n\nNguồn tham khảo: ${data.polymathSources}`
      : `\n\n**Tổng hợp chuyên sâu Gemini 4 Argon**:\n- **Đối sánh Thông sử**: ${data.polymathContext}\n- **Cơ học Kết cấu & Vật liệu**: Phân tích khả năng chịu lực, thông gió nhiệt đới của hệ **${materialsText || 'vật liệu bản địa tuyển chọn'}** (${site.dimensionsDescription}). Khuyến nghị bật **Bóc tách 3D** hoặc **X-Ray** để kiểm tra chi tiết **${focusZoneName}**.\n\nNguồn tham khảo: ${data.polymathSources}`
    : '';

  if (persona === 'Architect') {
    if (lang === 'en') {
      return `Speaking as **${identity.name}** (${identity.title}):\n\n${identity.intro}\n\nIn crafting **${site.officialName}** (${site.chronology}), we balanced **${site.architecturalStyle}** geometry with local climate endurance using **${materialsText || 'traditional masonry & timber'}** (${site.dimensionsDescription}). Look closely at the spotlighted zone to trace how structure shapes daylight and acoustics.${argonDeepNote}\n${actionTags.join(' ')}`;
    }
    if (lang === 'zh') {
      return `我是 **${identity.name}**（${identity.title}）：\n\n${identity.intro}\n\n在营建 **${site.officialName}**（${site.chronology}）时，我们精选 **${materialsText || '本地传统砖石与硬木'}**，将 **${site.architecturalStyle}** 的结构力学与南方热带通风采光完美结合（${site.dimensionsDescription}）。请随聚光灯观察关键节点。${argonDeepNote}\n${actionTags.join(' ')}`;
    }
    return `Tôi là **${identity.name}** (*${identity.title}*):\n\n${identity.intro}\n\nKhi kiến tạo **${site.officialName}** (${site.chronology}), chúng tôi sử dụng **${materialsText || 'vật liệu truyền thống tuyển chọn'}** theo phong cách **${site.architecturalStyle}** (${site.dimensionsDescription}) để vừa đạt chuẩn thẩm mỹ kết cấu, vừa điều hòa nắng gió nhiệt đới.${argonDeepNote}\n${actionTags.join(' ')}`;
  }

  if (persona === 'Eyewitness') {
    if (lang === 'en') {
      return `From my lived memory as **${identity.name}** (*${identity.title}*):\n\n${identity.intro}\n\nStanding right here at **${site.officialName}**, every stone, beam, and corridor holds the pulse of ${(site.milestones || []).slice(0, 2).map((m) => `${m.year} (${m.event})`).join(' and ')}. Notice the illuminated sector — that was where history felt closest to our hearts.${argonDeepNote}\n${actionTags.join(' ')}`;
    }
    if (lang === 'zh') {
      return `以 **${identity.name}**（${identity.title}）的亲历视角诉说：\n\n${identity.intro}\n\n站在这座 **${site.officialName}** 之中，每一寸砖石与梁柱都铭刻着 ${(site.milestones || []).slice(0, 2).map((m) => `${m.year}年`).join('与')} 的时代风云。聚光灯所照之处，正是当年最令人难忘的历史瞬间。${argonDeepNote}\n${actionTags.join(' ')}`;
    }
    return `Ký ức của tôi — **${identity.name}** (*${identity.title}*):\n\n${identity.intro}\n\nĐứng ngay giữa không gian **${site.officialName}**, từng cột gỗ hay mảng tường nơi vùng ánh sáng rọi tới đều lưu dấu hơi thở của những năm tháng lịch sử: ${(site.milestones || []).slice(0, 2).map((m) => `${m.year}: ${m.event}`).join('; ')}.${argonDeepNote}\n${actionTags.join(' ')}`;
  }

  // Polymath MUST always end with explicit Nguồn tham khảo: citation
  if (lang === 'en') {
    return `From a **Comparative World History & Archival Perspective**:\n\n**${site.officialName}** (${site.chronology}) in ${site.address.district} exemplifies how Southeast Vietnam intersected with global currents of its era: ${data.polymathContext}\n\nKey milestones: ${(site.milestones || []).map((m) => `${m.year}: ${m.event}`).join('; ')}.${isArgon ? `\n\n**Gemini 4 Argon Structural & X-Ray Cue**: Inspect **${focusZoneName}** using 3D Dissection & X-Ray to correlate **${materialsText || site.architecturalStyle}** with regional preservation records.` : ''}\n\nNguồn tham khảo: ${data.polymathSources}\n${actionTags.join(' ')}`;
  }
  if (lang === 'zh') {
    return `从 **博学比较史学与文献考据视角**：\n\n位于 ${site.address.district} 的 **${site.officialName}**（${site.chronology}）折射出东南部遗产与同期世界史的交汇：${data.polymathContext}\n\n核心年表：${(site.milestones || []).map((m) => `${m.year}年：${m.event}`).join('；')}。${isArgon ? `\n\n**Gemini 4 Argon 结构与 X-Ray 提示**：开启 3D 分层拆解与 X-Ray 透视，对照考据 **${focusZoneName}** 的 **${materialsText || site.architecturalStyle}** 工艺细节。` : ''}\n\nNguồn tham khảo: ${data.polymathSources}\n${actionTags.join(' ')}`;
  }
  return `Dưới góc nhìn **Nhà Thông Sử & Đối sánh Liên vùng**:\n\n**${site.officialName}** (${site.chronology}) tại **${site.address.district}** là mắt xích tiêu biểu nối lịch sử Đông Nam Bộ với dòng chảy thế giới đương đại: ${data.polymathContext}\n\nCác mốc sử liệu cốt lõi: ${(site.milestones || []).map((m) => `${m.year} — ${m.event}`).join('; ')}.${isArgon ? `\n\n**Chỉ dẫn Giám tuyển Gemini 4 Argon**: Kích hoạt **Bóc tách 3D / X-Ray** tại **${focusZoneName}** để đối chiếu trực tiếp kỹ thuật **${materialsText || site.architecturalStyle}** với hồ sơ lưu trữ.` : ''}\n\nNguồn tham khảo: ${data.polymathSources}\n${actionTags.join(' ')}`;
}

interface TourStationStep {
  stationIdx: number;
  hotspot: GeminiHotspotTarget;
  mode: 'textured' | 'xray';
  exploded: number;
  modeLabel: string;
  subtitle: string;
}

function normalizeLabsCommandText(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

const LABS_SITE_ALIASES: Array<{ siteId: string; keywords: string[] }> = [
  { siteId: 'HCM-DT-001', keywords: ['dinh doc lap', 'dinh thong nhat', 'norodom'] },
  { siteId: 'HCM-DT-002', keywords: ['nha hat thanh pho', 'nha hat lon'] },
  { siteId: 'HCM-DT-003', keywords: ['buu dien trung tam', 'buu dien sai gon', 'buu dien'] },
  { siteId: 'HCM-DT-004', keywords: ['cho ben thanh', 'ben thanh'] },
  { siteId: 'HCM-DT-005', keywords: ['nha tho duc ba', 'duc ba sai gon', 'nha tho chinh toa'] },
  { siteId: 'HCM-DT-006', keywords: ['bao tang lich su', 'blanchard de la brosse'] },
  { siteId: 'HCM-DT-007', keywords: ['ben nha rong', 'bao tang ho chi minh'] },
  { siteId: 'HCM-DT-008', keywords: ['lang le van duyet', 'lang ong ba chieu', 'ba chieu'] },
  { siteId: 'HCM-DT-009', keywords: ['dia dao cu chi', 'cu chi'] },
  { siteId: 'HCM-DT-010', keywords: ['rung sac', 'can gio'] },
  { siteId: 'BD-DT-001', keywords: ['chua hoi khanh', 'hoi khanh'] },
  { siteId: 'BD-DT-002', keywords: ['tam giac sat', 'ben cat'] },
  { siteId: 'BD-DT-003', keywords: ['nha tu phu loi', 'phu loi'] },
  { siteId: 'BRVT-DT-001', keywords: ['bach dinh', 'villa blanche'] },
  { siteId: 'BRVT-DT-002', keywords: ['nha lon long son', 'den ong tran', 'long son'] },
  { siteId: 'BRVT-DT-003', keywords: ['dia dao long phuoc', 'long phuoc'] },
  { siteId: 'BRVT-DT-004', keywords: ['con dao', 'nha tu con dao'] },
];

function findSiteForLabsCommand(
  normQuery: string,
  allSites: HeritageSite[]
): HeritageSite | undefined {
  const hasNavVerb =
    normQuery.includes('chuyen sang') ||
    normQuery.includes('chuyen den') ||
    normQuery.includes('xem ') ||
    normQuery.includes('mo ') ||
    normQuery.includes('di toi') ||
    normQuery.includes('sang ');
  if (!hasNavVerb) return undefined;

  for (const entry of LABS_SITE_ALIASES) {
    if (entry.keywords.some((kw) => normQuery.includes(kw))) {
      const found = allSites.find((s) => s.id === entry.siteId);
      if (found) return found;
    }
  }

  return allSites.find((site) => {
    const normName = normalizeLabsCommandText(site.officialName);
    return normName.length > 4 && normQuery.includes(normName);
  });
}

const LABS_QUICK_PROMPTS_BY_LANG: Record<Language, readonly string[]> = {
  vi: [
    'Bóc tách kết cấu công trình này',
    'Kể chuyện dưới góc nhìn kiến trúc sư',
    'Đặt 1 câu hỏi đố vui lịch sử',
  ],
  en: [
    'Dissect the 3D structure of this monument',
    'Narrate from the architect’s perspective',
    'Ask me a historical trivia question',
  ],
  zh: [
    '拆解该建筑的 3D 结构',
    '以建筑师视角讲述建造故事',
    '出一道关于此遗迹的历史问答',
  ],
};

export const GeminiHeritageChat: React.FC<GeminiHeritageChatProps> = ({
  isOpen,
  onClose,
  currentSite,
  sites,
  hotspots,
  onFlyToHotspot,
  onSetRenderMode,
  onTriggerAutoTour,
  onSwitchSite,
  onSetLightingMode,
  onSetExplodedFactor,
  onSetSpatialSpotlight,
  onClearSpatialSpotlight,
  isMysteryModeActive = false,
  onToggleMysteryMode,
  mysteryRayClickEvent,
  onNavigateToTickets,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const { customPhotosMap, wikimediaCacheMap } = useHeritageRealPhotos();
  const availableSites = useMemo(() => {
    const baseList = sites && sites.length > 0 ? sites : HERITAGE_SITES;
    if (baseList.some((s) => s.id === currentSite.id)) {
      return baseList;
    }
    return [currentSite, ...baseList];
  }, [sites, currentSite]);
  const [internalSiteId, setInternalSiteId] = useState<string>(currentSite.id);

  // Always synchronize internal active monument with the app's currentSite (3D, GIS Map, Detail modal)
  useEffect(() => {
    setInternalSiteId(currentSite.id);
  }, [currentSite.id, isOpen]);

  const effectiveSite = useMemo(
    () => availableSites.find((s) => s.id === internalSiteId) || currentSite,
    [availableSites, internalSiteId, currentSite]
  );

  const localizedCurrentSite = useMemo(
    () => getLocalizedSite(effectiveSite),
    [getLocalizedSite, effectiveSite]
  );
  const { user, userTier, isAdmin, isTesterPro, entitlements, refreshEntitlements } = useAuth();
  const { permissions: sitePerms } = useSubscriptionPermissions(effectiveSite.id);
  const {
    hasLabsAccess,
    effectiveAiLabsEnabled,
    setGoldenHour3D,
    setWireframeOverlay,
  } = useLabs();
  const passportScope = user?.email || user?.userId;
  const quotaScopeKey = (user?.email || '').toLowerCase().trim() || user?.userId || 'guest';
  const { getCustomAudioForSite } = useAudioGuide();
  const passportStamps = useHeritagePassportStamps(passportScope);

  const canUseLabsChat = hasLabsAccess && effectiveAiLabsEnabled && sitePerms.effectiveRole === 'admin';
  const [chatMode, setChatMode] = useState<'standard' | 'labs'>('standard');
  const isLabsChatMode = canUseLabsChat && chatMode === 'labs';

  const effectiveRole = sitePerms.effectiveRole;
  const resolvedUserTier: 'free' | 'plus' | 'pro' =
    effectiveRole === 'admin' ||
    effectiveRole === 'tester' ||
    effectiveRole === 'pro' ||
    effectiveRole === 'school'
      ? 'pro'
      : effectiveRole === 'plus' && sitePerms.canUseAdvancedAi
      ? 'plus'
      : 'free';

  const unlockedModels = useMemo<AiModelTierId[]>(() => {
    if (sitePerms.canUseGemini4Argon) {
      return ['gemini-4-argon', 'gemini-4-hydrogen', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    }
    if (sitePerms.canUseGemini4Hydrogen) {
      // Tester, Pro (49.000đ) & School EdTech (5.000.000đ): unlock Gemini 3.5 Flash & Gemini 4 Hydrogen (Argon strictly blocked)
      return ['gemini-4-hydrogen', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    }
    if (sitePerms.canUseGemini35Flash) {
      // Plus (19.000đ) within purchased site/route: unlock ONLY Gemini 3.5 Flash
      return ['gemini-3.5-flash', 'gemini-2.5-flash'];
    }
    // Basic (0đ) or Plus outside purchased scope: ONLY Gemini 2.5 Flash
    return ['gemini-2.5-flash'];
  }, [
    sitePerms.canUseGemini4Argon,
    sitePerms.canUseGemini35Flash,
    sitePerms.canUseGemini4Hydrogen,
  ]);

  const defaultModelForAccount: AiModelTierId = useMemo(() => {
    if (sitePerms.canUseGemini4Argon) return 'gemini-4-argon';
    if (sitePerms.canUseGemini4Hydrogen) return 'gemini-4-hydrogen';
    if (sitePerms.canUseGemini35Flash) return 'gemini-3.5-flash';
    return 'gemini-2.5-flash';
  }, [
    sitePerms.canUseGemini4Argon,
    sitePerms.canUseGemini35Flash,
    sitePerms.canUseGemini4Hydrogen,
  ]);

  const [selectedModel, setSelectedModel] = useState<AiModelTierId>(() => {
    const saved = readPersistedAiModel();
    if (saved && (saved !== 'gemini-4-argon' || sitePerms.canUseGemini4Argon)) {
      if (unlockedModels.includes(saved)) return saved;
    }
    return defaultModelForAccount;
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState<boolean>(false);
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState<boolean>(false);
  const [lockedModelNotice, setLockedModelNotice] = useState<{
    modelId: AiModelTierId;
    adminOnly: boolean;
  } | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);

  // Automatic safe downgrade: if non-Admin (Tester or Visitor) has gemini-4-argon cached in localStorage or state,
  // immediately sanitize localStorage and switch to Gemini 4 Hydrogen (Pro/School/Tester) or Gemini 2.5 Flash (Basic).
  useEffect(() => {
    const saved = readPersistedAiModel();
    if (saved === 'gemini-4-argon' && !sitePerms.canUseGemini4Argon) {
      writePersistedAiModel(defaultModelForAccount);
    }
    setSelectedModel((prev) => {
      if (prev === 'gemini-4-argon' && !sitePerms.canUseGemini4Argon) {
        return defaultModelForAccount;
      }
      if (!unlockedModels.includes(prev)) {
        return defaultModelForAccount;
      }
      return defaultModelForAccount;
    });
    setLockedModelNotice(null);
    setIsModelDropdownOpen(false);
  }, [
    user?.userId,
    user?.email,
    effectiveRole,
    resolvedUserTier,
    sitePerms.canUseGemini4Argon,
    defaultModelForAccount,
    unlockedModels,
  ]);

  useEffect(() => {
    if (!isModelDropdownOpen && !isSiteDropdownOpen && !isPersonaDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setIsModelDropdownOpen(false);
        setIsSiteDropdownOpen(false);
        setIsPersonaDropdownOpen(false);
        setLockedModelNotice(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModelDropdownOpen(false);
        setIsSiteDropdownOpen(false);
        setIsPersonaDropdownOpen(false);
        setLockedModelNotice(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModelDropdownOpen, isSiteDropdownOpen, isPersonaDropdownOpen]);

  const activeModel: AiModelTierId =
    selectedModel === 'gemini-4-argon' && !sitePerms.canUseGemini4Argon
      ? defaultModelForAccount
      : unlockedModels.includes(selectedModel)
      ? selectedModel
      : defaultModelForAccount;

  const [persona, setPersona] = useState<CanonicalPersona>('Architect');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [recentPrompts, setRecentPrompts] = useState<RecentPromptEntry[]>(() =>
    readRecentPromptsFromStorage(quotaScopeKey)
  );
  const [isPromptHistoryOpen, setIsPromptHistoryOpen] = useState<boolean>(false);

  useEffect(() => {
    setRecentPrompts(readRecentPromptsFromStorage(quotaScopeKey));
  }, [quotaScopeKey]);

  useEffect(() => {
    if (!canUseLabsChat && chatMode === 'labs') {
      setChatMode('standard');
    }
  }, [canUseLabsChat, chatMode]);

  const sitesStripDrag = useHorizontalDragWheelScroll<HTMLDivElement>(isOpen && isExpanded);
  const rolesStripDrag = useHorizontalDragWheelScroll<HTMLDivElement>(isOpen && isExpanded);
  const activeSitePillRef = useRef<HTMLButtonElement | null>(null);
  const prevEffectiveSiteIdRef = useRef<string>(effectiveSite.id);
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});

  // Automatically switch back to the monument's signature AI curator character when selecting another monument
  useEffect(() => {
    if (prevEffectiveSiteIdRef.current !== effectiveSite.id) {
      prevEffectiveSiteIdRef.current = effectiveSite.id;
      setChatMode((prevMode) => (prevMode === 'labs' ? 'standard' : prevMode));
      setPersona((prevPersona) => (prevPersona === 'Polymath' ? 'Architect' : prevPersona));
    }
  }, [effectiveSite.id]);

  // Smoothly keep the selected monument centered inside the horizontal strip without shifting viewport scroll
  useEffect(() => {
    if (!isOpen) return;
    const container = sitesStripDrag.ref.current;
    const btn = activeSitePillRef.current;
    if (container && btn) {
      const targetLeft =
        btn.offsetLeft - container.clientWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    }
  }, [isOpen, effectiveSite.id, sitesStripDrag.ref]);

  // 60-Second Synchronized Spatial Docent Auto-Tour State
  const [tourStatus, setTourStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [tourUsingCustomAudio, setTourUsingCustomAudio] = useState<boolean>(false);
  const tourAudioRef = useRef<HTMLAudioElement | null>(null);
  const tourTimerRef = useRef<number | null>(null);
  const tourRunTokenRef = useRef<number>(0);

  // Raycaster Mystery Challenge State
  const [mysteryShowHint, setMysteryShowHint] = useState<boolean>(false);
  const [mysteryAttempts, setMysteryAttempts] = useState<number>(0);
  const [mysteryFeedback, setMysteryFeedback] = useState<{
    matched: boolean;
    message: string;
  } | null>(null);
  const lastProcessedClickTimestampRef = useRef<number>(0);

  // Speech Recognition (Voice Query) State
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [micUnsupportedNotice, setMicUnsupportedNotice] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const docentData = useMemo(() => getLivingDocentSiteData(effectiveSite), [effectiveSite]);
  const roleplayIdentity = useMemo(
    () => getRoleplayIdentity(effectiveSite, persona, lang),
    [effectiveSite, persona, lang]
  );
  const cleanEffectiveSiteTitle = useMemo(
    () => localizedCurrentSite.officialName.split(/\s*[（(]/)[0],
    [localizedCurrentSite.officialName]
  );
  const suggestedQuestions = useMemo(
    () => getSuggestedQuestionsForSite(effectiveSite.id, cleanEffectiveSiteTitle, lang),
    [effectiveSite.id, cleanEffectiveSiteTitle, lang]
  );
  const currentStamp = passportStamps[effectiveSite.id];
  const unlockedCount = Object.keys(passportStamps).length;

  // Build 4 synchronized stations (approx 60s total: 15s/station) adapting to active Persona & Language
  const tourStations = useMemo<TourStationStep[]>(() => {
    const safeHotspots = hotspots.slice(0, 4);
    if (safeHotspots.length === 0) return [];
    const isUnderground =
      effectiveSite.id === 'HCM-DT-009' ||
      effectiveSite.id === 'BRVT-DT-003' ||
      effectiveSite.id === 'BD-DT-002' ||
      effectiveSite.id === 'HCM-DT-010';

    return safeHotspots.map((hp, idx) => {
      const mode: 'textured' | 'xray' = idx === 2 || (idx === 1 && isUnderground) ? 'xray' : 'textured';
      const exploded = idx === 1 && !isUnderground ? 0.55 : idx === 2 ? 0.25 : 0;
      const modeLabel =
        mode === 'xray'
          ? 'X-Ray'
          : exploded > 0.2
          ? lang === 'en'
            ? 'Exploded 3D'
            : lang === 'zh'
            ? '分层剖解'
            : 'Bóc tách 3D'
          : lang === 'en'
          ? 'PBR Studio'
          : lang === 'zh'
          ? '实体材质'
          : 'Nguyên bản PBR';

      let subtitle = '';
      if (lang === 'en') {
        subtitle =
          persona === 'Architect'
            ? `Station ${idx + 1} — ${hp.name}: Observe how I designed this zone. ${hp.description}`
            : persona === 'Eyewitness'
            ? `Station ${idx + 1} — ${hp.name}: I remember standing right here during ${effectiveSite.chronology}. ${hp.description}`
            : `Station ${idx + 1} — ${hp.name}: Historically anchored in ${effectiveSite.address.district}, ${hp.description}`;
      } else if (lang === 'zh') {
        subtitle =
          persona === 'Architect'
            ? `第 ${idx + 1} 站 · ${hp.name}：请跟随我的设计视角观察此核心构造。${hp.description}`
            : persona === 'Eyewitness'
            ? `第 ${idx + 1} 站 · ${hp.name}：当年我就站在这里见证了时代风云。${hp.description}`
            : `第 ${idx + 1} 站 · ${hp.name}：从历史比较视野来看，${hp.description}`;
      } else {
        subtitle =
          persona === 'Architect'
            ? `Trạm ${idx + 1} — ${hp.name}: Là tác giả công trình, tôi thiết kế khu vực này với điểm nhấn: ${hp.description}`
            : persona === 'Eyewitness'
            ? `Trạm ${idx + 1} — ${hp.name}: Ngay tại vị trí ánh sáng đang rọi vào, ký ức lịch sử vẫn còn nguyên: ${hp.description}`
            : `Trạm ${idx + 1} — ${hp.name}: Dưới góc độ thông sử ${effectiveSite.chronology}, đây là điểm kết nối quan trọng: ${hp.description}`;
      }

      return {
        stationIdx: idx,
        hotspot: hp,
        mode,
        exploded,
        modeLabel,
        subtitle,
      };
    });
  }, [hotspots, effectiveSite, persona, lang]);

  const stopAllTourAudioAndTimers = useCallback(() => {
    tourRunTokenRef.current += 1;
    speechEngine.stop();
    if (tourTimerRef.current !== null) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    if (tourAudioRef.current) {
      tourAudioRef.current.pause();
      tourAudioRef.current.currentTime = 0;
      tourAudioRef.current.onended = null;
    }
  }, []);

  const stopTourAndRestore = useCallback(
    (clearSpotlight = true) => {
      stopAllTourAudioAndTimers();
      setTourStatus('idle');
      setTourStepIndex(0);
      setTourUsingCustomAudio(false);
      if (clearSpotlight) {
        onSetExplodedFactor?.(0);
        onSetRenderMode('textured');
        onClearSpatialSpotlight?.();
      }
    },
    [stopAllTourAudioAndTimers, onSetExplodedFactor, onSetRenderMode, onClearSpatialSpotlight]
  );

  // Stop speech/tour/mic safely when site switches or drawer closes
  useEffect(() => {
    stopAllTourAudioAndTimers();
    setTourStatus('idle');
    setTourStepIndex(0);
    setMysteryAttempts(0);
    setMysteryFeedback(null);
    setMysteryShowHint(false);
    setSpeakingMsgId(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningMic(false);
    }
  }, [effectiveSite.id, stopAllTourAudioAndTimers]);

  useEffect(() => {
    if (!isOpen) {
      stopAllTourAudioAndTimers();
      setTourStatus('idle');
      setSpeakingMsgId(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setIsListeningMic(false);
      }
    }
  }, [isOpen, stopAllTourAudioAndTimers]);

  useEffect(() => {
    return () => {
      stopAllTourAudioAndTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [stopAllTourAudioAndTimers]);

  const [resendingNoticeOrderId, setResendingNoticeOrderId] = useState<string | null>(null);
  const [resendNoticeFeedback, setResendNoticeFeedback] = useState<
    Record<string, { type: 'ok' | 'err'; text: string }>
  >({});

  const buildPurchaseNoticeMessage = useCallback(
    (notice: SuQuanPurchaseNotice): ChatMessageItem => ({
      id: `purchase-notice-${notice.orderId}`,
      role: 'model',
      content: formatSuQuanThankYouMessage(notice),
      persona,
      spatialActions: [],
      timestamp: new Date(notice.createdAt).toLocaleTimeString(
        lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN',
        { hour: '2-digit', minute: '2-digit' }
      ),
      modelUsed: activeModel,
      purchaseNotice: notice,
    }),
    [persona, lang, activeModel]
  );

  const handleResendPurchaseNoticeEmail = useCallback(
    async (notice: SuQuanPurchaseNotice) => {
      if (resendingNoticeOrderId) return;
      setResendingNoticeOrderId(notice.orderId);
      setResendNoticeFeedback((prev) => {
        const next = { ...prev };
        delete next[notice.orderId];
        return next;
      });

      const result = await sendOrderThankYouEmail(
        {
          toEmail: notice.toEmail,
          customerName: notice.customerName || user?.displayName || 'Quý khách',
          planName: notice.planName,
          scope: notice.scope,
          orderCode: notice.orderCode,
          amount: notice.amount,
        },
        { requireEnabled: false }
      );

      setResendingNoticeOrderId(null);

      if (result.ok) {
        updatePaymentOrderEmailStatus(notice.orderId, true);
        setResendNoticeFeedback((prev) => ({
          ...prev,
          [notice.orderId]: {
            type: 'ok',
            text: `Đã gửi lại thư tri ân tới ${notice.toEmail}.`,
          },
        }));
      } else {
        setResendNoticeFeedback((prev) => ({
          ...prev,
          [notice.orderId]: {
            type: 'err',
            text: result.error || 'Không thể gửi lại thư cảm ơn. Vui lòng thử lại sau.',
          },
        }));
      }
    },
    [resendingNoticeOrderId, user?.displayName]
  );

  useEffect(() => {
    if (isOpen) {
      markSuQuanPurchaseNoticesRead();
    }
  }, [isOpen]);

  useEffect(() => {
    const onNewPurchaseNotice = () => {
      const notices = loadSuQuanPurchaseNotices(user?.email, user?.userId);
      if (notices.length === 0) return;
      const latest = notices[0];
      if (isOpen) {
        markSuQuanPurchaseNoticesRead();
      }
      setMessages((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.purchaseNotice?.orderId === latest.orderId
        );
        const nextMsg = buildPurchaseNoticeMessage(latest);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = nextMsg;
          return copy;
        }
        return [...prev, nextMsg];
      });
    };
    window.addEventListener(SU_QUAN_PURCHASE_NOTICE_EVENT, onNewPurchaseNotice);
    return () => {
      window.removeEventListener(SU_QUAN_PURCHASE_NOTICE_EVENT, onNewPurchaseNotice);
    };
  }, [user?.email, user?.userId, isOpen, buildPurchaseNoticeMessage]);

  // Welcome message per site + persona + lang
  useEffect(() => {
    const polymathSourceLine = `\n\nNguồn tham khảo: ${docentData.polymathSources}`;
    const greeting =
      lang === 'en'
        ? persona === 'Polymath'
          ? `Greetings! I am the **Royal Historiographer**, accompanying you today as **${roleplayIdentity.name}** (*${roleplayIdentity.title}*) at **${localizedCurrentSite.officialName}** (*${localizedCurrentSite.address.district}*).\n\n${roleplayIdentity.intro}${polymathSourceLine}`
          : `Welcome! I am the **Royal Historiographer**, speaking with you today as **${roleplayIdentity.name}** (*${roleplayIdentity.title}*) at **${localizedCurrentSite.officialName}**.\n\n${roleplayIdentity.intro}\n\nLaunch the **3D Tour** or test your eye with the **3D Mystery** above.`
        : lang === 'zh'
        ? persona === 'Polymath'
          ? `您好！我是 **史官讲解**，今日将以 **${roleplayIdentity.name}**（*${roleplayIdentity.title}*）之身份，陪同您共同考察 **${localizedCurrentSite.officialName}**（*${localizedCurrentSite.address.district}*）。\n\n${roleplayIdentity.intro}${polymathSourceLine}`
          : `您好！我是 **史官讲解**，今日化身 **${roleplayIdentity.name}**（*${roleplayIdentity.title}*）为您讲述 **${localizedCurrentSite.officialName}** 的历史故事。\n\n${roleplayIdentity.intro}\n\n欢迎点击上方启动 **3D 导览** 或挑战 **3D 解谜**。`
        : persona === 'Polymath'
        ? `Kính chào quý khách! Tôi là **Sử Quan Dấu Ấn**, hôm nay đồng hành cùng quý vị trong vai **${roleplayIdentity.name}** (*${roleplayIdentity.title}*) tại **${localizedCurrentSite.officialName}**.\n\n${roleplayIdentity.intro}${polymathSourceLine}`
        : `Kính chào quý khách! Tôi là **Sử Quan Dấu Ấn**, hiện thân trong vai **${roleplayIdentity.name}** (*${roleplayIdentity.title}*) tại **${localizedCurrentSite.officialName}**.\n\n${roleplayIdentity.intro}\n\nQuý khách có thể bấm **Tour 3D** hoặc thử sức với **Giải mã 3D** bằng cách chạm trực tiếp lên mô hình 3D.`;

    const recentNotices = loadSuQuanPurchaseNotices(user?.email, user?.userId)
      .slice(0, 2)
      .reverse()
      .map((notice) => buildPurchaseNoticeMessage(notice));

    setMessages([
      {
        id: `welcome-${effectiveSite.id}-${persona}-${lang}`,
        role: 'model',
        content: greeting,
        persona,
        spatialActions: [],
        timestamp: new Date().toLocaleTimeString(
          lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN',
          { hour: '2-digit', minute: '2-digit' }
        ),
        modelUsed: activeModel,
      },
      ...recentNotices,
    ]);
  }, [
    effectiveSite.id,
    effectiveSite.officialName,
    effectiveSite.address.district,
    persona,
    roleplayIdentity,
    docentData.polymathSources,
    lang,
    activeModel,
    localizedCurrentSite.address.district,
    localizedCurrentSite.officialName,
    user?.email,
    user?.userId,
    buildPurchaseNoticeMessage,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Run one station of the 60s Synchronized Spatial Tour
  const runTourStation = useCallback(
    (stepIdx: number) => {
      if (tourStations.length === 0) {
        onTriggerAutoTour(effectiveSite);
        return;
      }

      if (stepIdx >= tourStations.length) {
        stopTourAndRestore(true);
        return;
      }

      stopAllTourAudioAndTimers();
      const myToken = tourRunTokenRef.current;
      const step = tourStations[stepIdx];

      setTourStatus('playing');
      setTourStepIndex(stepIdx);

      // 1. Fly Camera + Lock Spatial Gold Spotlight & Laser Ring
      onFlyToHotspot(step.hotspot);
      onSetSpatialSpotlight?.(step.hotspot.targetPos, step.hotspot.name);

      // 2. Apply Anatomical Mode (Exploded / X-Ray / PBR)
      onSetRenderMode(step.mode);
      onSetExplodedFactor?.(step.exploded);

      // 3. Prioritize User Recorded Audio if uploaded for this site, else SpeechEngine (VI/EN/ZH)
      const customTrack = getCustomAudioForSite(effectiveSite.id);
      if (customTrack && customTrack.url) {
        setTourUsingCustomAudio(true);
        if (!tourAudioRef.current) {
          tourAudioRef.current = new Audio();
        }
        const audioEl = tourAudioRef.current;
        if (audioEl.src !== customTrack.url) {
          audioEl.src = customTrack.url;
        }
        const approxSegmentSec = Math.max(
          10,
          Math.min(18, Math.floor((customTrack.durationSec || 60) / tourStations.length))
        );
        const startOffset = Math.min(
          Math.max(0, (customTrack.durationSec || 60) - 8),
          stepIdx * approxSegmentSec
        );
        if (Number.isFinite(startOffset) && stepIdx === 0) {
          audioEl.currentTime = 0;
        } else if (Number.isFinite(startOffset) && Math.abs(audioEl.currentTime - startOffset) > 4) {
          audioEl.currentTime = startOffset;
        }

        audioEl.play().catch(() => {
          // If autoplay restricted, continue station pacing cleanly with live subtitles
        });

        tourTimerRef.current = window.setTimeout(() => {
          if (tourRunTokenRef.current !== myToken) return;
          runTourStation(stepIdx + 1);
        }, 15000);
      } else {
        setTourUsingCustomAudio(false);
        let advanced = false;
        const advanceOnce = () => {
          if (advanced || tourRunTokenRef.current !== myToken) return;
          advanced = true;
          if (tourTimerRef.current !== null) {
            window.clearTimeout(tourTimerRef.current);
            tourTimerRef.current = null;
          }
          tourTimerRef.current = window.setTimeout(() => {
            if (tourRunTokenRef.current !== myToken) return;
            runTourStation(stepIdx + 1);
          }, 900);
        };

        // Safety fallback timer (16s max per station so 4 stations ≈ 60s even if TTS silent)
        tourTimerRef.current = window.setTimeout(advanceOnce, 15500);

        speechEngine.speakText(step.subtitle, {
          lang,
          rate: 1.0,
          onComplete: advanceOnce,
        });
      }
    },
    [
      tourStations,
      onTriggerAutoTour,
      stopTourAndRestore,
      stopAllTourAudioAndTimers,
      onFlyToHotspot,
      onSetSpatialSpotlight,
      onSetRenderMode,
      onSetExplodedFactor,
      getCustomAudioForSite,
      effectiveSite,
      lang,
    ]
  );

  const handleStartOrToggleTour = () => {
    if (tourStatus === 'playing') {
      stopAllTourAudioAndTimers();
      setTourStatus('paused');
      return;
    }
    if (tourStatus === 'paused') {
      runTourStation(tourStepIndex);
      return;
    }
    // Exit Mystery mode cleanly before starting automated tour
    if (isMysteryModeActive && onToggleMysteryMode) {
      onToggleMysteryMode(false);
    }
    runTourStation(0);
  };

  // Evaluate Raycaster Clicks during "Thử thách Giải mã Kiến trúc"
  useEffect(() => {
    if (!isMysteryModeActive || !mysteryRayClickEvent) return;
    if (mysteryRayClickEvent.timestamp === lastProcessedClickTimestampRef.current) return;
    lastProcessedClickTimestampRef.current = mysteryRayClickEvent.timestamp;

    const mystery = docentData.mystery;
    const result = evaluateMysteryRayClick(
      mysteryRayClickEvent.hitPoint,
      mystery.targetCenter,
      mystery.acceptRadius,
      lang
    );

    const nextAttempts = mysteryAttempts + 1;
    setMysteryAttempts(nextAttempts);
    setMysteryFeedback({
      matched: result.matched,
      message: result.feedback,
    });

    if (result.matched) {
      // 1. Focus Spotlight + Camera + Exploded/X-Ray Reveal
      const targetHotspot = hotspots[mystery.targetHotspotIndex] || hotspots[0];
      if (targetHotspot) {
        onFlyToHotspot(targetHotspot);
      }
      onSetSpatialSpotlight?.(mystery.targetCenter, mystery.secretTitle[lang]);
      if (mystery.revealMode === 'xray') {
        onSetRenderMode('xray');
      } else {
        onSetRenderMode('textured');
        onSetExplodedFactor?.(0.48);
      }

      // 2. Stamp Digital Heritage Passport (only if tier permits Journey Stamping)
      if (sitePerms.canUseJourneyStampAndCert) {
        unlockPassportStamp(
          {
            siteId: effectiveSite.id,
            siteName: effectiveSite.officialName,
            secretTitle: mystery.secretTitle[lang],
            stampCode: mystery.stampCode,
            attempts: nextAttempts,
          },
          passportScope
        );
      } else {
        openUpgradePrompt({
          featureKey: 'journey_stamp',
          siteId: effectiveSite.id,
          siteName: localizedCurrentSite.officialName,
          requiredPlan: sitePerms.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
          isPlusScopeMismatch: sitePerms.isPlusScopeLockedForSite,
        });
      }

      // 3. Exit active click trap cleanly while keeping spotlight + unlock reveal visible
      onToggleMysteryMode?.(false);

      // 4. Narrate unlocked lore cleanly if user audio isn't busy
      speechEngine.speakText(`${mystery.secretTitle[lang]}. ${mystery.secretStory[lang]}`, {
        lang,
        rate: 1.0,
      });
    }
  }, [
    isMysteryModeActive,
    mysteryRayClickEvent,
    docentData.mystery,
    lang,
    mysteryAttempts,
    hotspots,
    onFlyToHotspot,
    onSetSpatialSpotlight,
    onSetRenderMode,
    onSetExplodedFactor,
    effectiveSite.id,
    effectiveSite.officialName,
    onToggleMysteryMode,
    passportScope,
  ]);

  const executeSpatialActions = useCallback(
    (actions: SpatialActionBadge[]) => {
      for (const act of actions) {
        if (act.tag === 'MODE_XRAY') {
          onSetRenderMode('xray');
        } else if (act.tag === 'MODE_WIREFRAME') {
          onSetRenderMode('wireframe');
        } else if (act.tag === 'MODE_TEXTURED') {
          onSetRenderMode('textured');
        } else if (act.tag === 'START_TOUR' || act.tag === 'AUTO_TOUR') {
          runTourStation(0);
        } else if (act.tag.startsWith('HOTSPOT_')) {
          const idx = parseInt(tagToIndex(act.tag), 10) - 1;
          const target = hotspots[idx] || hotspots[0];
          if (target) {
            onFlyToHotspot(target);
            onSetSpatialSpotlight?.(target.targetPos, target.name);
          }
        }
      }
    },
    [hotspots, onFlyToHotspot, onSetRenderMode, onSetSpatialSpotlight, runTourStation]
  );

  const handleToggleSpeech = (msgId: string, textToRead: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      speechEngine.stop();
      setSpeakingMsgId(null);
      return;
    }

    const cleanSpeechText = textToRead.replace(/[*#_`~]/g, '');
    setSpeakingMsgId(msgId);
    speechEngine.speakText(cleanSpeechText, {
      lang,
      rate: 1.0,
      onComplete: () => setSpeakingMsgId(null),
    });
  };

  const handleSendMessage = async (questionText?: string) => {
    const query = (questionText ?? inputText).trim();
    if (!query || isLoading) return;

    const isFreeLimited = !sitePerms.canUseAdvancedAi;
    const liveDailyQuota = getFreeAiDailyUsage(quotaScopeKey);
    if (isFreeLimited && liveDailyQuota.remaining <= 0) {
      if (!questionText) {
        setInputText('');
      }
      const nowTime = new Date().toLocaleTimeString(
        lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN',
        { hour: '2-digit', minute: '2-digit' }
      );
      const limitMsg =
        lang === 'en'
          ? 'You have used all 5/5 daily questions on the Basic Tier (Gemini 2.5 Flash). Upgrade to Plus (19,000 VND / $1) for Gemini 3.5 Flash or Pro (49,000 VND / $2) for Gemini 3.5 Flash & 4 Hydrogen.'
          : lang === 'zh'
          ? '您今日在基础版（Gemini 2.5 Flash）的 5/5 次提问额度已用完。请升级 Plus（$1）解锁 Gemini 3.5 Flash，或升级 Pro（$2）解锁 Gemini 3.5 Flash & 4 Hydrogen。'
          : 'Bạn đã dùng hết 5/5 câu hỏi cơ bản trong ngày trên Gói Vé Tham Quan Cơ Bản (Gemini 2.5 Flash). Nâng cấp Vé Plus (19.000đ) để mở Gemini 3.5 Flash hoặc Vé Pro (49.000đ) để mở Gemini 3.5 Flash & 4 Hydrogen.';
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: query,
          persona,
          spatialActions: [],
          timestamp: nowTime,
        },
        {
          id: `quota-${Date.now() + 1}`,
          role: 'model',
          content: limitMsg,
          persona,
          spatialActions: [],
          timestamp: nowTime,
          modelUsed: 'gemini-2.5-flash',
        },
      ]);
      openUpgradePrompt({
        featureKey: 'ai_daily_limit',
        siteId: effectiveSite.id,
        siteName: localizedCurrentSite.officialName,
        requiredPlan: sitePerms.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
        isPlusScopeMismatch: sitePerms.isPlusScopeLockedForSite,
      });
      return;
    }

    if (!questionText) {
      setInputText('');
    }

    const nowClock = new Date().toLocaleTimeString(
      lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN',
      { hour: '2-digit', minute: '2-digit' }
    );
    const normalizedQueryKey = query.toLowerCase();
    const newHistoryEntry: RecentPromptEntry = {
      id: `prompt-${Date.now()}`,
      text: query,
      siteId: effectiveSite.id,
      siteName: localizedCurrentSite.officialName,
      persona,
      createdAt: nowClock,
    };
    setRecentPrompts((prev) => {
      const next = [
        newHistoryEntry,
        ...prev.filter((item) => item.text.trim().toLowerCase() !== normalizedQueryKey),
      ].slice(0, MAX_RECENT_AI_PROMPTS);
      saveRecentPromptsToStorage(quotaScopeKey, next);
      return next;
    });

    let activePersonaForQuery: CanonicalPersona = persona;
    let targetSiteForQuery: HeritageSite = effectiveSite;
    const labsConfirmations: string[] = [];

    if (isLabsChatMode) {
      const norm = normalizeLabsCommandText(query);

      if (
        norm.includes('kien truc su') ||
        norm.includes('goc nhin kien tao') ||
        norm.includes('architect') ||
        query.includes('建筑师')
      ) {
        activePersonaForQuery = 'Architect';
        if (persona !== 'Architect') setPersona('Architect');
      }

      if (
        norm.includes('tat x-ray') ||
        norm.includes('tat xray') ||
        norm.includes('nguyen ban') ||
        norm.includes('mac dinh') ||
        norm.includes('khoi phuc') ||
        norm.includes('restore original') ||
        query.includes('恢复原貌')
      ) {
        onSetRenderMode('textured');
        onSetExplodedFactor?.(0);
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Restored Original Architecture Mode'
            : lang === 'zh'
            ? '↳ 已恢复原貌建筑模式'
            : '↳ Đã khôi phục chế độ Kiến trúc Nguyên bản'
        );
      } else if (norm.includes('x-ray') || norm.includes('xray') || query.includes('X光') || query.includes('透视')) {
        onSetRenderMode('xray');
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Switched to X-Ray Cutaway Mode'
            : lang === 'zh'
            ? '↳ 已切换至 X光透视模式'
            : '↳ Đã chuyển sang chế độ Mặt cắt X-Ray'
        );
      }

      if (
        norm.includes('boc tach') ||
        norm.includes('tach lop') ||
        norm.includes('giai phau') ||
        norm.includes('dissect') ||
        norm.includes('explode') ||
        query.includes('拆解')
      ) {
        onSetExplodedFactor?.(0.72);
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Activated 3D Exploded Structure Mode'
            : lang === 'zh'
            ? '↳ 已激活 3D 结构拆解模式'
            : '↳ Đã kích hoạt chế độ Bóc tách Kết cấu 3D'
        );
      } else if (norm.includes('thu gon') || norm.includes('lap lai') || norm.includes('collapse')) {
        onSetExplodedFactor?.(0);
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Collapsed 3D structure to solid form'
            : lang === 'zh'
            ? '↳ 已将 3D 结构收拢恢复整体'
            : '↳ Đã thu gọn kết cấu 3D về nguyên khối'
        );
      }

      if (norm.includes('tat gio vang') || norm.includes('tat anh sang gio vang')) {
        setGoldenHour3D(false);
        onSetLightingMode?.('studio');
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Disabled Golden Hour lighting, restored Studio lighting'
            : lang === 'zh'
            ? '↳ 已关闭黄金时刻光照，恢复工作室光照'
            : '↳ Đã tắt Ánh sáng Giờ Vàng, khôi phục ánh sáng Studio'
        );
      } else if (
        norm.includes('gio vang') ||
        norm.includes('hoang hon') ||
        norm.includes('golden hour') ||
        query.includes('黄金时刻')
      ) {
        setGoldenHour3D(true);
        onSetLightingMode?.('golden');
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Enabled Golden Hour 3D Lighting'
            : lang === 'zh'
            ? '↳ 已开启黄金时刻 3D 光照 (Golden Hour 3D)'
            : '↳ Đã bật Ánh sáng Giờ Vàng (Golden Hour 3D)'
        );
      }

      if (norm.includes('tat luoi')) {
        setWireframeOverlay(false);
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Disabled Technical Wireframe Mode'
            : lang === 'zh'
            ? '↳ 已关闭工程线框模式'
            : '↳ Đã tắt Chế độ Lưới Kỹ thuật'
        );
      } else if (
        norm.includes('luoi ky thuat') ||
        norm.includes('bat luoi') ||
        norm.includes('wireframe') ||
        query.includes('线框')
      ) {
        setWireframeOverlay(true);
        labsConfirmations.push(
          lang === 'en'
            ? '↳ Enabled Technical Wireframe Mode'
            : lang === 'zh'
            ? '↳ 已开启工程线框模式 (Wireframe)'
            : '↳ Đã bật Chế độ Lưới Kỹ thuật (Wireframe)'
        );
      }

      const matchedSite = findSiteForLabsCommand(norm, availableSites);
      if (matchedSite && matchedSite.id !== effectiveSite.id) {
        targetSiteForQuery = matchedSite;
        setInternalSiteId(matchedSite.id);
        onSwitchSite?.(matchedSite);
        const locMatched = getLocalizedSite(matchedSite);
        labsConfirmations.push(
          lang === 'en'
            ? `↳ Switched viewport to ${locMatched.officialName}`
            : lang === 'zh'
            ? `↳ 已切换视角至 ${locMatched.officialName}`
            : `↳ Đã chuyển khung hình sang ${locMatched.officialName}`
        );
      }
    }

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      persona: activePersonaForQuery,
      spatialActions: [],
      timestamp: new Date().toLocaleTimeString(
        lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN',
        { hour: '2-digit', minute: '2-digit' }
      ),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const hotspotPayload = hotspots.slice(0, 6).map((h, i) => ({
        index: i + 1,
        tag: `ACTION:HOTSPOT_${i + 1}`,
        name: h.name,
        description: h.description,
      }));

      const historyPayload = messages
        .filter((m) => !m.id.startsWith('welcome-'))
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.content,
        }));

      const targetIdentity = getRoleplayIdentity(
        targetSiteForQuery,
        activePersonaForQuery,
        lang
      );
      const targetDocent = getLivingDocentSiteData(targetSiteForQuery);

      const systemInstruction = buildHeritageSystemInstruction(
        targetSiteForQuery,
        activePersonaForQuery,
        hotspots,
        targetIdentity,
        lang,
        activeModel
      );

      let rawReply = '';
      let usedModel: string = activeModel;

      const requestModelChat = async (modelToUse: string) => {
        const res = await fetch('/api/gemini/heritage-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            model: modelToUse,
            lang,
            userTier: resolvedUserTier,
            isPrioritySupport: resolvedUserTier === 'pro' || isAdmin || isTesterPro,
            systemInstruction,
            persona: activePersonaForQuery,
            monument: {
              id: targetSiteForQuery.id,
              code: targetSiteForQuery.identifierCode,
              officialName: targetSiteForQuery.officialName,
              district: `${targetSiteForQuery.address.district}, ${targetSiteForQuery.address.city}`,
              architecturalStyle: targetSiteForQuery.architecturalStyle,
              constructionPeriod: targetSiteForQuery.chronology,
              architectOrBuilder: targetSiteForQuery.architect,
              historicalEvents: (targetSiteForQuery.milestones || []).map(
                (m) => `${m.year}: ${m.event}`
              ),
              summary: targetSiteForQuery.summary,
            },
            roleplayIdentity: targetIdentity,
            hotspots: hotspotPayload,
            history: historyPayload,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && typeof data.text === 'string' && data.text.trim()) {
          return { text: data.text as string, modelUsed: (data.modelUsed as string) || modelToUse };
        }
        return null;
      };

      try {
        let result = await requestModelChat(activeModel);
        if (!result && activeModel === 'gemini-3.5-flash') {
          result = await requestModelChat('gemini-2.5-flash');
        }
        if (result) {
          rawReply = result.text;
          usedModel = result.modelUsed;
        }
      } catch {
        // Offline scholarly fallback handled below
      }

      if (!rawReply.trim()) {
        const normQuery = normalizeLabsCommandText(query);
        const locTarget = getLocalizedSite(targetSiteForQuery);
        if (
          isLabsChatMode &&
          (normQuery.includes('do vui') ||
            normQuery.includes('cau hoi') ||
            normQuery.includes('trivia') ||
            query.includes('问答'))
        ) {
          if (lang === 'en') {
            rawReply = `Historical Trivia · ${locTarget.officialName}:\n\n${locTarget.officialName} (${locTarget.chronology}) exemplifies ${locTarget.architecturalStyle} in ${locTarget.address.district}. Which architectural detail or milestone from ${locTarget.milestones?.[0]?.year || locTarget.chronology} defines its iconic status?\n\nClue: ${targetDocent.mystery?.secretStory?.[lang] || locTarget.summary}\n\nReply with your answer and I will verify it!`;
          } else if (lang === 'zh') {
            rawReply = `历史知识问答 · ${locTarget.officialName}：\n\n位于 ${locTarget.address.district} 的 ${locTarget.officialName}（${locTarget.chronology}）展现了典型的 ${locTarget.architecturalStyle}。请问该建筑在 ${locTarget.milestones?.[0]?.year || locTarget.chronology} 的哪一构造细节或历史事件成就了它的标志性地位？\n\n线索：${targetDocent.mystery?.secretStory?.[lang] || locTarget.summary}\n\n请发送您的答案，我来为您揭晓！`;
          } else {
            rawReply = `Đố vui Lịch sử · ${locTarget.officialName}:\n\nCông trình ${locTarget.officialName} (${locTarget.chronology}) gắn liền với phong cách ${locTarget.architecturalStyle} tại ${locTarget.address.district}. Theo bạn, yếu tố kiến trúc hoặc dấu mốc năm ${locTarget.milestones?.[0]?.year || locTarget.chronology} nào đã làm nên giá trị biểu tượng của công trình này?\n\nGợi ý: ${targetDocent.mystery?.secretStory?.[lang] || locTarget.summary}\n\nHãy nhắn câu trả lời của bạn để tôi đối chiếu nhé!`;
          }
        } else {
          rawReply = buildScholarlyFallbackResponse(
            query,
            locTarget,
            activePersonaForQuery,
            hotspots,
            lang,
            activeModel
          );
        }
      }

      // Guarantee Polymath responses always end with explicit Nguồn tham khảo:
      if (activePersonaForQuery === 'Polymath' && !/Nguồn tham khảo\s*:/i.test(rawReply)) {
        rawReply = `${rawReply}\n\nNguồn tham khảo: ${targetDocent.polymathSources}`;
      }

      const { cleanText, actions } = parseGeminiResponseAndActions(rawReply, hotspots, lang);

      if (actions.length > 0) {
        executeSpatialActions(actions);
      }

      const modelMsg: ChatMessageItem = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: cleanText,
        persona: activePersonaForQuery,
        spatialActions: actions,
        ...(labsConfirmations.length > 0 ? { labsConfirmations } : {}),
        timestamp: new Date().toLocaleTimeString(
          lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN',
          { hour: '2-digit', minute: '2-digit' }
        ),
        modelUsed: usedModel,
      };

      setMessages((prev) => [...prev, modelMsg]);
      if (isFreeLimited) {
        incrementFreeAiDailyUsage(quotaScopeKey);
        refreshEntitlements();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoiceMic = () => {
    setMicUnsupportedNotice(null);
    if (isListeningMic && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningMic(false);
      return;
    }

    const win = window as SpeechRecognitionWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setMicUnsupportedNotice(
        lang === 'en'
          ? 'Voice input requires Chrome or Edge browser.'
          : lang === 'zh'
          ? '语音输入需要 Chrome 或 Edge 浏览器支持。'
          : 'Nhập giọng nói hỗ trợ trên trình duyệt Chrome / Edge.'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          setInputText(transcript);
          void handleSendMessage(transcript);
        }
      };
      rec.onerror = () => {
        setIsListeningMic(false);
      };
      rec.onend = () => {
        setIsListeningMic(false);
      };
      recognitionRef.current = rec;
      setIsListeningMic(true);
      rec.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  if (!isOpen) return null;

  const activeTourStep = tourStations[tourStepIndex] || null;
  const mystery = docentData.mystery;
  const hasSpatialFocus = tourStatus !== 'idle' || Boolean(isMysteryModeActive);

  const handleCloseDrawer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(false);
    setIsModelDropdownOpen(false);
    setIsSiteDropdownOpen(false);
    setIsPersonaDropdownOpen(false);
    onClose();
  };

  const modelDisplayNameMap: Record<AiModelTierId, string> = {
    'gemini-4-argon': 'Gemini 4 Argon',
    'gemini-4-hydrogen': 'Gemini 4 Hydrogen',
    'gemini-3.5-flash': 'Gemini 3.5 Flash',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
  };

  const accountTierLabel =
    effectiveRole === 'admin'
      ? 'Admin'
      : effectiveRole === 'tester'
      ? lang === 'zh'
        ? '测试员'
        : 'Tester'
      : effectiveRole === 'school'
      ? lang === 'en'
        ? 'School'
        : lang === 'zh'
        ? '学校版'
        : 'Trường học'
      : effectiveRole === 'pro'
      ? 'Pro'
      : effectiveRole === 'plus'
      ? 'Plus'
      : lang === 'en'
      ? 'Basic'
      : lang === 'zh'
      ? '基础版'
      : 'Cơ bản';

  const tierModelBadgeLabel = `${accountTierLabel} · ${modelDisplayNameMap[activeModel]}`;

  const aiCoreOptions: Array<{
    id: AiModelTierId;
    name: string;
    subtitle: string;
    adminOnly?: boolean;
  }> = [
    {
      id: 'gemini-4-argon',
      name: 'Gemini 4 Argon',
      adminOnly: true,
      subtitle:
        lang === 'en'
          ? 'Admin Exclusive — Supreme curation & deep synthesis'
          : lang === 'zh'
          ? '管理员专属 — 深度文献考据与最高策展核心'
          : 'Độc quyền Admin — Phân tích chuyên sâu & Giám tuyển tối cao',
    },
    {
      id: 'gemini-4-hydrogen',
      name: 'Gemini 4 Hydrogen',
      subtitle:
        lang === 'en'
          ? 'Pro (49k) & School — Deep archival synthesis & advanced 3D analysis'
          : lang === 'zh'
          ? 'Pro 49k 与学校授权 — 深度史学对话与高级 3D 结构分析'
          : 'Hạng Pro (49.000đ) & Trường học — Đối thoại lịch sử chuyên sâu & Bóc tách 3D nâng cao',
    },
    {
      id: 'gemini-3.5-flash',
      name: 'Gemini 3.5 Flash',
      subtitle:
        lang === 'en'
          ? 'Plus (19k) & above — Fast archival lookup & multi-angle narration'
          : lang === 'zh'
          ? 'Plus 19k 及以上 — 快速史料检索与多维导览'
          : 'Hạng Plus (19.000đ) trở lên — Tra cứu sử liệu nhanh & Thuyết minh đa chiều',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      subtitle:
        lang === 'en'
          ? 'Standard — Essential heritage Q&A'
          : lang === 'zh'
          ? '标准版 — 基础遗产问答'
          : 'Tiêu chuẩn — Hỏi đáp di sản cơ bản',
    },
  ];

  // Role-based visibility:
  // - Visitors (Basic / Plus / Pro / School / Guest): COMPLETELY HIDE Gemini 4 Argon (only 3 models shown).
  // - Tester: SHOW Gemini 4 Argon at top with "Chỉ dành cho Quản trị viên" + locked SVG padlock (hard disabled).
  // - Admin: SHOW & FULLY UNLOCK Gemini 4 Argon.
  const visibleAiCoreOptions = aiCoreOptions.filter(
    (core) => core.id !== 'gemini-4-argon' || sitePerms.canSeeGemini4Argon
  );

  const personaOptions: Array<{
    id: CanonicalPersona;
    icon: typeof Landmark;
    label: string;
    shortDesc: string;
  }> = [
    {
      id: 'Architect',
      icon: Landmark,
      label: lang === 'en' ? 'Architect' : lang === 'zh' ? '建筑匠师' : 'Kiến trúc sư',
      shortDesc:
        lang === 'en'
          ? 'Structure, materials & spatial artistry'
          : lang === 'zh'
          ? '建筑构造、材质与空间美学'
          : 'Kết cấu, vật liệu & nghệ thuật kiến trúc',
    },
    {
      id: 'Eyewitness',
      icon: Flame,
      label: lang === 'en' ? 'Witness' : lang === 'zh' ? '历史亲历' : 'Nhân chứng',
      shortDesc:
        lang === 'en'
          ? 'Living memories & historical turning points'
          : lang === 'zh'
          ? '亲历记忆与重大历史时刻'
          : 'Ký ức nhân chứng & dấu mốc lịch sử',
    },
    {
      id: 'Polymath',
      icon: ScrollText,
      label: lang === 'en' ? 'Historian' : lang === 'zh' ? '博学史家' : 'Thông sử',
      shortDesc:
        lang === 'en'
          ? 'Comparative history & archival citations'
          : lang === 'zh'
          ? '比较史学与权威文献出处'
          : 'Đối sánh liên vùng & trích dẫn sử liệu',
    },
  ];

  const activePersonaOption =
    personaOptions.find((p) => p.id === persona) || personaOptions[0];
  const ActivePersonaIcon = activePersonaOption.icon;

  const activeSiteIdx = Math.max(
    0,
    availableSites.findIndex((s) => s.id === effectiveSite.id)
  );
  const activeSiteNumber = String(activeSiteIdx + 1).padStart(2, '0');

  const hasUserMessages = messages.some((m) => m.role === 'user');
  const starterSuggestions = (
    isLabsChatMode ? LABS_QUICK_PROMPTS_BY_LANG[lang] : suggestedQuestions
  ).slice(0, 2);
  const basicQuotaSnapshot = !sitePerms.canUseAdvancedAi
    ? getFreeAiDailyUsage(quotaScopeKey)
    : null;

  const handleSelectSite = (site: HeritageSite) => {
    setInternalSiteId(site.id);
    setChatMode('standard');
    if (persona === 'Polymath') {
      setPersona('Architect');
    }
    setIsSiteDropdownOpen(false);
    onSwitchSite?.(site);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'en'
          ? 'Royal Historiographer'
          : lang === 'zh'
          ? '史官讲解'
          : 'Sử Quan Dấu Ấn'
      }
      className={
        isExpanded
          ? 'fixed inset-0 sm:inset-4 md:inset-6 z-[1250] rounded-none sm:rounded-3xl bg-[#171817] border border-[#C9A46A]/35 shadow-2xl flex flex-col overflow-hidden pointer-events-auto text-[#D8C9A9] min-w-0'
          : 'fixed bottom-3 right-3 min-[440px]:bottom-5 min-[440px]:right-5 z-[1250] w-[calc(100vw-24px)] min-[440px]:w-[380px] h-[500px] max-h-[85vh] min-[440px]:h-[520px] min-[440px]:max-h-[82vh] rounded-2xl bg-[#171817] border border-[#C9A46A]/35 shadow-2xl flex flex-col overflow-hidden pointer-events-auto text-[#D8C9A9] min-w-0'
      }
    >
      {/* ==================== PART 1: HEADER (shrink-0) ==================== */}
      <div
        ref={modelDropdownRef}
        className="relative bg-[#171817] shrink-0 w-full min-w-0 border-b border-[#C9A46A]/20"
      >
        {!isExpanded ? (
          <>
            {/* FLOATING POPUP CARD — ROW 1: Icon + Full Title | Compact AI Core + Expand + Close */}
            <div className="px-3 py-2 border-b border-[#C9A46A]/15 flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <RoyalHistoriographerIcon className="w-4 h-4 text-[#C9A46A] shrink-0" />
                <span className="font-serif text-[13.5px] font-semibold text-[#D8C9A9] whitespace-nowrap leading-none">
                  {lang === 'en'
                    ? 'Royal Historiographer'
                    : lang === 'zh'
                    ? '史官讲解'
                    : 'Sử Quan Dấu Ấn'}
                </span>
              </div>

              <div className="flex items-center gap-1 min-w-0 shrink">
                <button
                  type="button"
                  onClick={() => {
                    setLockedModelNotice(null);
                    setIsSiteDropdownOpen(false);
                    setIsPersonaDropdownOpen(false);
                    setIsModelDropdownOpen((prev) => !prev);
                  }}
                  aria-expanded={isModelDropdownOpen}
                  aria-haspopup="listbox"
                  title={tierModelBadgeLabel}
                  className="border border-[#C9A46A]/45 hover:border-[#C9A46A] bg-[#222321] text-[#C9A46A] rounded-full px-2 py-0.5 text-[10px] font-medium inline-flex items-center gap-1 min-w-0 max-w-[126px] cursor-pointer transition-colors"
                >
                  <span className="truncate">{modelDisplayNameMap[activeModel]}</span>
                  <ChevronDown
                    className={`w-3 h-3 shrink-0 transition-transform ${
                      isModelDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    setIsSiteDropdownOpen(false);
                    setIsPersonaDropdownOpen(false);
                    setIsExpanded(true);
                  }}
                  className="w-6 h-6 rounded-full border border-[#C9A46A]/25 bg-[#222321] hover:border-[#C9A46A] text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title={lang === 'en' ? 'Expand fullscreen' : lang === 'zh' ? '全屏展开' : 'Phóng to'}
                  aria-label={lang === 'en' ? 'Expand fullscreen' : lang === 'zh' ? '全屏展开' : 'Phóng to'}
                >
                  <Maximize2 className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                  aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                  className="w-6 h-6 rounded-full border border-[#C9A46A]/25 bg-[#222321] hover:bg-[#A94F3D] hover:border-[#A94F3D] text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* FLOATING POPUP CARD — ROW 2: Numbered Monument Dropdown + Role Dropdown + Compact Tour 3D */}
            <div className="px-3 py-1.5 flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {/* Compact 17-Monument Dropdown Trigger (e.g., 01 Dinh Độc Lập ▾) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    setIsPersonaDropdownOpen(false);
                    setIsSiteDropdownOpen((prev) => !prev);
                  }}
                  aria-expanded={isSiteDropdownOpen}
                  aria-haspopup="listbox"
                  title={`${activeSiteNumber} ${cleanEffectiveSiteTitle}`}
                  className={`flex-1 min-w-0 px-2.5 py-1 rounded-full text-[11px] font-medium inline-flex items-center justify-between gap-1 border transition-colors cursor-pointer ${
                    isSiteDropdownOpen
                      ? 'bg-[#C9A46A]/18 border-[#C9A46A] text-[#C9A46A]'
                      : 'bg-[#222321] border-[#C9A46A]/25 text-[#D8C9A9] hover:border-[#C9A46A]/65'
                  }`}
                >
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <span className="tabular-nums text-[10px] font-semibold text-[#C9A46A] shrink-0">
                      {activeSiteNumber}
                    </span>
                    <span className="truncate">{cleanEffectiveSiteTitle}</span>
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#C9A46A] shrink-0 transition-transform ${
                      isSiteDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Compact Persona Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    setIsSiteDropdownOpen(false);
                    setIsPersonaDropdownOpen((prev) => !prev);
                  }}
                  aria-expanded={isPersonaDropdownOpen}
                  aria-haspopup="listbox"
                  className={`shrink-0 px-2 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap ${
                    isPersonaDropdownOpen || isLabsChatMode || isMysteryModeActive
                      ? 'bg-[#C9A46A]/18 border-[#C9A46A] text-[#C9A46A]'
                      : 'bg-[#222321] border-[#C9A46A]/25 text-[#D8C9A9] hover:border-[#C9A46A]/65'
                  }`}
                >
                  <span>
                    {isLabsChatMode
                      ? 'Labs'
                      : activePersonaOption.label}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#C9A46A] shrink-0 transition-transform ${
                      isPersonaDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Compact Tour 3D Button */}
              <button
                type="button"
                onClick={handleStartOrToggleTour}
                className="bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] rounded-full px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                {tourStatus === 'playing' ? (
                  <>
                    <Pause className="w-3 h-3 shrink-0" />
                    <span>{lang === 'en' ? 'Pause' : lang === 'zh' ? '暂停' : 'Dừng'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 shrink-0" />
                    <span>{lang === 'en' ? '3D Tour' : lang === 'zh' ? '3D 导览' : 'Tour 3D'}</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* EXPANDED FULLSCREEN MODE — FULL HEADER + 17-MONUMENT STRIP + DETAILED PERSONA BAR */}
            <div className="px-4 pt-3 pb-2 border-b border-[#C9A46A]/15 flex items-center justify-between gap-2 min-w-0">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <RoyalHistoriographerIcon className="w-[18px] h-[18px] text-[#C9A46A] shrink-0" />
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-serif text-sm sm:text-[15px] font-semibold text-[#D8C9A9] whitespace-nowrap leading-tight">
                      {lang === 'en'
                        ? 'Royal Historiographer'
                        : lang === 'zh'
                        ? '史官讲解'
                        : 'Sử Quan Dấu Ấn'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLockedModelNotice(null);
                        setIsModelDropdownOpen((prev) => !prev);
                      }}
                      aria-expanded={isModelDropdownOpen}
                      aria-haspopup="listbox"
                      title={tierModelBadgeLabel}
                      className="border border-[#C9A46A]/45 hover:border-[#C9A46A] bg-[#222321]/90 text-[#C9A46A] rounded-full px-2.5 py-0.5 text-[10.5px] font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <span className="truncate">{tierModelBadgeLabel}</span>
                      <ChevronDown
                        className={`w-3 h-3 shrink-0 transition-transform ${
                          isModelDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <span className="text-[11px] text-[#C9A46A]/85 truncate leading-tight mt-0.5">
                    {cleanEffectiveSiteTitle}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleStartOrToggleTour}
                  className="bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  {tourStatus === 'playing' ? (
                    <>
                      <Pause className="w-3 h-3 shrink-0" />
                      <span>{lang === 'en' ? 'Pause' : lang === 'zh' ? '暂停' : 'Dừng'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 shrink-0" />
                      <span>{lang === 'en' ? '3D Tour' : lang === 'zh' ? '3D 导览' : 'Tour 3D'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    setIsExpanded(false);
                  }}
                  className="w-7 h-7 rounded-full border border-[#C9A46A]/25 bg-[#222321] hover:border-[#C9A46A] text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title={lang === 'en' ? 'Floating window' : lang === 'zh' ? '还原小窗' : 'Thu nhỏ cửa sổ'}
                  aria-label={lang === 'en' ? 'Floating window' : lang === 'zh' ? '还原小窗' : 'Thu nhỏ cửa sổ'}
                >
                  <Minimize2 className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                  aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                  className="w-7 h-7 rounded-full border border-[#C9A46A]/25 bg-[#222321] hover:bg-[#A94F3D] hover:border-[#A94F3D] text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* EXPANDED ROW 1.5: Full 17-Monument (01-17) Horizontal Bar */}
            <div
              ref={sitesStripDrag.ref}
              onMouseDown={sitesStripDrag.onMouseDown}
              onDragStart={sitesStripDrag.onDragStart}
              onClickCapture={sitesStripDrag.onClickCapture}
              role="tablist"
              aria-label={
                lang === 'en'
                  ? '17 Heritage Monuments Selector'
                  : lang === 'zh'
                  ? '17处遗产横向快速切换'
                  : 'Thanh chọn ngang 17 di tích (01-17)'
              }
              className={`px-4 py-2 border-b border-[#C9A46A]/15 flex items-center gap-2 overflow-x-auto ai-drawer-scrollbar touch-pan-x whitespace-nowrap w-full min-w-0 ${
                sitesStripDrag.isDragging ? 'cursor-grabbing select-none [&_*]:cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {availableSites.map((site, idx) => {
                const isSelected = site.id === effectiveSite.id;
                const locS = getLocalizedSite(site);
                const cleanName = locS.officialName.split(/\s*[（(]/)[0];
                const numCode = String(idx + 1).padStart(2, '0');
                const { slots } = resolveSitePhotoSlots(site.id, customPhotosMap, wikimediaCacheMap);
                const thumbUrl = slots[0] || site.photos?.[0] || '';
                const showThumb = Boolean(thumbUrl && !failedThumbIds[site.id]);

                return (
                  <button
                    key={`ai-site-pill-${site.id}`}
                    ref={isSelected ? activeSitePillRef : undefined}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSite(site)}
                    title={`${numCode} · ${locS.officialName}`}
                    className={`pl-1.5 pr-3 py-1 rounded-full text-[11px] inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A46A] text-[#171817] font-semibold shadow-sm'
                        : 'bg-[#222321] border border-[#C9A46A]/20 text-[#D8C9A9]/85 hover:border-[#C9A46A]/65 hover:text-[#D8C9A9] font-medium'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center border ${
                        isSelected
                          ? 'border-[#171817]/35 bg-[#171817]/15 text-[#171817]'
                          : 'border-[#C9A46A]/35 bg-[#171817] text-[#C9A46A]'
                      }`}
                    >
                      {showThumb ? (
                        <img
                          src={thumbUrl}
                          alt={cleanName}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          draggable={false}
                          onError={() =>
                            setFailedThumbIds((prev) =>
                              prev[site.id] ? prev : { ...prev, [site.id]: true }
                            )
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Landmark className="w-3 h-3 shrink-0" />
                      )}
                    </span>
                    <span
                      className={`tabular-nums text-[10px] font-semibold ${
                        isSelected ? 'text-[#171817]/80' : 'text-[#C9A46A]'
                      }`}
                    >
                      {numCode}
                    </span>
                    <span className="whitespace-nowrap">{cleanName}</span>
                  </button>
                );
              })}
            </div>

            {/* EXPANDED ROW 2: Detailed Role & Mode Bar */}
            <div
              ref={rolesStripDrag.ref}
              onMouseDown={rolesStripDrag.onMouseDown}
              onDragStart={rolesStripDrag.onDragStart}
              onClickCapture={rolesStripDrag.onClickCapture}
              className={`px-4 pt-2 pb-1.5 flex items-center gap-2 overflow-x-auto ai-drawer-scrollbar touch-pan-x whitespace-nowrap w-full min-w-0 ${
                rolesStripDrag.isDragging ? 'cursor-grabbing select-none [&_*]:cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {personaOptions.map((tab) => {
                const Icon = tab.icon;
                const active = !isLabsChatMode && persona === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setChatMode('standard');
                      setPersona(tab.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      active
                        ? 'bg-[#C9A46A] text-[#171817]'
                        : 'bg-[#222321] border border-[#C9A46A]/20 text-[#D8C9A9]/80 hover:text-[#D8C9A9]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {canUseLabsChat && (
                <button
                  type="button"
                  onClick={() => setChatMode((prev) => (prev === 'labs' ? 'standard' : 'labs'))}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    isLabsChatMode
                      ? 'bg-[#C9A46A] text-[#171817]'
                      : 'bg-[#222321] border border-[#C9A46A]/20 text-[#D8C9A9]/80 hover:text-[#D8C9A9]'
                  }`}
                >
                  <RoyalHistoriographerIcon
                    size={15}
                    className={`w-[15px] h-[15px] shrink-0 ${
                      isLabsChatMode ? 'text-[#171817]' : 'text-[#C9A46A]'
                    }`}
                  />
                  <span>{lang === 'en' ? 'Labs Mode' : lang === 'zh' ? 'Labs 模式' : 'Chế độ Labs'}</span>
                </button>
              )}

              {onToggleMysteryMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (tourStatus !== 'idle') {
                      stopTourAndRestore(false);
                    }
                    const next = !isMysteryModeActive;
                    onToggleMysteryMode(next);
                    if (!next) setMysteryFeedback(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    isMysteryModeActive
                      ? 'bg-[#47796D] text-[#D8C9A9] border border-[#47796D]'
                      : 'bg-[#222321] border border-[#C9A46A]/20 text-[#D8C9A9]/80 hover:text-[#D8C9A9]'
                  }`}
                >
                  <Puzzle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'en' ? '3D Mystery' : lang === 'zh' ? '3D 解谜' : 'Giải mã 3D'}</span>
                </button>
              )}

              {hasSpatialFocus && (
                <button
                  type="button"
                  onClick={() => {
                    stopTourAndRestore(true);
                    onToggleMysteryMode?.(false);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#222321] border border-[#C9A46A]/35 text-[#C9A46A] text-xs font-medium inline-flex items-center gap-1 cursor-pointer shrink-0"
                  title={lang === 'en' ? 'Restore View' : lang === 'zh' ? '恢复视角' : 'Khôi phục góc nhìn'}
                >
                  <RotateCcw className="w-3 h-3 shrink-0" />
                  <span>{lang === 'en' ? 'Reset' : lang === 'zh' ? '重置' : 'Đặt lại'}</span>
                </button>
              )}
            </div>

            {/* EXPANDED ACTIVE CHARACTER BAR */}
            <div className="px-4 pb-2 flex items-center gap-1.5 text-[11px] min-w-0">
              <span className="inline-flex items-center gap-1 text-[#C9A46A] font-semibold shrink-0">
                {isLabsChatMode ? (
                  <RoyalHistoriographerIcon size={14} className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                ) : (
                  <ActivePersonaIcon className="w-3 h-3 shrink-0" />
                )}
                <span>
                  {isLabsChatMode
                    ? lang === 'en'
                      ? 'Historiographer Labs'
                      : lang === 'zh'
                      ? '史官 Labs'
                      : 'Sử Quan Labs'
                    : roleplayIdentity.name}
                </span>
              </span>
              <span className="text-[#D8C9A9]/40 shrink-0">·</span>
              <span className="text-[#D8C9A9]/75 truncate min-w-0">
                {isLabsChatMode ? cleanEffectiveSiteTitle : roleplayIdentity.title}
              </span>
            </div>
          </>
        )}

        {/* POPOVER 1: AI CORE SWITCHER DROPDOWN (Shared by Floating & Expanded) */}
        {isModelDropdownOpen && (
          <div
            role="listbox"
            aria-label={
              lang === 'en'
                ? 'Select AI Core'
                : lang === 'zh'
                ? '选择 AI 核心'
                : 'Chọn lõi trí tuệ nhân tạo'
            }
            className="absolute left-3 right-3 top-[42px] z-[90] rounded-2xl bg-[#171817] border border-[#C9A46A]/45 shadow-2xl p-1.5 space-y-1 sm:max-w-[356px] sm:left-auto"
          >
            <div className="px-2.5 pt-1 pb-1 flex items-center justify-between gap-2 border-b border-[#C9A46A]/15">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#C9A46A]">
                {lang === 'en'
                  ? 'Royal Historiographer Core'
                  : lang === 'zh'
                  ? '史官讲解核心'
                  : 'Lõi Sử Quan Dấu Ấn'}
              </span>
              <span className="text-[10.5px] text-[#D8C9A9]/70 truncate">
                {accountTierLabel}
              </span>
            </div>

            {visibleAiCoreOptions.map((core) => {
              const isUnlocked = unlockedModels.includes(core.id);
              const isSelected = activeModel === core.id;
              const isHardLockedArgon = core.id === 'gemini-4-argon' && !sitePerms.canUseGemini4Argon;
              return (
                <button
                  key={core.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isHardLockedArgon}
                  onClick={() => {
                    if (isUnlocked && !isHardLockedArgon) {
                      setSelectedModel(core.id);
                      writePersistedAiModel(core.id);
                      setLockedModelNotice(null);
                      setIsModelDropdownOpen(false);
                    } else if (core.adminOnly || isHardLockedArgon) {
                      setLockedModelNotice({
                        modelId: core.id,
                        adminOnly: true,
                      });
                    } else if (core.id === 'gemini-4-hydrogen') {
                      setIsModelDropdownOpen(false);
                      openUpgradePrompt({
                        featureKey: 'ai_hydrogen',
                        siteId: effectiveSite.id,
                        siteName: localizedCurrentSite.officialName,
                        requiredPlan: 'pro',
                        isPlusScopeMismatch: false,
                        currentRole: effectiveRole,
                      });
                    } else {
                      setIsModelDropdownOpen(false);
                      openUpgradePrompt({
                        featureKey: 'ai_advanced',
                        siteId: effectiveSite.id,
                        siteName: localizedCurrentSite.officialName,
                        requiredPlan: sitePerms.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
                        isPlusScopeMismatch: sitePerms.isPlusScopeLockedForSite,
                        currentRole: effectiveRole,
                      });
                    }
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-start justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-[#C9A46A]/18 border border-[#C9A46A]/55 cursor-pointer'
                      : isUnlocked
                      ? 'hover:bg-[#222321] border border-transparent cursor-pointer'
                      : isHardLockedArgon
                      ? 'opacity-75 bg-[#171817]/70 hover:bg-[#222321]/60 border border-[#A94F3D]/25 cursor-not-allowed'
                      : 'opacity-75 hover:bg-[#222321]/70 border border-transparent cursor-pointer'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-[#C9A46A]'
                            : isUnlocked
                            ? 'text-[#D8C9A9]'
                            : 'text-[#D8C9A9]/75'
                        }`}
                      >
                        {core.name}
                      </span>
                      {!isUnlocked && core.adminOnly && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#A94F3D]/20 border border-[#A94F3D]/45 text-[#D8C9A9]/90 whitespace-nowrap">
                          {lang === 'en'
                            ? 'Admin only'
                            : lang === 'zh'
                            ? '仅限管理员'
                            : 'Chỉ dành cho Quản trị viên'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] leading-snug text-[#D8C9A9]/65 mt-0.5">
                      {core.subtitle}
                    </p>
                  </div>

                  <span className="shrink-0 mt-0.5">
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#C9A46A]" />
                    ) : !isUnlocked ? (
                      <LockGlyph className="w-3.5 h-3.5 text-[#C9A46A]" />
                    ) : null}
                  </span>
                </button>
              );
            })}

            {lockedModelNotice && (
              <div className="mx-1 mt-1 px-2.5 py-2 rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 text-[11px] text-[#D8C9A9] flex items-center justify-between gap-2">
                <span className="leading-snug min-w-0">
                  {lockedModelNotice.adminOnly
                    ? lang === 'en'
                      ? 'Gemini 4 Argon is reserved exclusively for Administrators. Tester accounts do not have permission to activate it.'
                      : lang === 'zh'
                      ? 'Gemini 4 Argon 仅限管理员专属使用。测试员（Tester）账户无权启用该模型。'
                      : 'Mô hình Gemini 4 Argon chỉ dành riêng cho Quản trị viên. Tài khoản Kiểm thử viên (Tester) không có quyền kích hoạt.'
                    : lang === 'en'
                    ? `Upgrade to ${
                        lockedModelNotice.modelId === 'gemini-4-hydrogen' ? 'Pro 49k' : 'Plus 19k'
                      } to unlock ${modelDisplayNameMap[lockedModelNotice.modelId]}.`
                    : lang === 'zh'
                    ? `升级至 ${
                        lockedModelNotice.modelId === 'gemini-4-hydrogen' ? 'Pro 49k' : 'Plus 19k'
                      } 即可解锁 ${modelDisplayNameMap[lockedModelNotice.modelId]}。`
                    : `Nâng cấp gói ${
                        lockedModelNotice.modelId === 'gemini-4-hydrogen' ? 'Pro 49k' : 'Plus 19k'
                      } để mở khóa ${modelDisplayNameMap[lockedModelNotice.modelId]}.`}
                </span>
                {!lockedModelNotice.adminOnly && onNavigateToTickets && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModelDropdownOpen(false);
                      setLockedModelNotice(null);
                      onNavigateToTickets();
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-[10.5px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    {lang === 'en' ? 'Upgrade' : lang === 'zh' ? '立即升级' : 'Nâng cấp'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* POPOVER 2: COMPACT 17-MONUMENT DROPDOWN (Floating Widget) */}
        {!isExpanded && isSiteDropdownOpen && (
          <div className="absolute left-3 right-3 top-[82px] z-[95]">
            <HeritageSiteListPanel
              sites={availableSites}
              selectedSiteId={effectiveSite.id}
              showInternalSearch
              autoFocusSearch
              showRegionFilters
              customPhotosMap={customPhotosMap}
              wikimediaCacheMap={wikimediaCacheMap}
              headingLabel={
                lang === 'en'
                  ? 'SWITCH LANDMARK CONTEXT'
                  : lang === 'zh'
                  ? '切换遗迹语境'
                  : 'CHUYỂN NGỮ CẢNH DI TÍCH'
              }
              maxListHeightClass="max-h-[260px]"
              className="border-[#C9A46A]/45 border-b-2 border-b-[#C9A46A]/55 shadow-[0_24px_60px_rgba(0,0,0,0.95)]"
              onClose={() => setIsSiteDropdownOpen(false)}
              onSelectSite={(site) => handleSelectSite(site)}
            />
          </div>
        )}

        {/* POPOVER 3: COMPACT PERSONA & MODE DROPDOWN (Floating Widget) */}
        {!isExpanded && isPersonaDropdownOpen && (
          <div
            role="listbox"
            aria-label={
              lang === 'en'
                ? 'Select Historical Perspective'
                : lang === 'zh'
                ? '选择讲解视角'
                : 'Chọn góc nhìn Sử Quan'
            }
            className="absolute left-3 right-3 sm:left-auto sm:right-3 sm:w-[290px] top-[86px] z-[90] rounded-2xl bg-[#171817] border border-[#C9A46A]/45 shadow-2xl p-1.5 space-y-1"
          >
            <div className="px-2.5 pt-1 pb-1 border-b border-[#C9A46A]/15 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#C9A46A]">
                {lang === 'en'
                  ? 'Perspective & Modes'
                  : lang === 'zh'
                  ? '讲解视角与模式'
                  : 'Góc nhìn & Chế độ'}
              </span>
            </div>

            {personaOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = !isLabsChatMode && persona === opt.id;
              return (
                <button
                  key={`compact-persona-${opt.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setChatMode('standard');
                    setPersona(opt.id);
                    setIsPersonaDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#C9A46A]/18 border border-[#C9A46A]/55'
                      : 'hover:bg-[#222321] border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-[#C9A46A] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-[#C9A46A]' : 'text-[#D8C9A9]'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-[10.5px] text-[#D8C9A9]/65 truncate">
                        {opt.shortDesc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />}
                </button>
              );
            })}

            {(canUseLabsChat || onToggleMysteryMode || hasSpatialFocus) && (
              <div className="pt-1 mt-1 border-t border-[#C9A46A]/15 space-y-1">
                {canUseLabsChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatMode((prev) => (prev === 'labs' ? 'standard' : 'labs'));
                      setIsPersonaDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      isLabsChatMode
                        ? 'bg-[#C9A46A]/18 border border-[#C9A46A]/55 text-[#C9A46A] font-semibold'
                        : 'hover:bg-[#222321] text-[#D8C9A9]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RoyalHistoriographerIcon size={14} className="w-3.5 h-3.5 text-[#C9A46A]" />
                      <span>{lang === 'en' ? 'Labs Mode' : lang === 'zh' ? 'Labs 模式' : 'Chế độ Labs'}</span>
                    </span>
                    {isLabsChatMode && <Check className="w-3.5 h-3.5 text-[#C9A46A]" />}
                  </button>
                )}

                {onToggleMysteryMode && (
                  <button
                    type="button"
                    onClick={() => {
                      if (tourStatus !== 'idle') {
                        stopTourAndRestore(false);
                      }
                      const next = !isMysteryModeActive;
                      onToggleMysteryMode(next);
                      if (!next) setMysteryFeedback(null);
                      setIsPersonaDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      isMysteryModeActive
                        ? 'bg-[#47796D]/25 border border-[#47796D] text-[#D8C9A9] font-semibold'
                        : 'hover:bg-[#222321] text-[#D8C9A9]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Puzzle className="w-3.5 h-3.5 text-[#C9A46A]" />
                      <span>{lang === 'en' ? '3D Mystery Challenge' : lang === 'zh' ? '3D 解谜挑战' : 'Giải mã Kiến trúc 3D'}</span>
                    </span>
                    {isMysteryModeActive && <Check className="w-3.5 h-3.5 text-[#C9A46A]" />}
                  </button>
                )}

                {hasSpatialFocus && (
                  <button
                    type="button"
                    onClick={() => {
                      stopTourAndRestore(true);
                      onToggleMysteryMode?.(false);
                      setIsPersonaDropdownOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2 text-xs text-[#C9A46A] hover:bg-[#222321] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Restore 3D View' : lang === 'zh' ? '恢复 3D 视角' : 'Khôi phục góc nhìn 3D'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIVE 60-SECOND TOUR SUBTITLE RIBBON */}
      {tourStatus !== 'idle' && activeTourStep && (
        <div className="px-3.5 py-2 bg-[#171817] border-b border-[#C9A46A]/30 space-y-1 shrink-0">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-sans text-[#C9A46A] font-semibold tabular-nums truncate">
              {lang === 'en'
                ? `Station ${tourStepIndex + 1}/${tourStations.length}`
                : lang === 'zh'
                ? `第 ${tourStepIndex + 1}/${tourStations.length} 站`
                : `Trạm ${tourStepIndex + 1}/${tourStations.length}`}{' '}
              · {activeTourStep.modeLabel}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {tourUsingCustomAudio && (
                <span className="px-1.5 py-0.5 rounded-sm bg-[#47796D] text-[#D8C9A9] text-[10px]">
                  Audio
                </span>
              )}
              <button
                type="button"
                onClick={() => runTourStation(tourStepIndex + 1)}
                className="px-2 py-0.5 rounded-sm border border-[#D8C9A9]/20 text-[#D8C9A9] hover:border-[#C9A46A] cursor-pointer"
              >
                <SkipForward className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => stopTourAndRestore(true)}
                className="px-2 py-0.5 rounded-sm border border-[#A94F3D] text-[#D8C9A9] hover:bg-[#A94F3D] cursor-pointer"
              >
                <Square className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-[#D8C9A9] font-sans line-clamp-2">
            {activeTourStep.subtitle}
          </p>
        </div>
      )}

      {/* INTERACTIVE CLICK-ON-3D ARCHITECTURAL MYSTERY PANEL */}
      {(isMysteryModeActive || currentStamp) && (isMysteryModeActive || mysteryFeedback?.matched) && (
        <div className="px-3.5 py-2 bg-[#171817] border-b border-[#C9A46A]/25 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-[11px] text-[#C9A46A] font-semibold tabular-nums">
              {mysteryFeedback?.matched || currentStamp
                ? lang === 'en'
                  ? 'Mystery Solved · Passport Stamped'
                  : lang === 'zh'
                  ? '解谜成功 · 遗产护照已盖章'
                  : 'Bí mật Lịch sử Được Khai Mở'
                : lang === 'en'
                ? `3D Mystery Challenge (${mysteryAttempts} clicks)`
                : lang === 'zh'
                ? `3D 解码挑战（尝试 ${mysteryAttempts} 次）`
                : `Thử thách Giải mã Kiến trúc (${mysteryAttempts} lần chọn)`}
            </span>
            {!mysteryFeedback?.matched && !currentStamp && (
              <button
                type="button"
                onClick={() => setMysteryShowHint((v) => !v)}
                className="text-[10.5px] text-[#C9A46A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3 h-3" />
                <span>{lang === 'en' ? 'Hint' : lang === 'zh' ? '提示' : 'Gợi ý'}</span>
              </button>
            )}
          </div>

          {mysteryFeedback?.matched || (currentStamp && !isMysteryModeActive) ? (
            <div className="rounded-lg bg-[#47796D]/20 border border-[#47796D] p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#D8C9A9]">
                  {mystery.secretTitle[lang]}
                </span>
                <span className="font-sans text-[10px] text-[#C9A46A] px-1.5 py-0.5 rounded-sm bg-[#171817] tabular-nums">
                  {mystery.stampCode}
                </span>
              </div>
              <p className="text-[11px] text-[#D8C9A9]/90 leading-relaxed">
                {mystery.secretStory[lang]}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#D8C9A9]">{mystery.title[lang]}</div>
              <p className="text-[11px] text-[#D8C9A9]/85 leading-relaxed">
                {mystery.riddle[lang].replace(/\*\*/g, '')}
              </p>
              {mysteryShowHint && (
                <p className="text-[10.5px] text-[#C9A46A] bg-[#171817] border border-[#C9A46A]/35 rounded-sm px-2 py-1">
                  {mystery.hintTip[lang]}
                </p>
              )}
              {mysteryFeedback && !mysteryFeedback.matched && (
                <div className="text-[11px] text-[#D8C9A9] bg-[#A94F3D]/25 border border-[#A94F3D] rounded-sm px-2.5 py-1.5">
                  {mysteryFeedback.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== PART 2: MESSAGES STREAM (flex-1 min-h-0 overflow-y-auto) ==================== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-3 heritage-scrollbar bg-[#171817]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeakingThis = speakingMsgId === msg.id;
          const msgIdentity = getRoleplayIdentity(effectiveSite, msg.persona, lang);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                  isUser
                    ? 'bg-[#C9A46A] text-[#171817] font-medium'
                    : 'bg-[#1D1E1C] border border-[#D8C9A9]/18 text-[#D8C9A9]'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-[#D8C9A9]/12">
                    <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[#C9A46A] truncate">
                      {msg.persona === 'Architect' ? (
                        <Landmark className="w-3 h-3 shrink-0" />
                      ) : msg.persona === 'Eyewitness' ? (
                        <Flame className="w-3 h-3 shrink-0" />
                      ) : (
                        <ScrollText className="w-3 h-3 shrink-0" />
                      )}
                      <span className="truncate">{msgIdentity.name}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleSpeech(msg.id, msg.content)}
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                        isSpeakingThis
                          ? 'bg-[#C9A46A] text-[#171817] border-[#C9A46A]'
                          : 'bg-[#171817] text-[#C9A46A] border-[#C9A46A]/35 hover:border-[#C9A46A]'
                      }`}
                    >
                      {isSpeakingThis ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>{lang === 'en' ? 'Stop' : lang === 'zh' ? '停止' : 'Dừng'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>{lang === 'en' ? 'Listen' : lang === 'zh' ? '朗读' : 'Nghe'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!isUser && msg.labsConfirmations && msg.labsConfirmations.length > 0 && (
                  <div className="mb-2 pb-1.5 border-b border-[#D8C9A9]/15 space-y-0.5">
                    {msg.labsConfirmations.map((line, i) => (
                      <div
                        key={`${msg.id}-lab-${i}`}
                        className="text-[11px] font-medium text-[#C9A46A] leading-snug"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 break-words">
                  {renderFormattedChatMarkdown(msg.content, isUser)}
                </div>

                {msg.spatialActions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#D8C9A9]/15 space-y-1">
                    {msg.spatialActions.map((act) => (
                      <div
                        key={act.tag}
                        className="px-2.5 py-1 rounded-md bg-[#47796D]/20 border border-[#47796D] text-[#D8C9A9] text-[10.5px] font-medium flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                        <span>{act.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!isUser && msg.purchaseNotice && (
                  <div className="mt-2.5 pt-2.5 border-t border-[#C9A46A]/25 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10.5px] text-[#D8C9A9]/75 tabular-nums">
                        Mã đơn: <strong className="text-[#C9A46A]">{msg.purchaseNotice.orderCode}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={resendingNoticeOrderId === msg.purchaseNotice.orderId}
                        onClick={() => void handleResendPurchaseNoticeEmail(msg.purchaseNotice!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171817] hover:bg-[#C9A46A]/15 border border-[#C9A46A]/65 text-[#D8C9A9] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {resendingNoticeOrderId === msg.purchaseNotice.orderId ? (
                          <RotateCcw className="w-3 h-3 text-[#C9A46A] animate-spin" />
                        ) : (
                          <Mail className="w-3 h-3 text-[#C9A46A]" />
                        )}
                        <span>
                          {resendingNoticeOrderId === msg.purchaseNotice.orderId
                            ? 'Đang gửi lại...'
                            : 'Gửi lại thư cảm ơn'}
                        </span>
                      </button>
                    </div>
                    {resendNoticeFeedback[msg.purchaseNotice.orderId] && (
                      <div
                        className={`text-[10.5px] leading-snug px-2.5 py-1.5 rounded-lg border ${
                          resendNoticeFeedback[msg.purchaseNotice.orderId].type === 'ok'
                            ? 'bg-[#47796D]/20 border-[#47796D]/60 text-[#D8C9A9]'
                            : 'bg-[#A94F3D]/20 border-[#A94F3D]/60 text-[#D8C9A9]'
                        }`}
                      >
                        {resendNoticeFeedback[msg.purchaseNotice.orderId].text}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="text-[10px] font-sans text-[#D8C9A9]/50 px-1 tabular-nums">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Starter Quick-Tap Suggestion Chips when User Has Not Sent Any Message Yet */}
        {!hasUserMessages && !isLoading && starterSuggestions.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#C9A46A]/85 px-0.5">
              {lang === 'en'
                ? 'Quick questions to start'
                : lang === 'zh'
                ? '快捷提问'
                : 'Gợi ý bắt đầu nhanh'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {starterSuggestions.map((q, idx) => (
                <button
                  key={`starter-chip-${idx}`}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleSendMessage(q)}
                  className="text-left px-3 py-1.5 rounded-xl bg-[#222321] hover:bg-[#C9A46A]/15 hover:border-[#C9A46A] border border-[#C9A46A]/28 text-[11.5px] leading-snug text-[#D8C9A9] cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#C9A46A]/30 bg-[#1D1E1C] w-fit text-xs text-[#C9A46A]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A46A]" />
            <span>
              {lang === 'en'
                ? 'Royal Historiographer is consulting the chronicles...'
                : lang === 'zh'
                ? '史官讲解正在查阅史料并回复...'
                : 'Sử Quan Dấu Ấn đang tra cứu sử liệu...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================== PART 3: PINNED COMPOSER FOOTER (shrink-0) ==================== */}
      <div className="relative px-3.5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-[#C9A46A]/20 bg-[#171817] shrink-0 w-full min-w-0">
        {/* Popover for Prompt History triggered by the compact Clock icon inside the input bar */}
        {isPromptHistoryOpen && (
          <div className="mb-2 rounded-2xl border border-[#C9A46A]/35 bg-[#222321] shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#D8C9A9]/10 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en'
                  ? `Recent Prompts (${recentPrompts.length}/${MAX_RECENT_AI_PROMPTS})`
                  : lang === 'zh'
                  ? `历史提问 (${recentPrompts.length}/${MAX_RECENT_AI_PROMPTS})`
                  : `Lịch sử gợi ý (${recentPrompts.length}/${MAX_RECENT_AI_PROMPTS})`}
              </span>
              <div className="flex items-center gap-2">
                {recentPrompts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecentPrompts([]);
                      saveRecentPromptsToStorage(quotaScopeKey, []);
                    }}
                    className="text-[10.5px] text-[#A94F3D] hover:underline cursor-pointer"
                  >
                    {lang === 'en' ? 'Clear' : lang === 'zh' ? '清空' : 'Xóa'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPromptHistoryOpen(false)}
                  className="text-[#D8C9A9]/60 hover:text-[#D8C9A9] cursor-pointer"
                  aria-label="Close history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="max-h-[150px] overflow-y-auto heritage-scrollbar divide-y divide-[#D8C9A9]/10">
              {recentPrompts.length === 0 ? (
                <div className="px-3 py-2.5 text-[11px] text-[#D8C9A9]/65">
                  {lang === 'en'
                    ? 'Your last 5 sent questions will appear here.'
                    : lang === 'zh'
                    ? '您最近发送的 5 条提问将显示在此处。'
                    : 'Chưa có câu hỏi gần đây.'}
                </div>
              ) : (
                recentPrompts.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setIsPromptHistoryOpen(false);
                      void handleSendMessage(entry.text);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#C9A46A]/10 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] text-[#D8C9A9] truncate">{entry.text}</div>
                      <div className="text-[10px] text-[#D8C9A9]/55 truncate">
                        {entry.siteName} · {entry.createdAt}
                      </div>
                    </div>
                    <RotateCcw className="w-3 h-3 text-[#C9A46A] shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Basic Tier (0đ) Remaining Daily Quota Indicator */}
        {basicQuotaSnapshot && (
          <div className="flex items-center justify-between gap-2 mb-1.5 px-1 text-[10.5px]">
            <span
              className={
                basicQuotaSnapshot.remaining <= 1
                  ? 'text-[#A94F3D] font-semibold'
                  : 'text-[#D8C9A9]/70'
              }
            >
              {lang === 'en'
                ? `Basic Pass · ${basicQuotaSnapshot.remaining}/${basicQuotaSnapshot.limit} questions left today`
                : lang === 'zh'
                ? `基础版 · 今日剩余 ${basicQuotaSnapshot.remaining}/${basicQuotaSnapshot.limit} 次提问`
                : `Gói Cơ bản (0đ) · Còn ${basicQuotaSnapshot.remaining}/${basicQuotaSnapshot.limit} lượt hỏi hôm nay`}
            </span>
            <button
              type="button"
              onClick={() =>
                openUpgradePrompt({
                  featureKey: 'ai_advanced',
                  siteId: effectiveSite.id,
                  siteName: localizedCurrentSite.officialName,
                  requiredPlan: sitePerms.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
                  isPlusScopeMismatch: sitePerms.isPlusScopeLockedForSite,
                  currentRole: effectiveRole,
                })
              }
              className="text-[#C9A46A] hover:underline font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              {lang === 'en' ? 'Upgrade' : lang === 'zh' ? '升级解锁' : 'Mở không giới hạn'}
            </button>
          </div>
        )}

        {micUnsupportedNotice && (
          <div className="text-[10.5px] text-[#C9A46A] mb-1 px-1">{micUnsupportedNotice}</div>
        )}

        {/* Always-Pinned Streamlined Pill Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
          className="flex items-center gap-1 rounded-full bg-[#222321] border border-[#C9A46A]/30 focus-within:border-[#C9A46A] px-1.5 py-1"
        >
          <button
            type="button"
            onClick={handleToggleVoiceMic}
            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              isListeningMic
                ? 'bg-[#A94F3D] text-[#D8C9A9]'
                : 'text-[#C9A46A] hover:bg-[#171817]'
            }`}
            title={
              lang === 'en'
                ? 'Voice input'
                : lang === 'zh'
                ? '语音提问'
                : 'Đặt câu hỏi bằng giọng nói'
            }
          >
            {isListeningMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsPromptHistoryOpen((prev) => !prev)}
            aria-expanded={isPromptHistoryOpen}
            title={
              lang === 'en'
                ? 'Prompt History'
                : lang === 'zh'
                ? '历史提问'
                : 'Lịch sử gợi ý'
            }
            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
              isPromptHistoryOpen
                ? 'bg-[#C9A46A] text-[#171817]'
                : 'text-[#D8C9A9]/70 hover:text-[#C9A46A] hover:bg-[#171817]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListeningMic
                ? lang === 'en'
                  ? 'Listening...'
                  : lang === 'zh'
                  ? '正在聆听...'
                  : 'Đang lắng nghe...'
                : lang === 'en'
                ? 'Ask Royal Historiographer about this landmark...'
                : lang === 'zh'
                ? '向史官询问有关此遗迹的问题...'
                : 'Hỏi Sử Quan về di tích này...'
            }
            className="flex-1 min-w-0 bg-transparent px-1.5 text-xs text-[#D8C9A9] placeholder:text-[#D8C9A9]/45 outline-none"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            aria-label={lang === 'en' ? 'Send' : lang === 'zh' ? '发送' : 'Gửi'}
            title={lang === 'en' ? 'Send' : lang === 'zh' ? '发送' : 'Gửi'}
            className="h-8 w-8 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] flex items-center justify-center disabled:opacity-40 cursor-pointer transition-colors shrink-0"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.2]" />
          </button>
        </form>
      </div>
    </div>
  );
};

function renderFormattedInline(text: string, isUser: boolean): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push(
        <strong
          key={`b-${keyIdx++}`}
          className={`font-semibold ${isUser ? 'text-[#171817]' : 'text-[#C9A46A]'}`}
        >
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {raw.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.map((node) =>
    typeof node === 'string' ? node.replace(/\*{1,2}/g, '') : node
  );
}

function renderFormattedChatMarkdown(content: string, isUser: boolean): React.ReactNode {
  const lines = content.split('\n');
  return lines.map((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      return <div key={`sp-${idx}`} className="h-1" />;
    }
    const cleanLine = rawLine.replace(/^#{1,4}\s+/, '').replace(/^\s*[-•]\s+/, '• ');
    return (
      <p key={`ln-${idx}`} className="leading-relaxed">
        {renderFormattedInline(cleanLine, isUser)}
      </p>
    );
  });
}

function tagToIndex(tag: string): string {
  return tag.replace('HOTSPOT_', '');
}

export const GeminiHeritageAssistant = GeminiHeritageChat;
export default GeminiHeritageChat;
