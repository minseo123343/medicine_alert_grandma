import React from 'react';
import { TimeSlot, Prescription, SeniorSettings } from '../types/prescription';
import { TIME_SLOT_INFO, formatTimeLabel, speakGrandmaNotice } from '../utils/prescriptionHelper';
import { Bell, Volume2, CheckCircle2, X, ShieldAlert, Heart } from 'lucide-react';

interface VisualAlertToastProps {
  slot: TimeSlot;
  prescriptions: Prescription[];
  settings: SeniorSettings;
  onDismiss: () => void;
  onMarkAsTaken: (slot: TimeSlot) => void;
}

export const VisualAlertToast: React.FC<VisualAlertToastProps> = ({
  slot,
  prescriptions,
  settings,
  onDismiss,
  onMarkAsTaken,
}) => {
  const info = TIME_SLOT_INFO[slot];
  const customTime = settings.doseTimes[slot] || info.defaultTime;

  // Filter medicines for this slot
  const slotMeds = prescriptions.flatMap((rx) =>
    rx.medicines
      .filter((m) => m.timing[slot])
      .map((m) => ({ medicine: m, rxTitle: rx.title, hospital: rx.hospitalOrPharmacy }))
  );

  const hasCritical = slotMeds.some((m) => m.medicine.isCritical);
  const criticalNames = slotMeds.filter((m) => m.medicine.isCritical).map((m) => m.medicine.name).join(', ');

  const handleVoiceRepeat = () => {
    const medList = slotMeds.map((m) => m.medicine.name).join(', ');
    const criticalNotice = hasCritical ? ' 특히 혈압약은 거르지 말고 꼭 챙겨드셔야 합니다!' : '';
    speakGrandmaNotice(
      `할머니! ${formatTimeLabel(customTime)} ${info.label} 드실 시간입니다. 오늘 드실 약은 ${medList}입니다. 물과 함께 꼭 챙겨 드세요!${criticalNotice}`
    );
  };

  const handleComplete = () => {
    onMarkAsTaken(slot);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-rose-500 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Urgent Pulsing Alert Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white p-5 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-black mb-2 animate-bounce">
            <Bell className="w-4 h-4 text-amber-300" />
            <span>맞춤 정시 복약 알림 ({formatTimeLabel(customTime)})</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {settings.grandmaName} 할머니, {info.label} 드실 시간이에요!
          </h2>
          <p className="text-rose-100 text-xs sm:text-sm mt-1 font-medium">
            설정하신 시간({formatTimeLabel(customTime)})에 맞춰 알림을 보내드립니다.
          </p>

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Medicines to Take */}
        <div className="p-5 space-y-4">
          {hasCritical && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>
                🚨 중요: <strong>{criticalNames}</strong>(혈압/만성약)이 포함되어 있습니다. 잊지 마세요!
              </span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-black text-stone-500 uppercase tracking-wide mb-2">
              💊 지금 드실 약 목록 ({slotMeds.length}종)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {slotMeds.length === 0 ? (
                <p className="text-stone-400 text-sm py-2 text-center">등록된 약이 없습니다.</p>
              ) : (
                slotMeds.map(({ medicine: m }) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                      m.isCritical ? 'bg-rose-50 border-rose-300' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-stone-900 text-sm">{m.name}</span>
                        {m.isCritical && (
                          <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded">
                            필수
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {m.category} • {m.dosage}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-stone-600 bg-white px-2.5 py-1 rounded-xl border border-stone-200">
                      {m.instructions}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleComplete}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 transition transform active:scale-98"
            >
              <CheckCircle2 className="w-7 h-7 text-white" />
              <span>네, 약 지금 먹었어요! (복용 완료)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceRepeat}
                className="flex-1 py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Volume2 className="w-4 h-4 text-rose-600" />
                <span>소리로 다시 듣기</span>
              </button>
              <button
                onClick={onDismiss}
                className="py-3 px-4 rounded-2xl border border-stone-300 text-stone-500 hover:text-stone-700 font-bold text-xs sm:text-sm transition"
              >
                10분 뒤 다시 알림
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
