import React, { useState } from 'react';
import { SeniorSettings, TimeSlot, DoseTimes } from '../types/prescription';
import { TIME_SLOT_INFO, formatTimeLabel, playChimeSound, speakGrandmaNotice } from '../utils/prescriptionHelper';
import { Bell, Clock, Volume2, ShieldCheck, X, Check, Eye, User, Phone, Sparkles, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SeniorSettings;
  onUpdateSettings: (newSettings: Partial<SeniorSettings>) => void;
  onTriggerTestNotification: (slot: TimeSlot) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onTriggerTestNotification,
}) => {
  const [doseTimes, setDoseTimes] = useState<DoseTimes>(settings.doseTimes);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [grandmaName, setGrandmaName] = useState(settings.grandmaName);
  const [guardianPhone, setGuardianPhone] = useState(settings.guardianPhone);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Change specific slot time
  const handleTimeChange = (slot: TimeSlot, newTime: string) => {
    setDoseTimes((prev) => ({
      ...prev,
      [slot]: newTime,
    }));
  };

  // Adjust time by minutes offset (+30, -30)
  const handleAdjustMinutes = (slot: TimeSlot, offsetMinutes: number) => {
    const cur = doseTimes[slot] || '08:00';
    const [h, m] = cur.split(':').map((v) => parseInt(v, 10));
    let totalM = (h * 60 + m + offsetMinutes) % (24 * 60);
    if (totalM < 0) totalM += 24 * 60;
    const newH = String(Math.floor(totalM / 60)).padStart(2, '0');
    const newM = String(totalM % 60).padStart(2, '0');
    handleTimeChange(slot, `${newH}:${newM}`);
  };

  // Request browser push notification permission
  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('이 브라우저는 웹 푸시 알림을 지원하지 않지만, 화면 상단 시각 알림과 음성 알림은 정상 작동합니다!');
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermissionStatus(res);
      if (res === 'granted') {
        setNotificationsEnabled(true);
        new Notification('효도약통 알림 설정 완료!', {
          body: `${grandmaName} 할머니의 복약 시간에 맞춰 알림을 전송해드립니다.`,
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  // Save all settings
  const handleSave = () => {
    onUpdateSettings({
      doseTimes,
      notificationsEnabled,
      soundEnabled,
      grandmaName: grandmaName.trim() || '김순자',
      guardianPhone: guardianPhone.trim() || '010-9876-5432',
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  // Slots
  const slots: TimeSlot[] = ['morning', 'lunch', 'dinner', 'bedtime'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-rose-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">복약 시간 커스텀 & 알림 설정</h2>
              <p className="text-xs text-rose-100">
                아침, 점심, 저녁 복약 시간을 할머니의 생활 리듬에 맞게 설정하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Custom Dose Times per slot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>시간대별 복약 알림 시간</span>
              </h3>
              <span className="text-xs font-semibold text-stone-500">
                원하는 시간을 직접 입력하거나 버튼으로 조절
              </span>
            </div>

            <div className="space-y-3">
              {slots.map((slot) => {
                const info = TIME_SLOT_INFO[slot];
                const curTime = doseTimes[slot] || info.defaultTime;

                return (
                  <div
                    key={slot}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-rose-200 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h4 className="font-black text-stone-900 text-base">{info.label}</h4>
                          <p className="text-xs text-stone-500 font-medium">
                            현재: <strong className="text-rose-600 font-bold">{formatTimeLabel(curTime)}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Time Input with Picker */}
                      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-stone-300 shadow-inner">
                        <input
                          type="time"
                          value={curTime}
                          onChange={(e) => handleTimeChange(slot, e.target.value)}
                          className="font-black text-stone-800 text-base px-2 py-0.5 outline-none rounded bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-stone-200/60 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustMinutes(slot, -30)}
                          className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-700 transition"
                        >
                          -30분
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustMinutes(slot, +30)}
                          className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-700 transition"
                        >
                          +30분
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimeChange(slot, info.defaultTime)}
                          className="px-2 py-1 rounded-lg text-stone-500 hover:text-stone-800 font-medium transition"
                        >
                          기본값({info.defaultTime})
                        </button>
                      </div>

                      {/* Immediate Test Button for this slot */}
                      <button
                        type="button"
                        onClick={() => onTriggerTestNotification(slot)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-[11px] flex items-center gap-1 transition"
                        title="이 시간의 알림을 지금 화면과 소리로 미리 체험해봅니다"
                      >
                        <Bell className="w-3 h-3 text-rose-600" />
                        <span>알림 시연</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Push Notifications & Audio Settings */}
          <div className="space-y-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>알림 방식 및 소리 설정</span>
            </h3>

            {/* Browser Push Permission Status */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100 text-xs">
              <div>
                <strong className="text-stone-800 font-bold block">브라우저 푸시 알림</strong>
                <p className="text-stone-500">
                  {permissionStatus === 'granted'
                    ? '✅ 푸시 알림 허용됨 (시간이 되면 시스템 알림 전송)'
                    : permissionStatus === 'denied'
                    ? '⚠️ 브라우저 설정에서 알림이 차단되어 있습니다.'
                    : '앱을 켜두지 않아도 알림을 받으려면 권한 허용이 필요합니다.'}
                </p>
              </div>

              {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                <button
                  type="button"
                  onClick={handleRequestPushPermission}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-sm whitespace-nowrap"
                >
                  권한 허용하기
                </button>
              )}
            </div>

            {/* Notification Toggles */}
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 cursor-pointer">
                <div>
                  <strong className="text-stone-800 font-bold block">정시 화면 시각 알림 (배너 & 팝업)</strong>
                  <span className="text-stone-500">설정된 복약 시간이 되면 상단에 눈에 띄는 알림 배너를 띄웁니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 cursor-pointer">
                <div>
                  <strong className="text-stone-800 font-bold block">음성 안내 및 맑은 챠임벨 재생</strong>
                  <span className="text-stone-500">알림 시 할머니를 부르는 한국어 목소리와 따뜻한 차임 소리를 울립니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Grandma Name & Guardian Phone */}
          <div className="space-y-3 bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-stone-700" />
              <span>환자 및 보호자 정보</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-1">어르신 성함</label>
                <input
                  type="text"
                  value={grandmaName}
                  onChange={(e) => setGrandmaName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 outline-none focus:border-rose-500"
                  placeholder="예: 김순자"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">손주/보호자 연락처</label>
                <input
                  type="text"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 outline-none focus:border-rose-500"
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl border border-stone-300 text-stone-600 font-bold text-sm hover:bg-stone-100 transition"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition"
            >
              <Check className="w-5 h-5" />
              <span>{savedSuccess ? '설정 저장 완료!' : '맞춤 알림 설정 저장하기'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
