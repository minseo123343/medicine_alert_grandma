export interface Medicine {
  id: string;
  name: string;
  category: string;
  isCritical: boolean; // 고혈압, 당뇨, 심장약 등 재처방이 필수적인 중요 약품
  criticalReason?: string; // 3일 전 재처방이 필요한 구체적 이유
  dosage: string;
  timing: {
    morning: boolean;
    lunch: boolean;
    dinner: boolean;
    bedtime: boolean;
  };
  instructions: string;
  precautions?: string;
  pillShape?: string;
  color?: string;
}

export interface Prescription {
  id: string;
  title: string;
  hospitalOrPharmacy: string;
  patientName: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number; // e.g. 30
  refillNoticeDaysBefore: number; // e.g. 3
  medicines: Medicine[];
  doctorAdvice: string;
  cautionNotes?: string[];
  envelopeImageUrl?: string;
  hospitalPhone?: string;
  createdAt: string;
}

export type TimeSlot = 'morning' | 'lunch' | 'dinner' | 'bedtime';

export interface DailyDoseLog {
  date: string; // YYYY-MM-DD
  morning?: { taken: boolean; time?: string };
  lunch?: { taken: boolean; time?: string };
  dinner?: { taken: boolean; time?: string };
  bedtime?: { taken: boolean; time?: string };
}

export interface DoseTimes {
  morning: string; // e.g. "08:00"
  lunch: string;   // e.g. "12:30"
  dinner: string;  // e.g. "18:30"
  bedtime: string; // e.g. "21:30"
}

export interface SeniorSettings {
  fontSize: 'normal' | 'large' | 'huge'; // 글자 크기 (보통, 크게, 아주크게)
  highContrast: boolean; // 고대비 모드
  soundEnabled: boolean; // 음성 안내 활성화
  guardianPhone: string; // 보호자(손주/자녀) 연락처
  grandmaName: string; // 어르신 이름
  doseTimes: DoseTimes; // 사용자 맞춤 복약 알림 시간
  notificationsEnabled: boolean; // 푸시/시각 알림 활성화 여부
}

