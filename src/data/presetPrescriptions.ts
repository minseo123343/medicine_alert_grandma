import { Prescription } from '../types/prescription';

// Helper to format date offset from today
export const getOffsetDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-hypertension-01',
    title: '서울내과의원 - 만성질환(고혈압/고지혈증) 30일 처방',
    hospitalOrPharmacy: '서울내과의원 (조제: 희망온누리약국)',
    patientName: '김순자',
    // 27일 전에 처방받은 것으로 설정하여 현재 잔여 일수가 정확히 3일(D-3)이 되도록 설정!
    // -> 사용자가 앱을 켜자마자 고혈압약 3일 전 재처방 알림 기능을 즉시 체감할 수 있습니다!
    startDate: getOffsetDate(-27),
    durationDays: 30,
    refillNoticeDaysBefore: 3,
    hospitalPhone: '02-888-1234',
    doctorAdvice: '할머니, 혈압약은 매일 아침 거르지 말고 꼭 드셔야 해요. 이제 약이 3일치밖에 안 남았으니 이번 주 안에 서울내과에 다시 오셔서 혈압 재고 새로 처방받으세요!',
    cautionNotes: [
      '자몽이나 자몽주스는 혈압약 작용을 과도하게 높이므로 함께 드시지 마세요.',
      '아침 기상 시 갑자기 일어나면 어지러울 수 있으니 천천히 일어나세요.',
    ],
    medicines: [
      {
        id: 'med-norvasc',
        name: '노바스크정 5mg (암로디핀)',
        category: '고혈압 치료제 (혈압강하제)',
        isCritical: true,
        criticalReason: '혈압약은 하루라도 중단하면 반동성 혈압 급상승으로 뇌졸중 위험이 있으므로, 약 소진 3일 전 반드시 병원에서 재처방을 받아야 합니다.',
        dosage: '1회 1정 (아침 식후 30분)',
        timing: { morning: true, lunch: false, dinner: false, bedtime: false },
        instructions: '아침 식후 30분 미온수와 함께 복용',
        precautions: '매일 일정한 시간에 복용, 복용 후 어지러움 주의',
        pillShape: '흰색 팔각형 정제 (앞면 N5 각인)',
        color: '#ef4444', // Red warning color
      },
      {
        id: 'med-lipitor',
        name: '리피토정 20mg (아토르바스타틴)',
        category: '고지혈증 치료제 (콜레스테롤 조절)',
        isCritical: true,
        criticalReason: '혈관 속 노폐물 축적을 막고 혈관을 보호하는 약으로 지속적인 복용이 필수적입니다.',
        dosage: '1회 1정 (저녁 식후)',
        timing: { morning: false, lunch: false, dinner: true, bedtime: false },
        instructions: '저녁 식후 또는 취침 전 복용',
        precautions: '간질환 환자 주의, 근육통 발생 시 의사 상담',
        pillShape: '흰색 타원형 정제',
        color: '#f97316',
      },
      {
        id: 'med-gastro',
        name: '스티렌투엑스정 (애엽추출물)',
        category: '위점막 보호제 (소화기계)',
        isCritical: false,
        criticalReason: '식사 후 속 쓰림 및 위점막을 보호해주는 보조 약제입니다.',
        dosage: '1회 1정 (아침, 저녁 식후)',
        timing: { morning: true, lunch: false, dinner: true, bedtime: false },
        instructions: '아침, 저녁 식사 후 바로 복용',
        precautions: '위장관 보호를 위해 식후 즉시 복용 권장',
        pillShape: '녹색 장방형 정제',
        color: '#10b981',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rx-orthopedics-02',
    title: '바른정형외과 - 퇴행성 관절염 14일 처방',
    hospitalOrPharmacy: '바른정형외과의원 (조제: 메디칼약국)',
    patientName: '김순자',
    startDate: getOffsetDate(-6),
    durationDays: 14,
    refillNoticeDaysBefore: 3,
    hospitalPhone: '02-777-5678',
    doctorAdvice: '무릎 통증을 줄여주는 소염진통제입니다. 위장 장애를 줄이기 위해 식사를 꼭 든든히 하신 뒤 드시고, 통증이 줄어도 처방 일수 동안은 꾸준히 드세요.',
    cautionNotes: ['속쓰림이 심해지면 복용을 멈추고 병원에 전화주세요.'],
    medicines: [
      {
        id: 'med-celebrex',
        name: '세레브렉스캡슐 200mg (세레콕시브)',
        category: '관절염 소염진통제',
        isCritical: false,
        criticalReason: '무릎 관절 염증과 통증을 가라앉히는 약물입니다.',
        dosage: '1회 1캡슐 (아침, 저녁 식후)',
        timing: { morning: true, lunch: false, dinner: true, bedtime: false },
        instructions: '식사 직후 충분한 물과 함께 복용',
        precautions: '속쓰림 발생 시 식사 직후 복용',
        pillShape: '흰색 캡슐 (노란색 띠 표시)',
        color: '#3b82f6',
      },
      {
        id: 'med-muscle',
        name: '에페리손정 50mg (근이완제)',
        category: '근육 이완제',
        isCritical: false,
        dosage: '1회 1정 (아침, 점심, 저녁)',
        timing: { morning: true, lunch: true, dinner: true, bedtime: false },
        instructions: '매 식후 30분 복용',
        precautions: '복용 후 졸음이 올 수 있으니 보행 시 낙상 주의',
        pillShape: '흰색 원형 당의정',
        color: '#6366f1',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export interface SampleBagPreset {
  id: string;
  badge: string;
  title: string;
  hospital: string;
  patient: string;
  duration: number;
  criticalNotice: string;
  imageThumbnail: string;
  sampleData: Prescription;
}

export const SAMPLE_BAG_PRESETS: SampleBagPreset[] = [
  {
    id: 'preset-1',
    badge: '고혈압 필수약 (재처방 알림 D-3 시연)',
    title: '서울내과 - 고혈압 & 고지혈증 만성질환 30일 처방',
    hospital: '서울내과의원',
    patient: '김순자 (78세)',
    duration: 30,
    criticalNotice: '⚠️ 노바스크(고혈압약) 잔여 3일! 3일 전 병원 재처방 골든타임 알림 발동',
    imageThumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    sampleData: INITIAL_PRESCRIPTIONS[0],
  },
  {
    id: 'preset-2',
    badge: '퇴행성 관절염 케어',
    title: '바른정형외과 - 무릎 관절염 & 소염진통 14일 처방',
    hospital: '바른정형외과의원',
    patient: '김순자 (78세)',
    duration: 14,
    criticalNotice: '위장보호제 함께 복용, 8일치 잔여 (안전 범위)',
    imageThumbnail: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
    sampleData: INITIAL_PRESCRIPTIONS[1],
  },
  {
    id: 'preset-3',
    badge: '당뇨 + 당뇨망막증 복합 처방',
    title: '연세세브란스 당뇨내분비센터 - 당뇨약 60일 장기 처방',
    hospital: '연세세브란스병원',
    patient: '김순자 (78세)',
    duration: 60,
    criticalNotice: '🚨 자누메트정(당뇨약) 절대 중단 금지! 혈당 급변 방지용 3일 전 병원 방문 알림 필수',
    imageThumbnail: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
    sampleData: {
      id: 'rx-diabetes-03',
      title: '연세세브란스 당뇨내분비센터 60일 정기 처방',
      hospitalOrPharmacy: '연세세브란스병원 (조제: 대학약국)',
      patientName: '김순자',
      startDate: getOffsetDate(-57), // Exactly 3 days left
      durationDays: 60,
      refillNoticeDaysBefore: 3,
      hospitalPhone: '02-2228-0114',
      doctorAdvice: '할머니, 당뇨약은 혈당이 정상이 되어도 끊으시면 안 됩니다. 약이 3일분 남았을 때 병원 내분비내과 예약일에 맞춰 꼭 진료받으세요!',
      cautionNotes: ['저혈당 증상(식은땀, 손떨림) 발생 시 사탕이나 주스를 드세요.'],
      medicines: [
        {
          id: 'med-janumet',
          name: '자누메트정 50/500mg (시타글립틴/메트포르민)',
          category: '당뇨병 치료제 (혈당조절제)',
          isCritical: true,
          criticalReason: '당뇨약은 임의 중단 시 급격한 고혈당성 혼수나 당뇨 합병증을 유발할 수 있으므로 약이 떨어지기 3일 전에 미리 재처방을 받아야 합니다.',
          dosage: '1회 1정 (아침, 저녁 식사 직후)',
          timing: { morning: true, lunch: false, dinner: true, bedtime: false },
          instructions: '식사 시작 직후 또는 식후 즉시 복용',
          precautions: '위장장애 예방 위해 공복 복용 금지',
          pillShape: '담황색 타원형 필름코팅정',
          color: '#e11d48',
        },
      ],
      createdAt: new Date().toISOString(),
    },
  },
];
