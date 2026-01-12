export const buildUserAnswersPayload = (answersObject) => {
  if (!answersObject || typeof answersObject !== "object") {
    return [];
  }

  return Object.entries(answersObject).reduce((acc, [questionId, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === "string" && value.trim() === "") {
      return acc;
    }

    let answerValue = value;
    if (typeof value === "object" && !Array.isArray(value)) {
      answerValue = value.answer ?? value.user_input ?? value.value ?? value;
    }

    acc.push({
      question_id: questionId,
      answer_value: answerValue,
    });
    return acc;
  }, []);
};
