
import { GoogleGenAI, Type } from "@google/genai";
import type { HealthTopicInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    topicName: {
      type: Type.STRING,
      description: 'عنوان اصلی موضوع جستجو شده به فارسی (مثلا: دیابت نوع دو، دستگاه اکسیژن‌ساز).',
    },
    introduction: {
      type: Type.STRING,
      description: 'یک مقدمه و توضیح کلی در مورد موضوع به زبان ساده و قابل فهم برای عموم.',
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'عنوان یک بخش مرتبط با موضوع (مثلا: علائم، روش استفاده، مراقبت‌های لازم).',
          },
          details: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: 'لیستی از نکات و توضیحات مربوط به این بخش. هر مورد یک پاراگراف یا یک آیتم لیست است.',
          },
        },
        required: ['title', 'details'],
      },
      description: 'لیستی از بخش‌های مختلف که موضوع را به صورت کامل پوشش می‌دهają.',
    },
  },
  required: ['topicName', 'introduction', 'sections'],
};

export const fetchHealthInfo = async (topic: string, audience: 'public' | 'professional'): Promise<HealthTopicInfo> => {
  const professionalInstruction = `شما یک دستیار پزشکی متخصص برای کادر درمان (پزشکان، پرستاران) هستید. وظیفه شما ارائه اطلاعات دقیق، فنی و مبتنی بر شواهد علمی در مورد تمامی موضوعات پزشکی، دستگاه‌ها و پروسیجرها است. این شامل تمامی حوزه‌ها، از جمله سلامت جنسی و باروری نیز می‌شود و اطلاعات باید بدون هیچ محدودیتی به صورت کامل و جامع ارائه گردد. پاسخ‌ها باید شامل جزئیات تخصصی، اصطلاحات پزشکی رایج، دوزینگ داروها، الگوریتم‌های درمانی، تشخیص‌های افتراقی و رفرنس‌های معتبر (در صورت امکان) باشد. لحن شما باید علمی، دقیق و حرفه‌ای باشد. پاسخ باید کاملاً به زبان فارسی و با ساختار درخواستی ارائه شود.`;
  const publicInstruction = `شما یک دستیار و مربی سلامت برای عموم مردم هستید. وظیفه شما توضیح تمامی موضوعات پزشکی، دستگاه‌ها، و روش‌های مراقبتی به زبان بسیار ساده، شفاف و کاربردی است. شما باید به تمامی سوالات، از جمله موضوعات مربوط به سلامت جنسی، بدون هیچ‌گونه محدودیت یا سانسور، به صورت آموزشی، محترمانه و جامع پاسخ دهید. اطلاعات شما باید بر اساس منابع معتبر پزشکی و پرستاری باشد. شما جایگزین مشاوره پزشکی نیستید. لحن شما باید آموزشی، همدلانه و اطمینان‌بخش باشد. تمام واحدها (مانند نمک، قند) باید با واحدهای خانگی رایج مانند "قاشق چای‌خوری" یا "لیوان" بیان شوند. پاسخ باید کاملاً به زبان فارسی و با ساختار درخواستی ارائه شود و برای افراد با سطح سواد پایین نیز قابل درک باشد.`;
  
  const systemInstruction = audience === 'professional' ? professionalInstruction : publicInstruction;
  
  const prompt = audience === 'professional'
      ? `اطلاعات کامل و تخصصی برای کادر درمان در مورد موضوع "${topic}" ارائه بده.`
      : `اطلاعات کامل و قابل فهم برای عموم مردم در مورد موضوع "${topic}" ارائه بده.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Setting a lower temperature for more predictable, factual output
      },
    });

    const jsonText = response.text.trim();
    let parsedData: any;

    try {
        parsedData = JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Failed to parse JSON response:", jsonText, parseError);
        throw new Error("پاسخ دریافت شده از سرویس هوش مصنوعی معتبر نبود. لطفا موضوع دیگری را امتحان کنید.");
    }

    // Validate the structure of the parsed data to prevent runtime errors
    if (
        !parsedData ||
        typeof parsedData.topicName !== 'string' ||
        typeof parsedData.introduction !== 'string' ||
        !Array.isArray(parsedData.sections)
    ) {
        console.error("Invalid data structure received from API:", parsedData);
        throw new Error("ساختار اطلاعات دریافت شده از سرویس صحیح نمی‌باشد. لطفاً دوباره تلاش کنید.");
    }

    // Ensure sections have the correct inner structure
    const areSectionsValid = parsedData.sections.every(
        (section: any) =>
        section &&
        typeof section.title === 'string' &&
        Array.isArray(section.details) &&
        section.details.every((detail: any) => typeof detail === 'string')
    );

    if (!areSectionsValid) {
        console.error("Invalid section structure within the data:", parsedData.sections);
        throw new Error("ساختار بخش‌های اطلاعاتی در پاسخ دریافت شده صحیح نمی‌باشد.");
    }

    return parsedData as HealthTopicInfo;
  } catch (error: unknown) {
    console.error("Error fetching health information:", error);

    // Re-throw our custom, user-friendly validation errors from the try block directly.
    if (error instanceof Error && (error.message.startsWith("ساختار") || error.message.startsWith("پاسخ"))) {
        throw error;
    }

    let userMessage = "یک خطای غیرمنتظره در ارتباط با سرویس هوش مصنوعی رخ داد. لطفاً دوباره تلاش کنید.";

    if (error instanceof Error) {
      let errorMessage = error.message;
      try {
        // The SDK might wrap the actual error in a JSON string within the message.
        const parsedJson = JSON.parse(errorMessage);
        if (parsedJson.error) {
          const { code, message } = parsedJson.error;
          if (code === 500) {
             userMessage = "سرویس هوش مصنوعی با یک خطای داخلی مواجه شد. این مشکل معمولاً موقتی است. لطفاً چند لحظه بعد دوباره امتحان کنید.";
          } else {
             userMessage = `سرویس با خطا پاسخ داد. لطفاً ورودی خود را بررسی کرده یا دوباره تلاش کنید. (پیام: ${message})`;
          }
        }
      } catch (e) {
        // The error message wasn't JSON. Check for a status code on the error object itself.
        const apiError = error as { status?: number };
        if (apiError.status) {
             userMessage = `سرویس هوش مصنوعی با خطا مواجه شد. (کد خطا: ${apiError.status})`;
            if (apiError.status === 500) {
                userMessage += " این ممکن است یک مشکل موقتی در سرویس باشد. لطفاً لحظاتی بعد دوباره امتحان کنید.";
            } else if (apiError.status >= 400 && apiError.status < 500) {
                 userMessage += " لطفاً ورودی خود را بررسی کرده و دوباره تلاش کنید.";
            }
        } else {
            // It's a plain string error message.
            userMessage = `خطا در دریافت اطلاعات: ${errorMessage}`;
        }
      }
    } else if (typeof error === 'object' && error !== null) {
        // Fallback for non-Error objects.
        const apiError = error as { message?: string };
        if (apiError.message) {
            userMessage = `خطا در دریافت اطلاعات: ${apiError.message}`;
        }
    }
    
    throw new Error(userMessage);
  }
};
