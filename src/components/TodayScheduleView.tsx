import React, { useState } from 'react';
import { Prescription, TimeSlot, DailyDoseLog, SeniorSettings, Medicine } from '../types/prescription';
import { TIME_SLOT_INFO, formatTimeLabel, speakGrandmaNotice } from '../utils/prescriptionHelper';
import { CheckCircle2, Circle, Volume2, ShieldAlert, Sparkles, Clock, Heart, Award, Bell } from 'lucide-react';

interface TodayScheduleViewProps {
  prescriptions: Prescription[];
  doseLog: DailyDoseLog;
  onToggleDoseSlot: (slot: TimeSlot) => void;
  settings: SeniorSettings;
  onOpenScanner: () => void;
  onOpenSettings?: () => void;
}

export const TodayScheduleView: React.FC<TodayScheduleViewProps> = ({
  prescriptions,
  doseLog,
  onToggleDoseSlot,
  settings,
  onOpenScanner,
  onOpenSettings,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);

  // Group medicines by time slots from all active prescriptions
  const slotMedicines: Record<TimeSlot, { medicine: Medicine; rxTitle: string; rxHospital: string }[]> = {
    morning: [],
    lunch: [],
    dinner: [],
    bedtime: [],
  };

  prescriptions.forEach((rx) => {
    rx.medicines.forEach((med) => {
      if (med.timing.morning) slotMedicines.morning.push({ medicine: med, rxTitle: rx.title, rxHospital: rx.hospitalOrPharmacy });
      if (med.timing.lunch) slotMedicines.lunch.push({ medicine: med, rxTitle: rx.title, rxHospital: rx.hospitalOrPharmacy });
      if (med.timing.dinner) slotMedicines.dinner.push({ medicine: med, rxTitle: rx.title, rxHospital: rx.hospitalOrPharmacy });
      if (med.timing.bedtime) slotMedicines.bedtime.push({ medicine: med, rxTitle: rx.title, rxHospital: rx.hospitalOrPharmacy });
    });
  });

  // Calculate completion percentage
  const totalSlotsWithMeds = (['morning', 'lunch', 'dinner', 'bedtime'] as TimeSlot[]).filter(
    (slot) => slotMedicines[slot].length > 0
  );
  const completedSlots = totalSlotsWithMeds.filter((slot) => doseLog[slot]?.taken);
  const progressPercent = totalSlotsWithMeds.length > 0
    ? Math.round((completedSlots.length / totalSlotsWithMeds.length) * 100)
    : 0;

  // Font size multiplier classes
  const getTextSizeClass = (type: 'title' | 'body' | 'pillName') => {
    if (settings.fontSize === 'huge') {
      if (type === 'title') return 'text-2xl sm:text-3xl font-black';
      if (type === 'pillName') return 'text-xl sm:text-2xl font-black';
      return 'text-base sm:text-lg';
    }
    if (settings.fontSize === 'large') {
      if (type === 'title') return 'text-xl sm:text-2xl font-black';
      if (type === 'pillName') return 'text-lg sm:text-xl font-bold';
      return 'text-sm sm:text-base';
    }
    // Normal
    if (type === 'title') return 'text-lg sm:text-xl font-bold';
    if (type === 'pillName') return 'text-base sm:text-lg font-bold';
    return 'text-xs sm:text-sm';
  };

  const handleVoiceReadSlot = (slot: TimeSlot) => {
    const info = TIME_SLOT_INFO[slot];
    const meds = slotMedicines[slot];
    if (meds.length === 0) {
      speakGrandmaNotice(`${settings.grandmaName} 할머니, ${info.label}에는 복용하실 약이 없습니다.`);
      return;
    }

    const medNames = meds.map((m) => m.medicine.name).join(', ');
    const criticalNotice = meds.some((m) => m.medicine.isCritical)
      ? ' 특히 고혈압 등 중요 약물이 포함되어 있으니 거르지 마시고 꼭 드세요!'
      : '';

    speakGrandmaNotice(
      `${settings.grandmaName} 할머니, ${info.label} 시간입니다. 오늘 드실 약은 ${medNames}입니다. 식사 후 미온수와 함께 천천히 드세요!${criticalNotice}`
    );
  };

  const handleToggle = (slot: TimeSlot) => {
    const isNowTaken = !doseLog[slot]?.taken;
    onToggleDoseSlot(slot);

    if (isNowTaken) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3500);

      if (settings.soundEnabled) {
        speakGrandmaNotice(
          `참 잘하셨어요! ${settings.grandmaName} 할머니, ${TIME_SLOT_INFO[slot].label}을 잘 챙겨드셨습니다. 건강하고 행복한 하루 보내세요!`
        );
      }
    }
  };

  const timeSlots: TimeSlot[] = ['morning', 'lunch', 'dinner', 'bedtime'];

  return (
    <div className="space-y-6">
      {/* Top Progress & Grandma Encouragement Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
              <Heart className="w-8 h-8 fill-rose-500 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-800">
                  {settings.grandmaName} 할머니의 오늘 복약 일정
                </h2>
                {progressPercent === 100 && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> 100% 완료!
                  </span>
                )}
              </div>
              <p className="text-stone-500 text-xs sm:text-sm font-medium mt-0.5">
                오늘 챙겨드실 총 <strong className="text-rose-600 font-bold">{totalSlotsWithMeds.length}번</strong>의 복약 중{' '}
                <strong className="text-emerald-600 font-bold">{completedSlots.length}번 완료</strong>하셨습니다.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenScanner}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm border border-rose-200 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>새 약봉투 추가 스캔</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-1">
            <span>오늘 복약 실천율</span>
            <span className="text-rose-600 font-black">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Encouragement celebration overlay */}
      {showCelebration && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in zoom-in duration-200 shadow-md">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xl flex-shrink-0">
            ❤️
          </div>
          <div>
            <h4 className="font-black text-base sm:text-lg">참 잘하셨어요, {settings.grandmaName} 할머니!</h4>
            <p className="text-xs sm:text-sm text-emerald-800">
              약 챙겨드시느라 수고 많으셨어요. 규칙적인 복약이 할머니를 건강하게 지켜드립니다!
            </p>
          </div>
        </div>
      )}

      {/* 4 Time Slots List */}
      <div className="space-y-4">
        {timeSlots.map((slot) => {
          const info = TIME_SLOT_INFO[slot];
          const meds = slotMedicines[slot];
          const isTaken = !!doseLog[slot]?.taken;
          const hasCritical = meds.some((m) => m.medicine.isCritical);

          return (
            <div
              key={slot}
              className={`rounded-3xl border-2 transition overflow-hidden shadow-sm ${
                isTaken
                  ? 'bg-stone-50 border-emerald-300 opacity-95'
                  : hasCritical
                  ? 'bg-white border-rose-200 hover:border-rose-300'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Slot Header */}
              <div
                className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b ${
                  isTaken ? 'bg-emerald-50/70 border-emerald-200' : 'bg-stone-50/70 border-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl" role="img" aria-label={info.label}>
                    {info.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`${getTextSizeClass('title')} text-stone-900`}>
                        {info.label}
                      </h3>
                      {hasCritical && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm">
                          <ShieldAlert className="w-3 h-3" />
                          고혈압 등 필수약
                        </span>
                      )}
                      {isTaken && (
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-xs font-black shadow-sm">
                          ✓ 복용 완료
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-500 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-bold text-stone-800">
                        {formatTimeLabel(settings.doseTimes[slot] || info.defaultTime)}
                      </span>
                      <span className="text-stone-400">|</span>
                      <span>{info.label === '취침 전 약' ? '잠들기 전' : '식사 후 30분'}</span>
                      {onOpenSettings && (
                        <button
                          type="button"
                          onClick={onOpenSettings}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline ml-1"
                        >
                          시간 변경
                        </button>
                      )}
                      {doseLog[slot]?.time && (
                        <span className="text-emerald-700 font-bold ml-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          (복용 기록: {doseLog[slot]?.time})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Voice button */}
                <button
                  onClick={() => handleVoiceReadSlot(slot)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
                  title="이 시간의 약 목록을 소리로 읽어드립니다"
                >
                  <Volume2 className="w-4 h-4 text-rose-500" />
                  <span>소리로 듣기</span>
                </button>
              </div>

              {/* Slot Medicines List */}
              <div className="p-4 sm:p-5">
                {meds.length === 0 ? (
                  <p className="text-stone-400 text-sm py-2 text-center font-medium">
                    이 시간에 복용할 약이 없습니다.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {meds.map(({ medicine: med, rxHospital }) => (
                      <div
                        key={med.id}
                        className={`p-3.5 rounded-2xl border transition ${
                          med.isCritical
                            ? 'bg-rose-50/60 border-rose-200'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className={`${getTextSizeClass('pillName')} text-stone-900`}>
                                {med.name}
                              </h4>
                              {med.isCritical && (
                                <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                  필수
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-rose-700 mt-0.5">
                              {med.category}
                            </p>
                            <p className="text-xs text-stone-600 mt-1 font-medium">
                              💊 {med.dosage} • {med.instructions}
                            </p>
                            {med.pillShape && (
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                알약 모양: <strong className="text-stone-700">{med.pillShape}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {med.isCritical && med.criticalReason && (
                          <div className="mt-2 text-xs bg-white/90 text-rose-800 p-2 rounded-xl font-medium border border-rose-100">
                            ⚠️ {med.criticalReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Big Senior-Friendly Check Button */}
                {meds.length > 0 && (
                  <button
                    onClick={() => handleToggle(slot)}
                    className={`w-full py-4 px-6 rounded-2xl font-black transition transform active:scale-98 shadow-md flex items-center justify-center gap-3 ${
                      isTaken
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 text-lg sm:text-xl'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 text-lg sm:text-xl'
                    }`}
                  >
                    {isTaken ? (
                      <>
                        <CheckCircle2 className="w-7 h-7 text-white" />
                        <span>복용 완료! (취소하려면 다시 누르세요)</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-7 h-7 text-rose-200" />
                        <span>할머니, 약 드셨나요? [복용 완료하기]</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
