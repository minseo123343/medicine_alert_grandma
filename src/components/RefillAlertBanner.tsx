import React, { useState } from 'react';
import { Prescription, SeniorSettings } from '../types/prescription';
import { calculateRefillStatus, speakGrandmaNotice } from '../utils/prescriptionHelper';
import { AlertTriangle, Phone, Volume2, CheckSquare, Share2, Calendar, ShieldAlert } from 'lucide-react';

interface RefillAlertBannerProps {
  prescriptions: Prescription[];
  simulatedDate?: string;
  settings: SeniorSettings;
  onNavigateToRefill: () => void;
}

export const RefillAlertBanner: React.FC<RefillAlertBannerProps> = ({
  prescriptions,
  simulatedDate,
  settings,
  onNavigateToRefill,
}) => {
  const [showChecklist, setShowChecklist] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Find prescriptions that have critical meds with <= 3 days left
  const urgentPrescriptions = prescriptions
    .map((rx) => ({
      rx,
      status: calculateRefillStatus(rx, simulatedDate),
    }))
    .filter((item) => item.status.hasCriticalMedicine && (item.status.isUrgentRefill || item.status.isExpired));

  if (urgentPrescriptions.length === 0) {
    return null;
  }

  const primaryAlert = urgentPrescriptions[0];
  const { rx, status } = primaryAlert;
  const criticalNames = status.criticalMedicineNames.join(', ');

  const handleVoiceRead = () => {
    const speech = status.isExpired
      ? `할머니! 큰일이에요. ${criticalNames} 약이 모두 떨어졌어요! 오늘 당장 ${rx.hospitalOrPharmacy}에 가셔서 다시 처방받으셔야 해요!`
      : `할머니, 꼭 기억하세요! 드시고 계신 ${criticalNames} 약이 딱 ${status.remainingDays}일치밖에 안 남았어요. 약이 완전히 떨어지기 전에 미리 병원에 가셔서 재처방받으셔야 해요!`;
    speakGrandmaNotice(speech);
  };

  const handleShareGuardian = () => {
    const text = `[효도약통 긴급 재처방 알림]
${settings.grandmaName} 할머니의 중요 처방약(${criticalNames})이 ${status.remainingDays}일 뒤(${status.expirationDate}) 소진됩니다.
병원: ${rx.hospitalOrPharmacy}
전화: ${rx.hospitalPhone || '병원 문의'}
약이 끊기지 않도록 이번 주 병원 동행 또는 재처방 방문 부탁드립니다.`;

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-xl shadow-rose-200 border-2 border-rose-400 p-4 sm:p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Background glow & decorative icon */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute right-3 top-3 opacity-15">
        <ShieldAlert className="w-24 h-24 text-white" />
      </div>

      <div className="relative z-10">
        {/* Badge & Title */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-rose-700 font-black text-xs sm:text-sm shadow-md animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>
              {status.isExpired
                ? '🚨 [긴급] 약 완전 소진! 오늘 즉시 병원 방문'
                : `🚨 [중요 알림] 고혈압 등 필수약 ${status.remainingDays}일 전 재처방 경보!`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVoiceRead}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs sm:text-sm font-bold text-white transition"
              title="음성으로 어르신께 크게 읽어드립니다"
            >
              <Volume2 className="w-4 h-4" />
              <span>소리로 듣기</span>
            </button>
            <button
              onClick={handleShareGuardian}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs sm:text-sm font-bold text-white transition"
              title="보호자(손주, 자녀)에게 복약 알림 문자 복사"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedNotice ? '복사 완료! 카톡에 붙여넣기' : '보호자 알림'}</span>
            </button>
          </div>
        </div>

        {/* Headline message */}
        <div className="my-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            {settings.grandmaName} 할머니, <span className="underline decoration-amber-300 decoration-4 underline-offset-4">{criticalNames}</span>이(가) {status.remainingDays}일 뒤 소진됩니다!
          </h2>
          <p className="mt-1.5 text-rose-100 text-sm sm:text-base font-medium leading-relaxed">
            고혈압/만성질환 약은 중단하면 혈압이 급상승해 위험할 수 있으므로, 약이 완전히 떨어지기 <strong className="text-amber-200">3일 전인 지금 미리 병원을 방문해 재처방</strong>을 받아오셔야 합니다.
          </p>
        </div>

        {/* Quick details strip */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>
              소진 예정일: <strong className="text-white font-bold">{status.expirationDate}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-bold">🏥 처방 병원:</span>
            <span className="truncate font-semibold">{rx.hospitalOrPharmacy}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-bold">⏳ 잔여량:</span>
            <span className="bg-rose-700/80 px-2 py-0.5 rounded font-black text-amber-200">
              {status.remainingDays > 0 ? `${status.remainingDays}일치 남음` : '약 소진됨'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {rx.hospitalPhone && (
            <a
              href={`tel:${rx.hospitalPhone}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm sm:text-base shadow-md transition transform active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>병원 전화하기 ({rx.hospitalPhone})</span>
            </a>
          )}

          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-800 hover:bg-rose-50 rounded-xl font-black text-sm sm:text-base shadow-md transition"
          >
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span>병원 갈 때 챙길 준비물</span>
          </button>

          <button
            onClick={onNavigateToRefill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black/25 hover:bg-black/35 rounded-xl text-white font-bold text-xs sm:text-sm transition ml-auto"
          >
            <span>재처방 상세 관리실로 이동 →</span>
          </button>
        </div>

        {/* Senior Hospital Visit Checklist Dropdown */}
        {showChecklist && (
          <div className="mt-3 bg-white text-stone-800 rounded-xl p-4 shadow-lg border border-rose-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-base text-rose-900 flex items-center gap-1.5">
                <span>📋</span> 할머니 병원 방문 전 필수 준비물
              </h3>
              <button
                onClick={() => setShowChecklist(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                닫기
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 bg-stone-50 p-2 rounded-lg">
                <span className="text-rose-600 font-bold">1.</span>
                <div>
                  <strong className="text-stone-900 font-bold">신분증 또는 건강보험증 지참</strong>
                  <p className="text-xs text-stone-500">2024년부터 본인 확인 의무화로 신분증이 꼭 필요해요.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-stone-50 p-2 rounded-lg">
                <span className="text-rose-600 font-bold">2.</span>
                <div>
                  <strong className="text-stone-900 font-bold">기존에 먹던 남은 약 또는 약봉투</strong>
                  <p className="text-xs text-stone-500">의사 선생님께 기존 복용 약과 용량을 정확히 보여드릴 수 있어요.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-stone-50 p-2 rounded-lg">
                <span className="text-rose-600 font-bold">3.</span>
                <div>
                  <strong className="text-stone-900 font-bold">최근 집에서 측정한 혈압 수치 메모</strong>
                  <p className="text-xs text-stone-500">평소 아침, 저녁 혈압을 알려드리면 더 정확한 처방이 가능합니다.</p>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
