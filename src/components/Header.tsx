import React from 'react';
import { SeniorSettings } from '../types/prescription';
import { Volume2, VolumeX, Eye, Sparkles, User, Calendar, Bell, Settings as SettingsIcon } from 'lucide-react';
import { speakGrandmaNotice } from '../utils/prescriptionHelper';

interface HeaderProps {
  settings: SeniorSettings;
  onUpdateSettings: (newSettings: Partial<SeniorSettings>) => void;
  activeTab: 'today' | 'scanner' | 'refill' | 'guardian' | 'all';
  onSelectTab: (tab: 'today' | 'scanner' | 'refill' | 'guardian' | 'all') => void;
  urgentRefillCount: number;
  simulatedDayOffset: number;
  onSetSimulatedDayOffset: (offset: number) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  activeTab,
  onSelectTab,
  urgentRefillCount,
  simulatedDayOffset,
  onSetSimulatedDayOffset,
  onOpenSettings,
}) => {
  const handleTestVoice = () => {
    speakGrandmaNotice(
      `안녕하세요, ${settings.grandmaName} 할머니! 효도약통입니다. 오늘 드셔야 할 약을 잊지 않도록 정성껏 알려드릴게요!`
    );
  };

  return (
    <header className="bg-white border-b border-rose-100 shadow-sm sticky top-0 z-30">
      {/* Top Notification / Demo Bar for Midterm Project Evaluation */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-3 py-1.5 text-xs sm:text-sm font-medium flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full font-bold text-[11px] uppercase tracking-wide">
            🎓 중간고사 프로젝트 시연
          </span>
          <span className="hidden sm:inline">
            중요 약물(고혈압약) 3일 전 재처방 알림 시연:
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSetSimulatedDayOffset(-27)}
            className={`px-2 py-0.5 rounded text-xs transition ${
              simulatedDayOffset === -27
                ? 'bg-white text-rose-700 font-bold shadow'
                : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
            title="고혈압약 30일분 중 27일 경과 -> 정확히 잔여 3일(D-3) 재처방 경보 발동 시점!"
          >
            🚨 D-3 (재처방 알림일)
          </button>
          <button
            onClick={() => onSetSimulatedDayOffset(-29)}
            className={`px-2 py-0.5 rounded text-xs transition ${
              simulatedDayOffset === -29
                ? 'bg-white text-rose-700 font-bold shadow'
                : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
            title="고혈압약 잔여 1일"
          >
            ⚠️ D-1 (내일 소진)
          </button>
          <button
            onClick={() => onSetSimulatedDayOffset(-30)}
            className={`px-2 py-0.5 rounded text-xs transition ${
              simulatedDayOffset === -30
                ? 'bg-white text-rose-700 font-bold shadow'
                : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
            title="고혈압약 잔여 0일 (완전 소진)"
          >
            🛑 D-DAY (약 소진)
          </button>
          <button
            onClick={() => onSetSimulatedDayOffset(-10)}
            className={`px-2 py-0.5 rounded text-xs transition ${
              simulatedDayOffset === -10
                ? 'bg-white text-rose-700 font-bold shadow'
                : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
            title="잔여 20일 (안전 복용 기간)"
          >
            ✅ D-20 (여유 기간)
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Grandma Profile */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <span className="text-2xl" role="img" aria-label="pill">💊</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight">
                효도약통
              </h1>
              <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-semibold border border-rose-200">
                어르신 안심 케어
              </span>
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5 text-rose-500" />
              <strong className="text-stone-700">{settings.grandmaName} 할머니</strong> 전용 복약 수첩
            </p>
          </div>
        </div>

        {/* Senior Accessibility Controls (Font Size, Contrast, Voice) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Font Size Toggle */}
          <div className="bg-stone-100 rounded-xl p-1 flex items-center gap-1 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 px-1.5 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> 글자
            </span>
            <button
              onClick={() => onUpdateSettings({ fontSize: 'normal' })}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                settings.fontSize === 'normal'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              보통
            </button>
            <button
              onClick={() => onUpdateSettings({ fontSize: 'large' })}
              className={`px-2.5 py-1 rounded-lg text-sm font-bold transition ${
                settings.fontSize === 'large'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              크게
            </button>
            <button
              onClick={() => onUpdateSettings({ fontSize: 'huge' })}
              className={`px-2.5 py-1 rounded-lg text-base font-extrabold transition ${
                settings.fontSize === 'huge'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="시력이 약한 어르신을 위한 특대 글자"
            >
              특대
            </button>
          </div>

          {/* Voice Sound Toggle & Test */}
          <button
            onClick={() => {
              const nextVal = !settings.soundEnabled;
              onUpdateSettings({ soundEnabled: nextVal });
              if (nextVal) handleTestVoice();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition ${
              settings.soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-stone-100 border-stone-200 text-stone-400 hover:bg-stone-200'
            }`}
            title="복약 시간과 약 이름을 소리로 읽어드립니다"
          >
            {settings.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>음성 켜짐</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>음성 끔</span>
              </>
            )}
          </button>

          {/* Custom Dose Time & Alert Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-stone-700 hover:text-rose-700 text-xs sm:text-sm font-bold shadow-sm transition"
            title="아침, 점심, 저녁 복약 시간 커스텀 및 알림 설정"
          >
            <Bell className="w-4 h-4 text-rose-500 animate-wiggle" />
            <span>알림 시간 설정</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-4 flex border-t border-stone-100 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectTab('today')}
          className={`py-3 px-4 font-bold text-sm sm:text-base border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'today'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>💊 오늘의 복약표</span>
        </button>

        <button
          onClick={() => onSelectTab('scanner')}
          className={`py-3 px-4 font-bold text-sm sm:text-base border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'scanner'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>📸 약봉투 AI 스캔 등록</span>
        </button>

        <button
          onClick={() => onSelectTab('refill')}
          className={`py-3 px-4 font-bold text-sm sm:text-base border-b-2 flex items-center gap-2 whitespace-nowrap transition relative ${
            activeTab === 'refill'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>🚨 3일전 재처방 알리미</span>
          {urgentRefillCount > 0 && (
            <span className="w-5 h-5 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center font-black animate-bounce shadow">
              {urgentRefillCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('guardian')}
          className={`py-3 px-4 font-bold text-sm sm:text-base border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'guardian'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>👨‍👩‍👧 손주/보호자 안심방</span>
        </button>

        <button
          onClick={() => onSelectTab('all')}
          className={`py-3 px-4 font-bold text-sm sm:text-base border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'all'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>전체 처방전 목록</span>
        </button>
      </div>
    </header>
  );
};
