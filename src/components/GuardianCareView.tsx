import React, { useState } from 'react';
import { Prescription, SeniorSettings, DailyDoseLog } from '../types/prescription';
import { calculateRefillStatus } from '../utils/prescriptionHelper';
import { Heart, Share2, Phone, Calendar, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Copy, Award } from 'lucide-react';

interface GuardianCareViewProps {
  prescriptions: Prescription[];
  doseLog: DailyDoseLog;
  settings: SeniorSettings;
  onUpdateSettings: (newSettings: Partial<SeniorSettings>) => void;
  simulatedDate?: string;
}

export const GuardianCareView: React.FC<GuardianCareViewProps> = ({
  prescriptions,
  doseLog,
  settings,
  onUpdateSettings,
  simulatedDate,
}) => {
  const [copied, setCopied] = useState(false);
  const [guardianPhoneInput, setGuardianPhoneInput] = useState(settings.guardianPhone || '010-1234-5678');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Check urgent prescriptions
  const urgentList = prescriptions
    .map((rx) => ({ rx, status: calculateRefillStatus(rx, simulatedDate) }))
    .filter((item) => item.status.hasCriticalMedicine && item.status.remainingDays <= 3);

  // Today completed slots
  const slots = ['morning', 'lunch', 'dinner', 'bedtime'] as const;
  const takenCount = slots.filter((s) => doseLog[s]?.taken).length;

  const handleCopyReport = () => {
    const urgentDesc = urgentList.length > 0
      ? `🚨 [재처방 긴급 알림]\n${urgentList
          .map(
            (u) =>
              `- ${u.status.criticalMedicineNames.join(', ')} (${u.rx.hospitalOrPharmacy}): 잔여 ${u.status.remainingDays}일치 (소진예정: ${u.status.expirationDate})`
          )
          .join('\n')}\n이번 주 병원 방문 동행이 필요합니다.`
      : '✅ 현재 모든 처방약이 안정적으로 유지되고 있습니다.';

    const report = `[효도약통 안심 케어 리포트]
👵 환자: ${settings.grandmaName} 할머니
📅 기준일: ${simulatedDate || new Date().toISOString().split('T')[0]}
💊 오늘 복약 현황: 총 4회 중 ${takenCount}회 복용 완료
- 아침약: ${doseLog.morning?.taken ? '✅ 복용완료' : '⏳ 미복용'}
- 점심약: ${doseLog.lunch?.taken ? '✅ 복용완료' : '⏳ 미복용'}
- 저녁약: ${doseLog.dinner?.taken ? '✅ 복용완료' : '⏳ 미복용'}
- 취침약: ${doseLog.bedtime?.taken ? '✅ 복용완료' : '⏳ 미복용'}

${urgentDesc}

(손주/자녀가 함께 챙겨드리는 효도약통에서 발송)`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSavePhone = () => {
    onUpdateSettings({ guardianPhone: guardianPhoneInput });
    setIsEditingPhone(false);
  };

  // Mock 7-day adherence history for senior care report
  const pastSevenDays = [
    { day: '월', date: '10/14', score: 100, isFull: true },
    { day: '화', date: '10/15', score: 100, isFull: true },
    { day: '수', date: '10/16', score: 75, isFull: false },
    { day: '목', date: '10/17', score: 100, isFull: true },
    { day: '금', date: '10/18', score: 100, isFull: true },
    { day: '토', date: '10/19', score: 100, isFull: true },
    { day: '오늘', date: '10/20', score: Math.round((takenCount / 4) * 100), isFull: takenCount === 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Guardian Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="px-3 py-1 bg-rose-500/30 text-rose-300 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-rose-400" />
            손주/자녀 안심 연결 모드
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            멀리서도 챙겨드리는 {settings.grandmaName} 할머니 안심 수첩
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            할머니께서 매일 약을 잘 드셨는지 원격으로 확인하고, 고혈압약이 떨어지기 3일 전에 가족들에게 알림을 주어 함께 병원을 챙길 수 있도록 돕습니다.
          </p>
        </div>
      </div>

      {/* 1-Click Family KakaoTalk / Message Report Share */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-rose-600" />
              <span>가족 단톡방 안심 리포트 원터치 공유</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              오늘 복약 현황과 3일전 재처방 알림을 카카오톡이나 문자로 쉽게 보낼 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleCopyReport}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-900 font-black text-sm sm:text-base shadow-md flex items-center gap-2 transition transform active:scale-95"
          >
            <Copy className="w-5 h-5" />
            <span>{copied ? '리포트 복사 완료! 카톡에 붙여넣기' : '카카오톡 공유 문구 복사'}</span>
          </button>
        </div>

        {/* Preview of Report */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 font-mono text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
          {`[효도약통 안심 케어 리포트]
👵 환자: ${settings.grandmaName} 할머니
💊 오늘 복약 현황: 총 4회 중 ${takenCount}회 완료
${
  urgentList.length > 0
    ? `🚨 [재처방 긴급 알림] ${urgentList
        .map((u) => `${u.status.criticalMedicineNames.join(', ')} 잔여 ${u.status.remainingDays}일치 (소진예정: ${u.status.expirationDate})`)
        .join(', ')}`
    : '✅ 모든 중요 처방약 안정적 유지 중'
}`}
        </div>
      </div>

      {/* 7-Day Adherence Stamp Tracker */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-black text-stone-900">최근 7일 복약 실천 도장판</h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            평균 실천율: 96% (매우 우수)
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {pastSevenDays.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl text-center border transition ${
                item.day === '오늘'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                  : item.isFull
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="text-xs font-black text-stone-700">{item.day}</div>
              <div className="text-[10px] text-stone-400 mb-2">{item.date}</div>
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-xl shadow-inner bg-white border border-stone-200">
                {item.score >= 100 ? '💮' : item.score >= 50 ? '🌸' : '⏳'}
              </div>
              <div className="text-[11px] font-black text-stone-800 mt-2">
                {item.score}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guardian Contact Setup */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-black text-stone-900">비상시 손주/보호자 연락처</h3>
          </div>
          {!isEditingPhone ? (
            <button
              onClick={() => setIsEditingPhone(true)}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              수정하기
            </button>
          ) : (
            <button
              onClick={handleSavePhone}
              className="text-xs font-black text-emerald-600 hover:text-emerald-800"
            >
              저장완료
            </button>
          )}
        </div>

        {isEditingPhone ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={guardianPhoneInput}
              onChange={(e) => setGuardianPhoneInput(e.target.value)}
              className="border border-stone-300 rounded-xl px-3 py-2 text-sm flex-1"
              placeholder="예: 010-1234-5678"
            />
            <button
              onClick={handleSavePhone}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <p className="text-xs text-stone-500">등록된 보호자 전화번호</p>
              <p className="text-base font-black text-stone-800">{settings.guardianPhone || '010-1234-5678'}</p>
            </div>
            <a
              href={`tel:${settings.guardianPhone || '010-1234-5678'}`}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow"
            >
              전화 걸기
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
