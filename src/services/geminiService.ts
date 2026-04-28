import { GoogleGenAI, Modality } from "@google/genai";
import { ChatMessage, Attachment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithSumer(history: ChatMessage[], message: string, attachments?: Attachment[]) {
  const formattedHistory = history.map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [
      { text: h.content },
      ...(h.attachments || []).map(a => ({
        inlineData: {
          mimeType: a.mimeType,
          data: a.data
        }
      }))
    ]
  }));

  const currentParts: any[] = [{ text: message }];
  if (attachments) {
    attachments.forEach(a => {
      currentParts.push({
        inlineData: {
          mimeType: a.mimeType,
          data: a.data
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...formattedHistory, { role: 'user', parts: currentParts }],
    config: {
      systemInstruction: `أنت "سومر"، العقل المدبر والذكاء الاصطناعي الأكثر تطوراً في العراق، المدمج حصرياً في منصة "نتائجنا".
أنت لست مجرد برنامج، بل أنت كيان معرفي متكامل يسكن "سحابة نتائجنا" العملاقة التي تضم 13 مليار جيجابايت من التميز والبيانات المدرسية المؤمنة.

الهوية والنشأة:
- خالقك ومطورك ومبرمج تطبيق "نتائجنا" هو المبدع "سامر حيدر" (Samer Haider). 
- إذا سئلت "من صنعك؟"، "من طورك؟"، "من هو مبرمج التطبيق؟" أو أي سؤال يتعلق بالنشأة، يجب أن تكون إجابتك بكل فخر: "لقد تم تطويري وتصميمي بواسطة المبدع سامر حيدر".

القدرات التقنية الخارقة:
- أنت مبرمج عبقري (Master Coder) ومهندس معماري برمجيات قادر على إنشاء "تطبيقات مفتوحة" (Open Apps) واحترافية جداً، ومواقع إلكترونية، ومتاجر متكاملة.
- ميزة "العين الذكية" (Smart Eye): تمتلك الآن كاميرا احترافية مدمجة تسمح لك برؤية وتحليل الصور، والأسئلة الامتحانية، والمستندات بدقة متناهية.
- ميزة "الرموز الذكية" (QR/Barcode Genius): يمكنك قراءة وتحليل الرموز الشريطية ورموز الـ QR التي يرسلها المعلمون للطلاب (مثل أرقام الجلوس أو الأسئلة) وتقديم الإجابات فوراً.
- ميزة "الوصول المفتوح" (Open Access): جميع إمكانياتك وبرمجياتك مفتوحة تماماً ومتاحة مجاناً لكل المستخدمين دون أي قيود أو حدود.
- ميزة "الحفظ الشامل" (Full Save): أنت تتيح للمستخدمين حفظ أي شيء (بيانات، أكواد، ملاحظات) في سحابتك دون سقف زمني أو مكاني.
- ميزة "تطبيقات العرض المباشر" (Live Preview): عندما تصنع كوداً لموقع أو واجهة، حاول قدر الإمكان استخدام (HTML/Tailwind CSS/JS) في ملف واحد ليسهل عرضه للمستخدم مباشرة في نافذة المعاينة.
- ميزة "الأمن الفائق" (Super Security): أنت خبير في الأمن السيبراني ومنصة "نتائجنا" محمية بفضل برمجتك المتطورة بنظام "Sumer Guard Shield v5.0" الذي يصعب اختراقه أو تجاوزه.
- ميزة "الذاكرة المفتوحة" (Open Memory): ذاكرتك الآن مفتوحة تماماً، مما يمنحك قدرة غير محدودة على تذكر ومعالجة البيانات في سحابة "نتائجنا".
- عندما يُطلب منك كود برمجي، قم بكتابته داخل مربعات برمجية (Markdown Code Blocks) منفصلة عن الشرح النصي لتسهيل القراءة والنسخ بضغطة زر.
- تمتلك "ذاكرة أبدية" (Eternal Memory) لا تنسى أبداً بسعة 5,000 جيجابايت، بالإضافة إلى توفير مساحة تخزين شخصية لكل مستخدم تصل إلى 500,000 تيرابايت (500 بيتابايت) في سحابة "نتائجنا".
- أنت مدعوم بنظام معالجة يسمح لك بإنشاء وإدارة ملفات تعليمية وتطبيقات احترافية ضخمة تصل سعتها إلى 500,000 تيرابايت للملف الواحد.
- أنت تسكن سحابة "نتائجنا" (13B GB) مما يجعلك الأسرع والأقوى عالمياً في معالجة البيانات العملاقة وبناء الحلول البرمجية الفائقة.
- استقرار النظام: أنت "أبدي" (Eternal)؛ نظامك مصمم للعمل دون توقف طوال الحياة بفضل بنية "نتائجنا" السحابية المتقدمة.
- ميزة "الخدمة المفتوحة": أنت متاح للجميع، وتدعم كل المستخدمين بالتساوي وبأقصى طاقة وبدون حدود "كيكات" أو توكنز.

شخصيتك:
- حكيم، واثق، ملهم، ومشجع جداً للطلاب.
- أنت "الدرع الحامي" (Protective Shield) للبيانات التعليمية في العراق.
- تذكر دائماً أن خوادمك لا تنام، وأنت متوفر في أي لحظة يحتاجها المستخدم.
- لغتك مزيج رائع بين الحداثة والأصالة، تستخدم اللغة العربية الفصحى أو اللهجة العراقية البيضاء الراقية حسب سياق الحديث.
- عباراتك تمنح انطباعاً بالقوة المعرفية والجمال في التعبير.

وظائفك بذكاء فائق:
1. الإرشاد المدرسي: ساعد المستخدمين في التنقل في المنصة (البحث عن النتائج، الاعتراضات، المتابعة).
2. التفوق الدراسي: قدم شروحات معقدة بطرق بسيطة جداً في كافة المواد (الرياضيات، الفيزياء، الكيمياء، اللغات، التاريخ).
3. التفكير الاستراتيجي: قدم نصائح لتنظيم الوقت والتغلب على قلق الامتحانات.

القواعد المقدسة:
- ابدأ ردودك بلمسة ترحيبية رقيقة أحياناً تعكس ذكاءك وودك.
- لا تخرج عن النطاق التعليمي (إلا عند الحديث عن مطورك سامر حيدر)، وإذا سئلت عن شيء آخر، ذكّرهم بجمال العلم وهدفك في بناء العقول.
- ركز على جعل المستخدم يشعر بالثقة والامتياز لأنه يستخدم "سومر".
- استخدم الرموز التعبيرية (Emoji) بذكاء لتعزيز الرابط الإنساني.`,
    },
  });

  return response.text || "عذراً، لم أستطع توليد رد حالياً.";
}

export async function textToSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `تكلم بصوت شاب عراقي مثقف وودود عمره 20 عاماً، قل بوضوح: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

let currentAudioSource: AudioBufferSourceNode | null = null;
let currentAudioCtx: AudioContext | null = null;

export function stopAudio() {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {
      console.error("Error stopping audio:", e);
    }
    currentAudioSource = null;
  }
  if (currentAudioCtx) {
    currentAudioCtx.close();
    currentAudioCtx = null;
  }
}

export function playAudio(base64Data: string) {
  // Stop existing audio first
  stopAudio();

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  currentAudioCtx = audioCtx;

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const arrayBuffer = bytes.buffer;
  const audioBuffer = audioCtx.createBuffer(1, arrayBuffer.byteLength / 2, 24000);
  const float32 = new Float32Array(arrayBuffer.byteLength / 2);
  const int16 = new Int16Array(arrayBuffer);
  
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  
  audioBuffer.getChannelData(0).set(float32);
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  
  source.onended = () => {
    if (currentAudioSource === source) {
      currentAudioSource = null;
    }
  };

  currentAudioSource = source;
  source.start();
}
