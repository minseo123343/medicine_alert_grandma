import React from 'react';
import { Prescription, SeniorSettings } from '../types/prescription';
import { calculateRefillStatus, speakGrandmaNotice } from '../utils/prescriptionHelper';
import { ShieldAlert, AlertTriangle, CheckCircle, Calendar, Phone, Sparkles, Plus, Clock, FileText, ChevronRight } from 'lucide-react';

interface RefillManagementViewProps {
  prescriptions: Prescription[];
  simulatedDate?: string;
  settings: SeniorSettings;
  onOpenScanner: () => void;
  onRenewPrescription: (prescriptionId: string) => void;
}

export const RefillManagementView: React.FC<RefillManagementViewProps> = ({
  prescriptions,
  simulatedDate,
  settings,
  onOpenScanner,
  onRenewPrescription,
}) => {
  const handleVoiceExplain = (rxTitle: string, remainingDays: number, criticalMeds: string[]) => {
    speakGrandmaNotice(
      `할머니, ${rxTitle}의 ${criticalMeds.join(', ')} 약이 이제 ${remainingDays}일치밖에 남지 않았습니다. 고혈압약은 하루라도 끊기면 위험하니, 이번 주 안에 병원을 꼭 방문하셔서 새로 처방받아오셔야 합니다!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white rounded-3xl p-6 shadow-lg shadow-rose-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider">
              🏥 어르신 만성질환 안전망
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              3일 전 병원 재처방 & 약 소진 관리실
            </h2>
            <p className="text-rose-100 text-sm sm:text-base font-medium leading-relaxed">
              고혈압약, 당뇨약 등 만성질환 약물은 하루라도 복용을 중단하면 혈압이 급격히 치솟거나 뇌혈관에 위험이 생길 수 있습니다. 약이 완전히 바닥나기 <strong className="text-amber-300 font-bold">최소 3일 전</strong>에 미리 병원을 방문할 수 있도록 도와드립니다.
            </p>
          </div>

          <button
            onClick={onOpenScanner}
            className="px-4 py-3 bg-white text-rose-800 hover:bg-rose-50 rounded-2xl font-black text-sm sm:text-base shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5 text-rose-600" />
            <span>새 처방전 등록하기</span>
          </button>
        </div>
      </div>

      {/* List of Prescriptions with Refill Statuses */}
      <div className="space-y-5">
        {prescriptions.map((rx) => {
          const status = calculateRefillStatus(rx, simulatedDate);
          const percentUsed = Math.min(100, Math.round((status.daysPassed / rx.durationDays) * 100));

          return (
            <div
              key={rx.id}
              className={`rounded-3xl border-2 transition overflow-hidden shadow-sm ${
                status.isUrgentRefill || status.isExpired
                  ? 'bg-rose-50/50 border-rose-400 shadow-rose-100'
                  : 'bg-white border-stone-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-stone-900">
                      {rx.title}
                    </h3>
                    {status.isUrgentRefill && (
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs animate-bounce flex items-center gap-1 shadow">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        🚨 D-3 재처방 골든타임!
                      </span>
                    )}
                    {status.isExpired && (
                      <span className="px-3 py-1 rounded-full bg-red-700 text-white font-black text-xs flex items-center gap-1 shadow">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        약 소진됨 (즉시 방문)
                      </span>
                    )}
                    {!status.isUrgentRefill && !status.isExpired && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        안전 복용 기간 (여유 있음)
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 font-medium">
                    🏥 {rx.hospitalOrPharmacy} • 처방일: {rx.startDate} ({rx.durationDays}일 처방)
                  </p>
                </div>

                {/* Remaining Days Counter Badge */}
                <div className="text-right">
                  <div className="text-xs text-stone-500 font-bold">현재 남은 약</div>
                  <div
                    className={`text-2xl sm:text-3xl font-black ${
                      status.remainingDays <= 3 ? 'text-rose-600' : 'text-stone-800'
                    }`}
                  >
                    {status.remainingDays > 0 ? `${status.remainingDays}일치` : '0일 (소진)'}
                  </div>
                </div>
              </div>

              {/* Progress Gauge */}
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-1.5">
                  <span>복약 경과 ({status.daysPassed}일 / {rx.durationDays}일)</span>
                  <span className={status.remainingDays <= 3 ? 'text-rose-600 font-black' : 'text-stone-700'}>
                    소진 예정일: {status.expirationDate}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      status.remainingDays <= 3
                        ? 'bg-gradient-to-r from-rose-500 to-red-600'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>

              {/* Medicines Highlight in this Prescription */}
              <div className="p-5 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                    포함된 약품 정보 및 재처방 중요도
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {rx.medicines.map((med) => (
                      <div
                        key={med.id}
                        className={`p-3 rounded-2xl border text-sm ${
                          med.isCritical
                            ? 'bg-rose-50/80 border-rose-300'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-stone-900">{med.name}</span>
                          {med.isCritical ? (
                            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black">
                              🚨 3일전 필수 재처방
                            </span>
                          ) : (
                            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                              일반
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-700 font-bold mt-0.5">{med.category}</p>
                        {med.criticalReason && (
                          <p className="text-xs text-stone-700 mt-1 leading-snug">
                            💡 {med.criticalReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgent Refill Warning Box when <= 3 days */}
                {(status.isUrgentRefill || status.isExpired) && (
                  <div className="bg-gradient-to-r from-rose-500 to-amber-600 text-white rounded-2xl p-4 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-base sm:text-lg">
                          지금 바로 병원 재처방 방문 일정을 잡으셔야 합니다!
                        </h4>
                        <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
                          권장 재처방 날짜는 <strong className="text-white underline">{status.recommendedRefillDate}</strong>이며, {status.expirationDate} 이후에는 약이 완전히 소진되어 혈압 관리에 차질이 생깁니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions: Hospital Call, Speech, Renew */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  {rx.hospitalPhone && (
                    <a
                      href={`tel:${rx.hospitalPhone}`}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>병원 전화 연결 ({rx.hospitalPhone})</span>
                    </a>
                  )}

                  <button
                    onClick={() =>
                      handleVoiceExplain(
                        rx.title,
                        status.remainingDays,
                        status.criticalMedicineNames
                      )
                    }
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-sm flex items-center gap-1.5 transition"
                  >
                    <span>🔊 할머니께 재처방 이유 읽어드리기</span>
                  </button>

                  <button
                    onClick={() => onRenewPrescription(rx.id)}
                    className="ml-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-black text-sm flex items-center gap-1.5 transition"
                    title="병원에서 새로 약을 타왔을 때 일수를 갱신합니다"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>새 약 타왔어요 (재처방 갱신)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
