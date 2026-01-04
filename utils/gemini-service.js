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
      model: "gemini-3-flash-preview",
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
        prompt = `Analyze IELTS Multiple Choice Questions.
        Return ONLY a JSON array of objects:
        [
          {
            "questionNumber": "1",
            "title": "Question text here...",
            "type": "single",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "A"
          }
        ]`;
        break;

      case "COMPLETION":
      case "SENTENCE":
      case "SHORT_ANSWER":
      case "SUMMARY":
      case "TABLE_FLOWCHART":
        prompt = `Analyze IELTS Gap Fill task (Sentence/Note/Table/Summary Completion).
        Extract the text and replace gaps with {{number}} placeholders.
        Return ONLY a JSON object:
        {
          "title": "Task Title (if any)",
          "full_text": "The sentence with {{1}} and {{2}}.",
          "questions": [
            { "number": "1", "answer": "word1" },
            { "number": "2", "answer": "word2" }
          ]
        }`;
        break;

      case "TFNG":
      case "YNNG":
        const boolType = question_type === "TFNG" ? "tfng" : "ynng";
        prompt = `Analyze IELTS ${question_type} questions.
        Return ONLY a JSON object:
        {
          "title": "Do the following statements agree with the information...",
          "type": "${boolType}",
          "questions": [
            { "number": "1", "text": "Statement text...", "answer": "TRUE" }
          ]
        }`;
        break;

      case "MATCHING":
      case "MATCH_HEADINGS":
      case "MATCH_INFO":
      case "MATCH_FEATURES":
      case "MATCH_ENDINGS":
        let matchSubtype = "matching-headings";
        if (question_type === "MATCH_INFO") matchSubtype = "matching-info";
        if (question_type === "MATCH_FEATURES")
          matchSubtype = "matching-features";

        prompt = `Analyze IELTS Matching task.
        Return ONLY a JSON object:
        {
          "title": "Instruction title...",
          "options": "A. text\\nB. text\\nC. text",
          "type": "${matchSubtype}",
          "questions": [
            { "number": "1", "text": "Question statement or Paragraph letter", "answer": "A" }
          ]
        }`;
        break;

      case "DIAGRAM":
      case "MAP_DIAGRAM":
        prompt = `Analyze IELTS Diagram/Map Labeling.
        I will provide an image. Identify the labels and their corresponding question numbers.
        Return ONLY a JSON object:
        {
          "labels": [
            { "number": "1", "answer": "Reception", "x": 25, "y": 40 },
            { "number": "2", "answer": "Library", "x": 60, "y": 15 }
          ]
        }
        Note: x and y are approximate percentage coordinates (0-100) on the image.`;
        break;

      default:
        prompt =
          "Extract IELTS questions into a structured JSON format compatible with a rich text editor.";
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

export const parseGeminiToTiptap = (data, type) => {
  // 1. Completion / Sentence / Summary / Table
  if (
    [
      "COMPLETION",
      "SENTENCE",
      "SHORT_ANSWER",
      "SUMMARY",
      "TABLE_FLOWCHART",
    ].includes(type)
  ) {
    let html = data.full_text || "";
    data.questions.forEach((q) => {
      const placeholder = `{{${q.number}}}`;
      const component = `<question-input number="${q.number}" answer="${q.answer}"></question-input>`;
      html = html.split(placeholder).join(component);
    });

    if (type === "SUMMARY" || type === "TABLE_FLOWCHART") {
      return `<div data-type="summary-block" title="${
        data.title || ""
      }"><p>${html}</p></div>`;
    }
    return `<p>${html}</p>`;
  }

  // 2. MCQ (Choice Group)
  if (type === "MCQ") {
    return data
      .map((q) => {
        const optionsJson = JSON.stringify(q.options);
        return `<div data-type="choice-group" questionNumber="${q.questionNumber}" title="${q.title}" type="${q.type}" answer="${q.answer}">${optionsJson}</div>`;
      })
      .join("");
  }

  // 3. Boolean (TFNG / YNNG)
  if (["TFNG", "YNNG"].includes(type)) {
    const questionsHtml = data.questions
      .map(
        (q) => `
      <div data-type="boolean-question" number="${q.number}" answer="${q.answer}" type="${data.type}">
        ${q.text}
      </div>
    `
      )
      .join("");
    return `<div data-type="boolean-block" type="${data.type}" title="${data.title}">${questionsHtml}</div>`;
  }

  // 4. Matching Blocks
  if (type.startsWith("MATCH")) {
    const questionsHtml = data.questions
      .map(
        (q) => `
      <div data-type="matching-question" number="${q.number}" answer="${q.answer}">
        ${q.text}
      </div>
    `
      )
      .join("");
    return `<div data-type="matching-block" type="${data.type}" title="${data.title}" options="${data.options}">${questionsHtml}</div>`;
  }

  // 5. Diagram Labeling
  if (type === "DIAGRAM" || type === "MAP_DIAGRAM") {
    // Diagramda rasm src'ni UI qismida watch qilingan file'dan olamiz
    const labelsJson = JSON.stringify(data.labels);
    return `<div data-type="diagram-block" labels='${labelsJson}'></div>`;
  }

  return "";
};
