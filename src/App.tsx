import React, { useState, useEffect, useRef } from 'react';
import { Prescription, DailyDoseLog, SeniorSettings, TimeSlot } from './types/prescription';
import { INITIAL_PRESCRIPTIONS } from './data/presetPrescriptions';
import { Header } from './components/Header';
import { RefillAlertBanner } from './components/RefillAlertBanner';
import { TodayScheduleView } from './components/TodayScheduleView';
import { RefillManagementView } from './components/RefillManagementView';
import { GuardianCareView } from './components/GuardianCareView';
import { PrescriptionScannerModal } from './components/PrescriptionScannerModal';
import { AskPharmacistModal } from './components/AskPharmacistModal';
import { SettingsModal } from './components/SettingsModal';
import { VisualAlertToast } from './components/VisualAlertToast';
import {
  calculateRefillStatus,
  formatDate,
  speakGrandmaNotice,
  playChimeSound,
  TIME_SLOT_INFO,
  formatTimeLabel,
} from './utils/prescriptionHelper';
import { Camera, MessageSquare, Plus, RefreshCw, Trash2, Calendar, Phone, ShieldAlert, Sparkles, Bell } from 'lucide-react';

const LOCAL_STORAGE_KEY_RX = 'carepill_prescriptions_v1';
const LOCAL_STORAGE_KEY_LOGS = 'carepill_dose_logs_v1';
const LOCAL_STORAGE_KEY_SETTINGS = 'carepill_settings_v1';

export default function App() {
  // Load Prescriptions from LocalStorage or use realistic Initial presets
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RX);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved prescriptions:', e);
    }
    return INITIAL_PRESCRIPTIONS;
  });

  // Senior Accessibility & Dose Time Settings
  const [settings, setSettings] = useState<SeniorSettings>(() => {
    const defaultSettings: SeniorSettings = {
      fontSize: 'large',
      highContrast: false,
      soundEnabled: true,
      guardianPhone: '010-9876-5432',
      grandmaName: '김순자',
      doseTimes: {
        morning: '08:00',
        lunch: '12:30',
        dinner: '18:30',
        bedtime: '21:30',
      },
      notificationsEnabled: true,
    };

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          doseTimes: {
            ...defaultSettings.doseTimes,
            ...(parsed.doseTimes || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
    return defaultSettings;
  });

  // Midterm presentation simulation offset:
  // -27 days offset means today is exactly Day 27 of the 30-day prescription -> D-3 alert is active!
  const [simulatedDayOffset, setSimulatedDayOffset] = useState<number>(-27);

  // Compute simulated current date
  const getSimulatedDate = (): string => {
    const d = new Date();
    // In our initial setup, rx-hypertension started at -27 days ago from today.
    // So if simulatedDayOffset is -27, the current simulated date is "today".
    // If user shifts offset, we adjust accordingly.
    const diff = -27 - simulatedDayOffset;
    d.setDate(d.getDate() - diff);
    return formatDate(d);
  };

  const simulatedDate = getSimulatedDate();

  // Today's Dose Log
  const [doseLog, setDoseLog] = useState<DailyDoseLog>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayKey = formatDate();
        if (parsed[todayKey]) return parsed[todayKey];
      }
    } catch (e) {
      console.warn('Failed to parse dose logs:', e);
    }
    return {
      date: formatDate(),
      morning: { taken: false },
      lunch: { taken: false },
      dinner: { taken: false },
      bedtime: { taken: false },
    };
  });

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<'today' | 'scanner' | 'refill' | 'guardian' | 'all'>('today');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPharmacistOpen, setIsPharmacistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeAlertSlot, setActiveAlertSlot] = useState<TimeSlot | null>(null);

  // Prevent multiple alerts in the same minute
  const lastAlertMinuteRef = useRef<string>('');

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RX, JSON.stringify(prescriptions));
    } catch (e) {
      console.error('Error saving prescriptions to localStorage:', e);
    }
  }, [prescriptions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      const allLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LOGS) || '{}');
      allLogs[doseLog.date] = doseLog;
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(allLogs));
    } catch (e) {
      console.error('Error saving dose logs to localStorage:', e);
    }
  }, [doseLog]);

  // Trigger push/visual notification for a given slot
  const triggerNotificationForSlot = (slot: TimeSlot) => {
    setActiveAlertSlot(slot);
    playChimeSound();

    const info = TIME_SLOT_INFO[slot];
    const customTime = settings.doseTimes?.[slot] || info.defaultTime;
    const slotMeds = prescriptions.flatMap((rx) =>
      rx.medicines.filter((m) => m.timing[slot]).map((m) => m.name)
    );
    const medNames = slotMeds.join(', ') || '처방약';

    // Audio voice callout
    if (settings.soundEnabled) {
      speakGrandmaNotice(
        `${settings.grandmaName} 할머니! ${formatTimeLabel(customTime)} ${info.label} 드실 시간입니다. 오늘 약은 ${medNames}입니다. 꼭 챙겨 드세요!`
      );
    }

    // Browser Push Notification (if granted)
    if (
      settings.notificationsEnabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`[효도약통] ${info.label} 시간 (${formatTimeLabel(customTime)})`, {
          body: `${settings.grandmaName} 할머니, ${medNames}을(를) 물과 함께 챙겨드세요!`,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Browser push notification could not be dispatched:', e);
      }
    }
  };

  // Background interval for custom dose time checking
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkTimeMatch = () => {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMin = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMin}`;

      if (lastAlertMinuteRef.current === currentTimeStr) return;

      const slots: TimeSlot[] = ['morning', 'lunch', 'dinner', 'bedtime'];
      for (const slot of slots) {
        const configuredTime = settings.doseTimes?.[slot];
        if (configuredTime === currentTimeStr && !doseLog[slot]?.taken) {
          lastAlertMinuteRef.current = currentTimeStr;
          triggerNotificationForSlot(slot);
          break;
        }
      }
    };

    checkTimeMatch();
    const interval = setInterval(checkTimeMatch, 20000); // Check every 20 seconds
    return () => clearInterval(interval);
  }, [settings.doseTimes, settings.notificationsEnabled, doseLog, prescriptions]);

  // Toggle dose slot
  const handleToggleDoseSlot = (slot: TimeSlot) => {
    setDoseLog((prev) => {
      const currentSlot = prev[slot] || { taken: false };
      const nextTaken = !currentSlot.taken;
      const nowTime = nextTaken
        ? new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        : undefined;

      return {
        ...prev,
        [slot]: {
          taken: nextTaken,
          time: nowTime,
        },
      };
    });
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<SeniorSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Add new prescription from AI scanner
  const handleSavePrescription = (newRx: Prescription) => {
    setPrescriptions((prev) => [newRx, ...prev]);
    setActiveTab('today');
  };

  // Renew prescription (when Grandma visits hospital and gets fresh pack)
  const handleRenewPrescription = (prescriptionId: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) => {
        if (rx.id === prescriptionId) {
          return {
            ...rx,
            startDate: formatDate(),
          };
        }
        return rx;
      })
    );
    speakGrandmaNotice(
      `새 처방전 갱신이 완료되었습니다! 오늘부터 새로 처방일수가 계산되며, 다음번 약 소진 3일 전에도 잊지 않고 알려드릴게요!`
    );
  };

  // Delete prescription
  const handleDeletePrescription = (id: string) => {
    if (window.confirm('이 처방전을 목록에서 삭제하시겠습니까?')) {
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Reset to initial demo data
  const handleResetDemoData = () => {
    if (window.confirm('기본 시연용 샘플 처방전(고혈압약 3일전 알림 포함)으로 다시 초기화할까요?')) {
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setSimulatedDayOffset(-27);
      setDoseLog({
        date: formatDate(),
        morning: { taken: false },
        lunch: { taken: false },
        dinner: { taken: false },
        bedtime: { taken: false },
      });
      speakGrandmaNotice('시연용 기본 데이터로 초기화되었습니다.');
    }
  };

  // Calculate urgent refill count
  const urgentRefillCount = prescriptions.filter((rx) => {
    const status = calculateRefillStatus(rx, simulatedDate);
    return status.hasCriticalMedicine && (status.isUrgentRefill || status.isExpired);
  }).length;

  return (
    <div
      className={`min-h-screen bg-stone-100 font-sans text-stone-900 pb-28 ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'scanner') {
            setIsScannerOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        urgentRefillCount={urgentRefillCount}
        simulatedDayOffset={simulatedDayOffset}
        onSetSimulatedDayOffset={(offset) => setSimulatedDayOffset(offset)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Core 3-Day Refill Alert Banner (Always prominently visible when triggered) */}
        <RefillAlertBanner
          prescriptions={prescriptions}
          simulatedDate={simulatedDate}
          settings={settings}
          onNavigateToRefill={() => setActiveTab('refill')}
        />

        {/* Tab 1: Today's Schedule */}
        {activeTab === 'today' && (
          <TodayScheduleView
            prescriptions={prescriptions}
            doseLog={doseLog}
            onToggleDoseSlot={handleToggleDoseSlot}
            settings={settings}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Tab 2: Refill Management View */}
        {activeTab === 'refill' && (
          <RefillManagementView
            prescriptions={prescriptions}
            simulatedDate={simulatedDate}
            settings={settings}
            onOpenScanner={() => setIsScannerOpen(true)}
            onRenewPrescription={handleRenewPrescription}
          />
        )}

        {/* Tab 3: Guardian Care View */}
        {activeTab === 'guardian' && (
          <GuardianCareView
            prescriptions={prescriptions}
            doseLog={doseLog}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            simulatedDate={simulatedDate}
          />
        )}

        {/* Tab 4: All Prescriptions List */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200">
              <div>
                <h2 className="text-xl font-black text-stone-900">
                  {settings.grandmaName} 할머니의 전체 처방전 보관함 ({prescriptions.length}건)
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  병원과 약국에서 받은 처방전과 약봉투 기록입니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDemoData}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  title="기본 시연용 데이터로 초기화"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>시연 데이터 초기화</span>
                </button>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black rounded-xl flex items-center gap-1.5 shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>약봉투 스캔 추가</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx) => {
                const status = calculateRefillStatus(rx, simulatedDate);
                return (
                  <div
                    key={rx.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-lg text-stone-900">{rx.title}</h3>
                        {status.isUrgentRefill && (
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-xs font-black">
                            🚨 3일전 재처방 알림
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 font-medium">
                        🏥 {rx.hospitalOrPharmacy} | 시작일: {rx.startDate} | {rx.durationDays}일분 처방
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rx.medicines.map((m) => (
                          <span
                            key={m.id}
                            className={`text-xs px-2.5 py-1 rounded-xl font-bold ${
                              m.isCritical
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {m.name} {m.isCritical && '🚨필수'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRenewPrescription(rx.id)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>재처방 갱신</span>
                      </button>
                      <button
                        onClick={() => handleDeletePrescription(rx.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="처방전 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Buttons Bar at Bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 flex items-center justify-center gap-3">
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex-1 py-3.5 px-5 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-rose-300 hover:shadow-2xl transition transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5 text-amber-200 animate-pulse" />
          <span>약봉투 사진 AI 분석</span>
        </button>

        <button
          onClick={() => setIsPharmacistOpen(true)}
          className="py-3.5 px-4 sm:px-5 bg-white text-emerald-800 border-2 border-emerald-400 rounded-2xl font-black text-sm sm:text-base shadow-lg hover:bg-emerald-50 transition transform active:scale-95 flex items-center gap-2"
          title="복약 질문하기"
        >
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <span>효도약사 상담</span>
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="py-3.5 px-3.5 bg-white text-stone-700 border-2 border-stone-300 hover:border-rose-300 hover:text-rose-600 rounded-2xl font-black text-sm sm:text-base shadow-lg hover:bg-rose-50 transition transform active:scale-95 flex items-center justify-center"
          title="복약 시간 및 알림 설정"
        >
          <Bell className="w-5 h-5 text-rose-500" />
        </button>
      </div>

      {/* Prescription Scanner Modal */}
      <PrescriptionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSavePrescription={handleSavePrescription}
        grandmaName={settings.grandmaName}
      />

      {/* Ask Pharmacist Modal */}
      <AskPharmacistModal
        isOpen={isPharmacistOpen}
        onClose={() => setIsPharmacistOpen(false)}
        prescriptions={prescriptions}
        settings={settings}
      />

      {/* Custom Dose Time & Notification Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onTriggerTestNotification={(slot) => triggerNotificationForSlot(slot)}
      />

      {/* Real-Time Visual Medication Alert Toast */}
      {activeAlertSlot && (
        <VisualAlertToast
          slot={activeAlertSlot}
          prescriptions={prescriptions}
          settings={settings}
          onDismiss={() => setActiveAlertSlot(null)}
          onMarkAsTaken={(slot) => {
            handleToggleDoseSlot(slot);
            setActiveAlertSlot(null);
          }}
        />
      )}
    </div>
  );
}
