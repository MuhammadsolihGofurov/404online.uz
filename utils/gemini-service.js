import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY_GEMINI;
const genAI = new GoogleGenerativeAI(API_KEY);

export const scanIELTSWithGemini = async (images, question_type) => {
  try {
    const model = genAI.getGenerativeModel({
      // model: "gemini-3-flash-preview", // Hozircha barqaror versiya tavsiya etiladi
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Tasodifiylikni kamaytirib, aniqlikni oshiradi
      },
    });

    const imageParts = await Promise.all(
      images.map(async (file) => {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(file);
        });
        return {
          inlineData: { data: base64Data, mimeType: file.type },
        };
      })
    );

    let prompt = "";
    let promptInstruction =
      "Process the following IELTS image and extract the data into a structured JSON. Do not just cite the text, transform it into the requested schema.";

    // Savol turiga qarab promptni shakllantirish
    switch (question_type) {
      case "MCQ":
        prompt = `Analyze these IELTS MCQ questions from the images. 
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
      ]`;
        break;

      case "SENTENCE":
        prompt = `Analyze IELTS Sentence Completion/Table task. 
        Return ONLY a JSON object:
        {
          "full_text": "Text with {{8}} and {{9}} format for gaps",
          "questions": [
            { "number": 8, "answer": "correct word" },
            { "number": 9, "answer": "correct word" }
          ]
        }`;
        break;

      case "tfng":
        prompt = `Analyze IELTS True/False/Not Given questions.
        Return ONLY a JSON array:
        [
          {
            "question_number": 1,
            "text": "Statement text",
            "answer": "TRUE" 
          }
        ]`;
        break;

      case "matching":
        prompt = `Analyze IELTS Matching Information/Heading task.
        Return ONLY a JSON array:
        [
          {
            "question_number": 1,
            "text": "Description or Heading",
            "answer": "A"
          }
        ]`;
        break;

      case "SHORT_ANSWER":
        prompt = `Analyze these IELTS Short Answer Questions from the image(s).
            This can be from a Reading passage or a Listening transcript.

            INSTRUCTIONS:
            1. Extract the main text (Passage or Transcript).
            2. Extract each question number, the question text itself, and the correct answer.
            3. Determine the 'max_words' limit (e.g., NO MORE THAN TWO WORDS).

            Return ONLY a raw JSON object:
            {
              "full_text": "The complete passage or transcript text here...",
              "questions": [
                {
                  "number": 1,
                  "text": "What was the original purpose of the building?",
                  "answer": "Storage",
                  "max_words": 2
                }
              ]
            }`;
        break;

      case "MATCH_HEADINGS":
        prompt = `
            Analyze IELTS Matching Headings task.
            1. Extract the text (Passage with paragraph markers like A, B, C...).
            2. Identify which heading (i, ii, iii, etc.) belongs to which question number.
            Return ONLY JSON:
            {
              "full_text": "Full passage text...",
              "questions": [
                { "number": 14, "answer": "v" },
                { "number": 15, "answer": "i" }
              ]
            }
          `;
        break;

      case "MATCH_INFO":
        prompt = `
          Analyze IELTS Matching Information questions.
          1. Extract the Reading Passage.
          2. Extract statements and the corresponding paragraph letter (A, B, C, etc.) where they are found.
          Return ONLY JSON:
          {
            "full_text": "Full passage text...",
            "questions": [
              { "number": 1, "text": "a description of various types of education", "answer": "C" },
              { "number": 2, "text": "the effect of environmental factors", "answer": "A" }
            ]
          }
        `;
        break;

      default:
        prompt =
          "Analyze the image and extract IELTS questions in JSON format.";
    }

    const result = await model.generateContent([
      `${promptInstruction} \n\n ${prompt}`,
      ...imageParts,
    ]);

    const response = await result.response;
    let text = response.text();

    if (!text) throw new Error("AI empty response");

    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

    if (!jsonMatch) {
      console.log("Original Text:", text);
      throw new Error("No JSON found in response");
    }

    const finalJsonString = jsonMatch[0];

    try {
      return JSON.parse(finalJsonString);
    } catch (parseError) {
      console.error("JSON Parse Error. Cleaned text:", finalJsonString);
      throw new Error("AI returned invalid JSON format");
    }
  } catch (error) {
    console.error("Detailed Error:", error);
    throw error;
  }
};
