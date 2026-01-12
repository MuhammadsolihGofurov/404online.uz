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

      // Javobni vergul bo'yicha bo'lib, massivga o'giramiz
      // Masalan: "apple, orange" -> ["apple", "orange"]
      const answerArray =
        typeof answer === "string"
          ? answer
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "")
          : [answer];

      correctAnswers.push({
        number: parseInt(number),
        answer: answerArray, // Endi bu yerda massiv ketadi
      });

      return `<question-input number='${number}' answer='${answer}'></question-input>`;
    }

    // 2. Choice Group (Eski mantiq)
    if (node.type === "choiceGroup") {
      const { questionNumber, title, type } = node.attrs;
      const options = [];
      let correctIndices = []; // To'g'ri javoblar harflarini yig'ish uchun

      node.content?.forEach((item, index) => {
        if (item.type === "choiceItem") {
          const text = item.content?.map((c) => c.text).join("") || "";
          options.push(text);

          if (item.attrs.isCorrect) {
            // Indexni harfga aylantirish (65 - 'A' belgisi)
            const letter = String.fromCharCode(65 + index);
            correctIndices.push(letter);
          }
        }
      });

      // Template uchun javobni string ko'rinishiga keltiramiz
      const finalAnswer =
        type === "single" ? correctIndices[0] || "" : correctIndices.join(",");

      correctAnswers.push({
        number: parseInt(questionNumber),
        answer: finalAnswer,
      });

      // Template ichiga answer='...' atributi qo'shildi
      return `<choice-group number='${questionNumber}' title='${title}' type='${type}' answer='${finalAnswer}'>${JSON.stringify(
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
      if (node.type === "summaryBlock") {
        const { title, isDragDrop, words } = node.attrs;
        // isDragDrop - bu summary'da shunchaki yoziladimi yoki so'zlar tanlanadimi shuni bildiradi

        let contentHtml = "";
        if (node.content) {
          contentHtml = node.content.map(processNode).join("");
        }

        // Agar Drag & Drop bo'lsa, pastga so'zlar bankini qo'shamiz
        const dragDropBank = isDragDrop
          ? `
    <div class="drag-drop-words-pool">
      ${words
        .map(
          (word) =>
            `<span class="draggable-word" draggable="true">${word}</span>`
        )
        .join("")}
    </div>
  `
          : "";

        return `
    <div class="summary-container drag-drop-mode-${isDragDrop}" style="border: 2px solid #1e293b; border-radius: 12px; margin: 20px 0;">
      <div class="summary-header" style="background: #1e293b; color: white; padding: 8px 16px; font-weight: bold;">
        ${title}
      </div>
      <div class="summary-body" style="padding: 20px; background: #fffcf5; line-height: 2;">
        ${contentHtml}
      </div>
      ${dragDropBank}
    </div>`;
      }
    }

    // 8. diagram labeling
    if (node.type === "diagramBlock") {
      const { src, labels } = node.attrs;

      // Har bir labelni to'g'ri javoblar ro'yxatiga ham qo'shamiz (buni allaqachon yozgansiz)
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
          answer="${l.answer || ""}" 
          style="position: absolute; left: ${l.x}%; top: ${l.y}%;"
        ></diagram-marker>
      `
        )
        .join("")}
    </div>`;
    }

    // 9. drag drop
    // 9. drag drop summary
    if (node.type === "dragDropSummary") {
      const { title, options } = node.attrs;

      // Options massiv ekanligiga ishonch hosil qilamiz
      const optionsArray = Array.isArray(options) ? options : [];

      let bodyHtml = "";
      if (node.content) {
        bodyHtml = node.content.map(processNode).join("");
      }

      const optionsHtml = optionsArray
        .map(
          (opt) =>
            `<div class="drag-item" draggable="true" data-word="${opt}">${opt}</div>`
        )
        .join("");

      return `
    <div class="drag-drop-summary-container" style="border: 2px solid #6366f1; border-radius: 12px; margin: 24px 0; background: #fff;">
      <div class="summary-header" style="background: #6366f1; color: white; padding: 10px 16px; font-weight: bold; border-radius: 10px 10px 0 0;">
        ${title}
      </div>
      <div class="summary-content" style="padding: 20px; line-height: 2.2; color: #334155;">
        ${bodyHtml}
      </div>
      <div class="word-bank" style="padding: 16px; background: #f8fafc; border-top: 1px dashed #cbd5e1; display: flex; flex-wrap: wrap; gap: 10px; border-radius: 0 0 10px 10px;">
        ${optionsHtml}
      </div>
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

/**
 * Bazadan kelgan maxsus HTMLni Tiptap editori tushunadigan
 * standart formatga o'giruvchi funksiya.
 */

export const prepareInitialData = (html) => {
  if (!html) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 1. Choice Group tahlili
  doc.querySelectorAll("choice-group").forEach((oldNode) => {
    const newNode = doc.createElement("div");
    newNode.setAttribute("data-type", "choice-group");

    // Atributlarni ko'chiramiz
    const questionNumber =
      oldNode.getAttribute("data-number") ||
      oldNode.getAttribute("number") ||
      "1";
    const title = oldNode.getAttribute("title") || "";
    const type = oldNode.getAttribute("type") || "single";
    const answerAttr = oldNode.getAttribute("answer") || ""; // "A" yoki "A,C" ko'rinishida

    newNode.setAttribute("questionNumber", questionNumber);
    newNode.setAttribute("title", title);
    newNode.setAttribute("type", type);

    try {
      const optionsArray = JSON.parse(oldNode.textContent);

      // To'g'ri javoblarni massivga aylantiramiz (vergul bilan ajratilgan bo'lishi mumkin)
      const correctLetters = answerAttr.split(",").map((s) => s.trim());

      optionsArray.forEach((text, index) => {
        const item = doc.createElement("div");
        item.setAttribute("data-type", "choice-item");

        // Indexni harfga aylantiramiz (0 -> A, 1 -> B...)
        const currentLetter = String.fromCharCode(65 + index);

        // Agar ushbu harf correctLetters ichida bo'lsa, isCorrect true bo'ladi
        const isCorrect = correctLetters.includes(currentLetter);
        item.setAttribute("isCorrect", isCorrect ? "true" : "false");

        item.textContent = text;
        newNode.appendChild(item);
      });
    } catch (e) {
      console.error("MCQ Options parse error:", e);
    }

    oldNode.replaceWith(newNode);
  });

  // 2. Matching Block tahlili
  doc.querySelectorAll(".matching-container").forEach((el) => {
    const div = doc.createElement("div");
    div.setAttribute("data-type", "matching-block");
    div.setAttribute(
      "type",
      el.getAttribute("data-type") || "matching-headings"
    );
    div.setAttribute(
      "title",
      el.querySelector(".matching-title")?.textContent || ""
    );
    div.setAttribute(
      "options",
      el.querySelector(".matching-options-box")?.textContent || ""
    );

    // Savollarni ko'chirish
    el.querySelectorAll(".matching-question-item").forEach((q) => {
      const qDiv = doc.createElement("div");
      qDiv.setAttribute("data-type", "matching-question");
      qDiv.setAttribute("number", q.querySelector(".q-num")?.textContent || "");
      qDiv.setAttribute(
        "answer",
        q.querySelector("matching-answer-slot")?.getAttribute("answer") || ""
      );
      qDiv.innerHTML = q.querySelector(".q-text")?.innerHTML || "";
      div.appendChild(qDiv);
    });
    el.replaceWith(div);
  });

  // 3. Boolean Block tahlili
  doc.querySelectorAll(".boolean-container").forEach((el) => {
    const div = doc.createElement("div");
    div.setAttribute("data-type", "boolean-block");
    div.setAttribute("type", el.getAttribute("data-type") || "tfng");
    div.setAttribute(
      "title",
      el.querySelector(".boolean-instruction")?.textContent || ""
    );

    el.querySelectorAll(".boolean-question-row").forEach((q) => {
      const qDiv = doc.createElement("div");
      qDiv.setAttribute("data-type", "boolean-question");
      qDiv.setAttribute("number", q.querySelector(".q-num")?.textContent || "");

      const slot = q.querySelector("boolean-answer-slot");
      qDiv.setAttribute("answer", slot?.getAttribute("answer") || "");
      qDiv.setAttribute("type", slot?.getAttribute("type") || "tfng");

      qDiv.innerHTML = q.querySelector(".q-text")?.innerHTML || "";
      div.appendChild(qDiv);
    });
    el.replaceWith(div);
  });

  // 4. Diagram Block (Eng muhimi!)
  doc.querySelectorAll(".diagram-container").forEach((el) => {
    const div = doc.createElement("div");
    div.setAttribute("data-type", "diagram-block");

    const img = el.querySelector("img");
    div.setAttribute("src", img?.getAttribute("src") || "");

    // Markerlarni yig'ish (answer atributi bilan birga)
    const markers = Array.from(el.querySelectorAll("diagram-marker")).map(
      (m) => ({
        number: m.getAttribute("number") || "",
        answer: m.getAttribute("answer") || "", // <--- Answer endi atributdan olinadi
        x: parseFloat(m.style.left) || 0,
        y: parseFloat(m.style.top) || 0,
      })
    );

    // Tiptap extensionga JSON string ko'rinishida beramiz
    div.setAttribute("labels", JSON.stringify(markers));
    el.replaceWith(div);
  });

  // 5. Summary Block
  doc.querySelectorAll(".summary-container").forEach((el) => {
    const isDragDrop = container.classList.contains("drag-drop-mode-true");
    const words = [];

    if (isDragDrop) {
      container
        .querySelectorAll(".draggable-word")
        .forEach((w) => words.push(w.innerText));
    }

    const newNode = doc.createElement("div");
    newNode.setAttribute("data-type", "summaryBlock");
    newNode.setAttribute("isDragDrop", isDragDrop);
    newNode.setAttribute("words", JSON.stringify(words));
    const div = doc.createElement("div");
    div.setAttribute("data-type", "summary-block");
    div.setAttribute(
      "title",
      el.querySelector(".summary-header")?.textContent?.trim() || ""
    );
    div.innerHTML = el.querySelector(".summary-body")?.innerHTML || "";
    el.replaceWith(div);
  });

  // 6. drag drop summary
  doc
    .querySelectorAll(".summary-container, .drag-drop-summary-container")
    .forEach((el) => {
      const newNode = doc.createElement("div");

      // 1. Tipni aniqlash
      const isDragDropMode =
        el.classList.contains("drag-drop-mode-true") ||
        el.classList.contains("drag-drop-summary-container") ||
        (el.hasAttribute("data-type") &&
          el.getAttribute("data-type") === "drag-drop-summary");

      newNode.setAttribute(
        "data-type",
        isDragDropMode ? "dragDropSummary" : "summaryBlock"
      );

      // 2. Title (Sarlavha) ni olish - Xatolikdan himoyalangan holda
      const headerEl = el.querySelector(".summary-header, .summary-title");
      newNode.setAttribute(
        "title",
        headerEl ? headerEl.textContent.trim() : "Summary"
      );

      // 3. Words/Options (So'zlar banki) ni yig'ish
      const words = [];
      el.querySelectorAll(".draggable-word, .drag-item").forEach((w) => {
        if (w.textContent) words.push(w.textContent.trim());
      });

      if (isDragDropMode) {
        newNode.setAttribute("options", JSON.stringify(words)); // dragDropSummary uchun 'options'
        newNode.setAttribute("isDragDrop", "true"); // summaryBlock uchun 'isDragDrop'
        newNode.setAttribute("words", JSON.stringify(words)); // summaryBlock uchun 'words'
      }

      // 4. Ichki matnni (paragraflar va inputlar) olish
      const bodyEl = el.querySelector(".summary-body, .summary-content");
      if (bodyEl) {
        // Clone body and remove word bank items from content
        const bodyClone = bodyEl.cloneNode(true);
        bodyClone
          .querySelectorAll(".draggable-word, .drag-item")
          .forEach((item) => item.remove());
        newNode.innerHTML = bodyClone.innerHTML;
      } else {
        // Agar maxsus body bo'lmasa, elementning o'zini (lekin banklarsiz) olamiz
        const clone = el.cloneNode(true);
        const bank = clone.querySelector(".word-bank, .drag-drop-words-pool");
        if (bank) bank.remove();
        const header = clone.querySelector(".summary-header, .summary-title");
        if (header) header.remove();
        newNode.innerHTML = clone.innerHTML;
      }

      el.replaceWith(newNode);
    });

  // 6. Question Input (Gap Fill) - O'z holicha qoladi,
  // chunki extensioningiz "question-input" tegini taniydi

  return doc.body.innerHTML;
};

export const EDITOR_TOOLS_CONFIG = {
  MCQ: ["history", "format", "choice_group"],
  GAP_FILL: ["history", "format", "gap_fill", "table"],
  TFNG: ["history", "boolean_group"],
  YNNG: ["history", "boolean_group"],
  COMPLETION: ["gap_fill"],
  SENTENCE: ["gap_fill"],
  SHORT_ANSWER: ["gap_fill"],
  MATCHING: ["gap_fill", "matching_group"],
  MATCH_HEADINGS: ["gap_fill", "matching_group"],
  MATCH_INFO: ["gap_fill", "matching_group"],
  MATCH_ENDINGS: ["gap_fill", "matching_group"],
  MATCH_FEATURES: ["gap_fill", "matching_group"],
  MAP_DIAGRAM: ["gap_full"],
  TABLE_FLOWCHART: ["gap_full"],
  DIAGRAM: ["gap_full"],
  SUMMARY: ["history", "format", "summary_group", "drag_drop_summary"],
  ALL: [
    "history",
    "format",
    "lists",
    "elements",
    "gap_fill",
    "choice_group",
    "matching_group",
    "boolean_group",
    "summary_group",
    "drag_drop_summary",
  ],
};
