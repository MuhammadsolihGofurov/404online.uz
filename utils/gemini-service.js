import { GoogleGenerativeAI } from "@google/generative-ai";

// MUHIM: API Keyni .env faylga oling!
const API_KEY = "AIzaSyBSCjmAEKoVgwoQCuUvHIiae-QI90s4IDc";
const genAI = new GoogleGenerativeAI(API_KEY);

export const scanIELTSWithGemini = async (images) => {
  try {
    // Ba'zi SDK versiyalarida 'models/' prefiksi kerak bo'ladi
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const imageParts = await Promise.all(
      images.map(async (file) => {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(file);
        });
        return {
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        };
      })
    );

    const prompt = `
      Analyze these IELTS MCQ questions from the images. 
      Return ONLY a raw JSON array of objects.
      NO markdown, NO code blocks, NO text before or after JSON.
      
      Format:
      [
        {
          "question_number": 1,
          "text": "The text with {{gap_1}}",
          "options": ["text1", "text2", "text3"],
          "answer": "A"
        }
      ]
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();

    // Har qanday holatda ham JSONni tozalab olish (Extra safety)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("JSON topilmadi");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    // 404 xatosi davom etsa, console.log(error) qilib batafsil ko'ring
    console.error("Detailed Error:", error);
    throw error;
  }
};
