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