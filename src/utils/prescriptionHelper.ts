import { Prescription, TimeSlot } from '../types/prescription';

/**
 * Calculate days between two date strings (YYYY-MM-DD)
 */
export function getDaysDiff(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffTime = to.getTime() - from.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get calculation of remaining days and refill status
 */
export interface RefillStatus {
  daysPassed: number;
  remainingDays: number;
  isUrgentRefill: boolean; // D-3 or less
  isExpired: boolean; // D-0 or less
  hasCriticalMedicine: boolean;
  criticalMedicineNames: string[];
  expirationDate: string;
  recommendedRefillDate: string; // 3 days before expiration
}

export function calculateRefillStatus(
  prescription: Prescription,
  currentSimulatedDate?: string
): RefillStatus {
  const todayStr = currentSimulatedDate || formatDate();
  const daysPassed = getDaysDiff(prescription.startDate, todayStr);
  const remainingDays = prescription.durationDays - daysPassed;

  const criticalMeds = prescription.medicines.filter((m) => m.isCritical);
  const hasCriticalMedicine = criticalMeds.length > 0;
  const criticalMedicineNames = criticalMeds.map((m) => m.name);

  const refillNoticeDays = prescription.refillNoticeDaysBefore || 3;
  const isUrgentRefill = remainingDays <= refillNoticeDays && remainingDays > 0;
  const isExpired = remainingDays <= 0;

  // Expiration date
  const expDateObj = new Date(prescription.startDate);
  expDateObj.setDate(expDateObj.getDate() + prescription.durationDays);
  const expirationDate = formatDate(expDateObj);

  // Recommended refill date (3 days before)
  const refillDateObj = new Date(expDateObj);
  refillDateObj.setDate(refillDateObj.getDate() - refillNoticeDays);
  const recommendedRefillDate = formatDate(refillDateObj);

  return {
    daysPassed: Math.max(0, daysPassed),
    remainingDays,
    isUrgentRefill,
    isExpired,
    hasCriticalMedicine,
    criticalMedicineNames,
    expirationDate,
    recommendedRefillDate,
  };
}

/**
 * Natural Korean speech synthesis for senior grandma
 */
export function speakGrandmaNotice(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.88; // Slightly slower, warm and deliberate for elderly ears
  utterance.pitch = 1.05; // Gentle, clear tone

  // Try to pick a natural Korean voice if available
  const voices = window.speechSynthesis.getVoices();
  const koreanVoice = voices.find((v) => v.lang.startsWith('ko') || v.name.includes('Korean'));
  if (koreanVoice) {
    utterance.voice = koreanVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Format 24h "HH:MM" to Korean format "오전/오후 HH:MM"
 */
export function formatTimeLabel(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) return timeStr;

  const period = h < 12 ? '오전' : '오후';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const padH = String(displayH).padStart(2, '0');
  const padM = String(m || 0).padStart(2, '0');
  return `${period} ${padH}:${padM}`;
}

/**
 * Friendly Korean greeting and time slot details with custom time support
 */
export const DEFAULT_DOSE_TIMES: Record<TimeSlot, string> = {
  morning: '08:00',
  lunch: '12:30',
  dinner: '18:30',
  bedtime: '21:30',
};

export const TIME_SLOT_INFO: Record<
  TimeSlot,
  { label: string; defaultTime: string; defaultDesc: string; icon: string; color: string; bg: string; defaultHour: number }
> = {
  morning: {
    label: '아침 약',
    defaultTime: '08:00',
    defaultDesc: '오전 08:00 (식사 후 30분)',
    icon: '🌅',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    defaultHour: 8,
  },
  lunch: {
    label: '점심 약',
    defaultTime: '12:30',
    defaultDesc: '오후 12:30 (식사 후 30분)',
    icon: '☀️',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    defaultHour: 12,
  },
  dinner: {
    label: '저녁 약',
    defaultTime: '18:30',
    defaultDesc: '오후 06:30 (식사 후 30분)',
    icon: '🌙',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    defaultHour: 18,
  },
  bedtime: {
    label: '취침 전 약',
    defaultTime: '21:30',
    defaultDesc: '밤 09:30 (잠들기 전)',
    icon: '🛌',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    defaultHour: 21,
  },
};

/**
 * Play a clear, warm hospital chime tone using Web Audio API
 */
export function playChimeSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (warm, comforting hospital chime)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
    });
  } catch (e) {
    console.warn('AudioContext playback error:', e);
  }
}

