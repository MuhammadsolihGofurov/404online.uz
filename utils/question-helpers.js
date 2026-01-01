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

      available_zones: Array.isArray(meta.available_zones)
        ? meta.available_zones.join(", ")
        : meta.available_zones || "",
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
    case "SENTENCE_COMPLETION":
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
  }
  return payload;
};
