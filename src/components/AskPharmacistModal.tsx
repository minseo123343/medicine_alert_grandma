import React, { useState } from 'react';
import { Prescription, SeniorSettings } from '../types/prescription';
import { MessageSquare, Sparkles, Volume2, X, Send, HeartHandshake } from 'lucide-react';
import { speakGrandmaNotice } from '../utils/prescriptionHelper';

interface AskPharmacistModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptions: Prescription[];
  settings: SeniorSettings;
}

export const AskPharmacistModal: React.FC<AskPharmacistModalProps> = ({
  isOpen,
  onClose,
  prescriptions,
  settings,
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const currentMeds = prescriptions.flatMap((rx) =>
    rx.medicines.map((m) => ({ name: m.name, category: m.category, isCritical: m.isCritical }))
  );

  const sampleQuestions = [
    '고혈압약을 아침에 깜빡 잊었을 때는 어떻게 해야 하나요?',
    '고혈압약과 관절염 진통제를 함께 먹어도 괜찮은가요?',
    '약이 3일치 남았는데 병원에 미리 가도 새로 처방해주나요?',
    '혈압약을 먹을 때 자몽이나 커피를 마시면 안 되나요?',
  ];

  const handleAsk = async (qText: string) => {
    const targetQ = qText || question;
    if (!targetQ.trim()) return;

    setIsLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/consult-pharmacist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: targetQ,
          currentMeds,
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
        if (settings.soundEnabled) {
          speakGrandmaNotice(data.answer);
        }
      } else {
        setAnswer(
          '할머니, 고혈압약은 하루라도 끊기면 안 됩니다. 복용을 잊으셨을 때는 생각난 즉시 드시되, 다음 복용 시간이 가깝다면 2회분을 한 번에 드시면 안 됩니다. 약이 3일 남았을 때 꼭 병원에 가셔서 재처방받으세요!'
        );
      }
    } catch (e) {
      // Graceful fallback response
      setAnswer(
        '할머니, 고혈압약은 혈압을 안정적으로 유지해주는 소중한 약입니다. 복용을 잊으셨을 때는 생각난 즉시 드시되, 다음 복용 시간이 가깝다면 2회분을 한 번에 드시면 안 됩니다. 약이 3일 남았을 때 꼭 병원에 가셔서 재처방받으세요!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceReadAnswer = () => {
    if (answer) speakGrandmaNotice(answer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-rose-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">AI 효도약사 복약 상담실</h2>
              <p className="text-xs text-emerald-100">
                할머니께서 복용 중인 약을 기준으로 알기 쉽게 답변해 드립니다.
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

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Question Chips */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              💡 할머니들이 자주 묻는 질문
            </label>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 border border-stone-200 transition text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
              placeholder="궁금한 점을 자유롭게 입력해보세요 (예: 고혈압약 질문)"
              className="flex-1 border-2 border-stone-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm outline-none transition"
            />
            <button
              onClick={() => handleAsk(question)}
              disabled={isLoading || !question.trim()}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 text-white font-black text-sm flex items-center gap-1.5 shadow transition"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>질문하기</span>
            </button>
          </div>

          {/* Answer Display */}
          {answer && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-200">
                  🩺 효도약사 답변
                </span>
                <button
                  onClick={handleVoiceReadAnswer}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-xl shadow-sm border border-emerald-200 hover:bg-emerald-100"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>소리로 듣기</span>
                </button>
              </div>
              <p className="text-stone-800 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
