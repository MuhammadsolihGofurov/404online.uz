// utils/question-helpers.js

/**
 * Backenddan kelgan ma'lumotni React Hook Form formatiga o'tkazish
 */
export const parseInitialTokens = (data) => {
  if (!data?.correct_answer) return [];

  return Object.keys(data.correct_answer).map((key) => {
    const meta = data.metadata?.[key] || {};
    const answer = data.correct_answer[key];

    return {
      id: key,
      answers: Array.isArray(answer) ? answer.join(", ") : answer,

      type: meta.type || "text_input",
      max_words: meta.max_words || 2,
      placeholder: meta.placeholder || "",

      // MAP uchun
      available_zones: Array.isArray(meta.available_zones)
        ? meta.available_zones.join(", ")
        : meta.available_zones || "",

      // MATCHING uchun
      options: meta.options ? meta.options.join(", ") : "A, B, C, D, E",
      allow_reuse: meta.allow_reuse || false,
    };
  });
};

/**
 * Form ma'lumotlarini savol turiga qarab Backend Payload formatiga aylantirish
 */
export const generateQuestionPayload = (type, values, groupId) => {
  const payload = {
    question_number: parseInt(values.question_number),
    text: values.text,
    group: groupId,
    correct_answer: {},
    metadata: {},
  };

  switch (type) {
    case "MCQ": {
      payload.text = values.text.includes("{{gap_1}}")
        ? values.text
        : `${values.text} {{gap_1}}`;

      // MultiSelect'dan kelgan [{id: 'A', ...}] ni ['A'] ga o'tkazamiz
      const selectedAnswers = Array.isArray(values.correct_answer_mcq)
        ? values.correct_answer_mcq.map((item) => item.id)
        : [];

      payload.correct_answer = { gap_1: selectedAnswers };

      payload.metadata = {
        gap_1: {
          type: "mcq",
          // Agar bittadan ko'p javob bo'lsa, display doim dropdown bo'ladi
          display:
            selectedAnswers.length > 1 ? "dropdown" : values.mcq_display_type,
          is_multiple: selectedAnswers.length > 1,
          options: values.mcq_options.map((opt, i) => ({
            letter: String.fromCharCode(65 + i),
            text: opt.text,
          })),
        },
      };
      break;
    }
    case "COMPLETION":
    case "SHORT_ANSWER":
    case "SUMMARY":
    case "TABLE_FLOWCHART":
    case "SENTENCE":
      values.tokens.forEach((t) => {
        payload.correct_answer[t.id] = t.answers
          .split(",")
          .map((a) => a.trim());
        payload.metadata[t.id] = {
          type: t.type,
          max_words: parseInt(t.max_words) || 2,
          placeholder: t.placeholder,
        };
      });
      break;
    case "MAP_DIAGRAM": {
      values.tokens.forEach((t) => {
        payload.correct_answer[t.id] = [t.answers.trim().toUpperCase()];

        payload.metadata[t.id] = {
          type: "zone_select",
          available_zones: t.available_zones
            ? t.available_zones.split(",").map((z) => z.trim().toUpperCase())
            : ["A", "B", "C", "D", "E", "F", "G", "H"],
        };
      });
      break;
    }
    case "MATCHING": {
      values.tokens.forEach((t) => {
        payload.correct_answer[t.id] = [t.answers.trim().toUpperCase()];
        payload.metadata[t.id] = {
          type: "dropdown",
          options: t.options
            ? t.options.split(",").map((o) => o.trim().toUpperCase())
            : ["A", "B", "C", "D", "E"],
          allow_reuse: t.allow_reuse || false,
        };
      });
      break;
    }
    case "MATCH_HEADINGS":
    case "MATCH_INFO":
    case "MATCH_FEATURES": {
      if (values.tokens && Array.isArray(values.tokens)) {
        values.tokens.forEach((token) => {
          const tokenId = token.id;

          payload.correct_answer[tokenId] = [token.answers?.trim() || ""];

          payload.metadata[tokenId] = {
            type: "dropdown",
            options: values.group_options || [],
            allow_reuse: false,
          };
        });
      }
      break;
    }
    case "TFNG":
    case "YNNG": {
      const isYNNG = type === "YNNG";
      const defaultOptions = isYNNG
        ? ["YES", "NO", "NOT GIVEN"]
        : ["TRUE", "FALSE", "NOT GIVEN"];

      values.tokens.forEach((t) => {
        payload.correct_answer[t.id] = [t.answers.trim().toUpperCase()];

        payload.metadata[t.id] = {
          type: "dropdown",
          options: defaultOptions,
          display: t.type || "dropdown",
        };
      });
      break;
    }
  }
  return payload;
};

// utils/question-helpers.js

export const getDisplayQuestionNumber = (
  type,
  field,
  index,
  watchText = ""
) => {
  if (!field) return index + 1;
  const tokenId = String(field.id || "");

  // 1. Agar Token ID o'zi raqam bo'lsa (masalan: {{41}}), ID-ni qaytaramiz.
  // Bu TABLE_FLOWCHART va SUMMARY uchun eng xavfsiz yo'l.
  if (tokenId.match(/^\d+$/)) {
    return parseInt(tokenId);
  }

  // 2. MATCHING format (q_14)
  const idMatch = tokenId.match(/q_(\d+)/);
  if (idMatch) return idMatch[1];

  // 3. Agar Token ID harf bo'lsa (masalan: {{gap_1}}), matndan raqam qidiramiz
  if (watchText && tokenId) {
    const tokenStr = `{{${tokenId}}}`;
    const tokenPos = watchText.indexOf(tokenStr);

    if (tokenPos !== -1) {
      const textBefore = watchText.substring(0, tokenPos);

      // Faqat nuqta yoki qavs bilan kelgan raqamlarni qidiramiz (masalan: "14." yoki "14)")
      // Shunda "8 Million" dagi 8 ni tashlab ketadi.
      const allNumbers = [...textBefore.matchAll(/(\d+)(?:\.|\s|\))/g)];

      if (allNumbers.length > 0) {
        return allNumbers[allNumbers.length - 1][1];
      }
    }
  }

  // 4. Hech narsa topilmasa, index bo'yicha (default)
  return index + 1;
};

// MCQ bulk function
export const bulkSaveMCQ = async (
  questions,
  groupId,
  sectionType,
  authAxios
) => {
  const requests = questions.map((q) => {
    // Backend kutilayotgan formatga o'tkazish
    const formattedValues = {
      question_number: q.question_number,
      text: q.text,
      correct_answer_mcq: [{ id: q.correct_answer }], // generateQuestionPayload array kutadi
      mcq_options: q.options,
      mcq_display_type: "radio", // default display type
    };

    const payload = generateQuestionPayload("MCQ", formattedValues, groupId);
    return authAxios.post(`/editor/${sectionType}-questions/`, payload);
  });

  return Promise.all(requests);
};

export const transformEditorData = (json) => {
  let templateHtml = "";
  const correctAnswers = [];

  const processNode = (node) => {
    // 1. Gap Fill (Eski mantiq)
    if (node.type === "questionInput") {
      const { number, answer } = node.attrs;
      correctAnswers.push({
        number: parseInt(number),
        answer: answer,
      });
      return `<question-input number='${number}' answer='${answer}'></question-input>`;
    }

    // 2. Choice Group (Eski mantiq)
    if (node.type === "choiceGroup") {
      const { questionNumber, title, type } = node.attrs;
      const options = [];
      let correctOnes = [];

      node.content?.forEach((item) => {
        if (item.type === "choiceItem") {
          const text = item.content?.map((c) => c.text).join("") || "";
          options.push(text);
          if (item.attrs.isCorrect) {
            correctOnes.push(text);
          }
        }
      });

      correctAnswers.push({
        number: parseInt(questionNumber),
        answer: type === "single" ? correctOnes[0] || "" : correctOnes,
      });

      return `<choice-group number='${questionNumber}' title='${title}' type='${type}'>${JSON.stringify(
        options
      )}</choice-group>`;
    }

    // 3. Matching Block (YANGI)
    if (node.type === "matchingBlock") {
      const { title, options, type } = node.attrs;

      // Ichidagi savollarni (matchingQuestion) rekursiv qayta ishlash
      let questionsHtml = "";
      if (node.content) {
        questionsHtml = node.content.map(processNode).join("");
      }

      return `<div class="matching-container" data-type="${type}">
        <div class="matching-title">${title}</div>
        <div class="matching-options-box">${options}</div>
        <div class="matching-questions-list">${questionsHtml}</div>
      </div>`;
    }

    // 4. Matching Question (YANGI)
    if (node.type === "matchingQuestion") {
      const { number, answer } = node.attrs;
      const questionText =
        node.content
          ?.map((c) => {
            // Bu yerda text ichidagi marklarni (bold, etc) ham hisobga olish uchun yana processNode'ga yuboramiz
            return processNode(c);
          })
          .join("") || "";

      correctAnswers.push({
        number: parseInt(number),
        answer: answer, // Masalan: "A" yoki "B"
      });

      return `<div class="matching-question-item">
        <span class="q-num">${number}</span>
        <span class="q-text">${questionText}</span>
        <matching-answer-slot number='${number}' answer='${answer}'></matching-answer-slot>
      </div>`;
    }

    if (node.type === "booleanBlock") {
      const { title, type } = node.attrs;
      let questionsHtml = node.content
        ? node.content.map(processNode).join("")
        : "";

      return `<div class="boolean-container" data-type="${type}">
    <p class="boolean-instruction">${title}</p>
    <div class="boolean-questions-list">${questionsHtml}</div>
  </div>`;
    }

    // 6. Boolean Question
    if (node.type === "booleanQuestion") {
      const { number, answer, type } = node.attrs;
      const questionText = node.content?.map(processNode).join("") || "";

      correctAnswers.push({
        number: parseInt(number),
        answer: answer, // "TRUE", "FALSE", "NOT GIVEN", "YES", "NO"
      });

      return `<div class="boolean-question-row">
    <span class="q-num">${number}</span>
    <span class="q-text">${questionText}</span>
    <boolean-answer-slot number='${number}' type='${type}' answer='${answer}'></boolean-answer-slot>
  </div>`;
    }

    // 7. Summary question
    if (node.type === "summaryBlock") {
      const { title } = node.attrs;
      let contentHtml = "";

      if (node.content) {
        contentHtml = node.content.map(processNode).join("");
      }

      return `
    <div class="summary-container" style="border: 2px solid #1e293b; border-radius: 12px; margin: 20px 0; overflow: hidden;">
      <div class="summary-header" style="background: #1e293b; color: white; padding: 8px 16px; font-weight: bold; font-size: 14px;">
        ${title}
      </div>
      <div class="summary-body" style="padding: 20px; background: #fffcf5; line-height: 1.8;">
        ${contentHtml}
      </div>
    </div>`;
    }

    // 8. diagram labeling
    if (node.type === "diagramBlock") {
      const { src, labels } = node.attrs;

      // Har bir labelni to'g'ri javoblar ro'yxatiga qo'shamiz
      labels.forEach((label) => {
        correctAnswers.push({
          number: parseInt(label.number),
          answer: label.answer,
        });
      });

      return `
    <div class="diagram-container" style="position: relative; margin: 30px 0;">
      <img src="${src}" style="width: 100%; border-radius: 12px;" />
      ${labels
        .map(
          (l) => `
        <diagram-marker 
          number="${l.number}" 
          style="position: absolute; left: ${l.x}%; top: ${l.y}%;"
        ></diagram-marker>
      `
        )
        .join("")}
    </div>`;
    }

    // --- Oddiy elementlar ---
    if (node.type === "text") {
      let text = node.text;
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "underline") text = `<u>${text}</u>`;
          if (mark.type === "highlight") text = `<mark>${text}</mark>`;
        });
      }
      return text;
    }

    let contentHtml = "";
    if (node.content) {
      contentHtml = node.content.map(processNode).join("");
    }

    switch (node.type) {
      case "paragraph":
        return `<p>${contentHtml}</p>`;
      case "heading":
        return `<h${node.attrs.level}>${contentHtml}</h${node.attrs.level}>`;
      case "bulletList":
        return `<ul>${contentHtml}</ul>`;
      case "orderedList":
        return `<ol>${contentHtml}</ol>`;
      case "listItem":
        return `<li>${contentHtml}</li>`;
      case "table":
        return `<table>${contentHtml}</table>`;
      case "tableRow":
        return `<tr>${contentHtml}</tr>`;
      case "tableCell":
        return `<td>${contentHtml}</td>`;
      case "tableHeader":
        return `<th>${contentHtml}</th>`;
      case "horizontalRule":
        return `<hr />`;
      case "image":
        return `<img src="${node.attrs.src}" />`;
      case "doc":
        return contentHtml;
      default:
        return contentHtml;
    }
  };

  templateHtml = processNode(json);

  return {
    template: templateHtml,
    correct_answers: correctAnswers.sort((a, b) => a.number - b.number),
  };
};
