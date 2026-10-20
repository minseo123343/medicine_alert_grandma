import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Prescription analysis endpoint
app.post('/api/analyze-prescription', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', patientName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '약봉투 또는 처방전 이미지 데이터가 필요합니다.' });
    }

    // Clean base64 string if data URI scheme was included
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const promptText = `
당신은 어르신(할머니, 할아버지)을 위한 친절하고 꼼꼼한 전문 복약 지도 AI 약사입니다.
제공된 한국의 약봉투, 약포지, 처방전 또는 복약 안내문 이미지를 정밀 분석하여 JSON 형식으로 추출해주세요.

특히 매우 중요한 지침:
1. **만성질환 및 필수 약물 식별 (isCritical)**:
   - 고혈압(혈압약, 노바스크, 아모디핀, 카나브, 트윈스타 등)
   - 당뇨병(혈당강하제, 메트포르민, 자누비아 등)
   - 심장/부정맥/협심증/뇌혈관/항혈전제(아스피린, 플라빅스, 와파린 등)
   - 갑상선 질환 약물
   - 이와 같이 임의로 복용을 중단하거나 약이 떨어지면 심각한 위험(뇌졸중, 심근경색, 급격한 혈압 상승 등)을 초래하는 약물은 반드시 \`isCritical: true\`로 지정하고, \`criticalReason\`에 어르신과 보호자가 이해하기 쉬운 이유(예: "고혈압약은 중단 시 혈압이 급상승할 수 있어 약이 떨어지기 3일 전에 미리 병원을 방문해 재처방받아야 합니다.")를 친절하게 적어주세요.
   - 단순 감기약, 소화제, 진통소염제, 영양제 등 일시적 복용 약물은 \`isCritical: false\`로 설정하세요.

2. **복용 타이밍 및 방법**:
   - 아침, 점심, 저녁, 취침전 복용 여부를 boolean 값으로 정확히 구분하세요.
   - 식전/식후/공복 등 복약 지침을 추출하세요.

3. **처방 정보**:
   - 조제약국명 또는 처방 병원명
   - 환자명 (이미지 내 표기 또는 전달된 환자명: ${patientName || '김순자 어르신'})
   - 처방/조제 일자 (YYYY-MM-DD 형식, 확인 불가 시 오늘 날짜 기준)
   - 총 투약 일수 (durationDays, 예: 30일분이면 30, 14일분이면 14)
   - 알약의 생김새(색상, 모양, 각인 등 어르신이 봉투에서 구분하기 쉬운 특징)

4. **친절한 할머니 맞춤 복약 당부말씀 (doctorAdvice)**:
   - 할머니께서 들으셨을 때 안심되고 기억하기 쉬운 따뜻하고 공손한 복약 멘트 (2~3문장).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pharmacyOrHospital: { type: Type.STRING, description: '조제약국 또는 처방병원 이름' },
            patientName: { type: Type.STRING, description: '환자 이름' },
            prescriptionDate: { type: Type.STRING, description: '처방/조제 날짜 (YYYY-MM-DD)' },
            durationDays: { type: Type.INTEGER, description: '총 처방 일수 (예: 30)' },
            refillNoticeDaysBefore: { type: Type.INTEGER, description: '약 소진 전 재처방 권장 알림 일수 (보통 3)' },
            doctorAdvice: { type: Type.STRING, description: '어르신을 위한 다정한 복약 조언과 격려' },
            cautionNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '주의사항 목록 (예: 자몽주스 섭취 금지, 어지러움 주의 등)'
            },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: '약품명' },
                  category: { type: Type.STRING, description: '약물 분류/효능 (예: 고혈압 치료제, 위점막 보호제)' },
                  isCritical: { type: Type.BOOLEAN, description: '고혈압/당뇨 등 절대 떨어지면 안 되는 필수 약물 여부' },
                  criticalReason: { type: Type.STRING, description: '필수 약물인 이유 및 재처방 필요성 설명' },
                  dosage: { type: Type.STRING, description: '1회 투약량 (예: 1회 1정)' },
                  timing: {
                    type: Type.OBJECT,
                    properties: {
                      morning: { type: Type.BOOLEAN },
                      lunch: { type: Type.BOOLEAN },
                      dinner: { type: Type.BOOLEAN },
                      bedtime: { type: Type.BOOLEAN },
                    },
                    required: ['morning', 'lunch', 'dinner', 'bedtime'],
                  },
                  instructions: { type: Type.STRING, description: '복용법 (예: 아침 식후 30분, 미온수로 복용)' },
                  precautions: { type: Type.STRING, description: '개별 약물 주의사항' },
                  pillShape: { type: Type.STRING, description: '알약 생김새 묘사 (예: 흰색 팔각형 정제, 노란 캡슐 등)' },
                },
                required: ['name', 'category', 'isCritical', 'dosage', 'timing', 'instructions'],
              },
            },
          },
          required: ['pharmacyOrHospital', 'prescriptionDate', 'durationDays', 'medicines', 'doctorAdvice'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error analyzing prescription with Gemini:', error);
    return res.status(500).json({
      error: '약봉투 분석 중 오류가 발생했습니다.',
      details: error?.message || String(error),
    });
  }
});

// Voice TTS proxy or text advisor endpoint if needed
app.post('/api/consult-pharmacist', async (req, res) => {
  try {
    const { question, currentMeds } = req.body;
    const prompt = `
당신은 할머니의 건강을 챙겨드리는 다정하고 따뜻한 복약 지도 전문 약사 '효도약사'입니다.
현재 할머니가 복용 중이신 약 목록: ${JSON.stringify(currentMeds || [])}
할머니 또는 보호자의 질문: "${question}"

할머니께서 쉽게 이해하실 수 있도록 큰 글씨로 읽히는 따뜻하고 명확하며 쉬운 한국어로 답변해주세요.
반드시 응급 증상일 경우 병원 방문을 권고하고, 고혈압약 등 필수약의 규칙적 복용을 강조해주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, answer: response.text });
  } catch (error: any) {
    console.error('Pharmacist consult error:', error);
    res.status(500).json({ error: error?.message || '답변 생성 실패' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[효도약통] Server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
