/**
 * ExamDataNormalizer
 * 
 * Normalizes task data from different sources into a unified structure:
 * - QUIZ tasks: questions from custom_content.questions
 * - EXAM/PRACTICE/CUSTOM tasks: questions from mocks[].sections[].questions
 * 
 * Returns a flat structure with sections and questions ready for rendering.
 */

export class ExamDataNormalizer {
  /**
   * Normalize task data into a unified structure
   * @param {Object} task - Task object from API
   * @returns {Object} Normalized data with sections and questions
   */
  static normalize(task) {
    if (!task) return null;

    const { task_type, custom_content, mocks } = task;

    if (task_type === "QUIZ") {
      return this.normalizeQuiz(task, custom_content);
    } else {
      return this.normalizeMockBased(task, mocks);
    }
  }

  /**
   * Normalize QUIZ task (questions from custom_content)
   */
  static normalizeQuiz(task, custom_content) {
    if (!custom_content || !custom_content.questions) {
      return {
        task_type: "QUIZ",
        sections: [],
        allQuestions: [],
        totalQuestions: 0,
      };
    }

    const questions = custom_content.questions || [];
    
    // For QUIZ, we create a single section
    const normalizedQuestions = questions.map((q, index) => ({
      id: q.id || `quiz-q-${index}`,
      question_number: q.number || index + 1,
      question_type: q.question_type || "MCQ_SINGLE",
      prompt: q.question || q.prompt || "",
      content: {
        options: q.options || [],
      },
      correct_answer: q.correct_answer || null,
      section_type: "QUIZ",
      section_title: "Quiz Questions",
    }));

    return {
      task_type: "QUIZ",
      sections: [
        {
          id: "quiz-section",
          type: "QUIZ",
          title: "Quiz Questions",
          questions: normalizedQuestions,
        },
      ],
      allQuestions: normalizedQuestions,
      totalQuestions: normalizedQuestions.length,
    };
  }

  /**
   * Normalize Mock-based task (questions from mocks[].sections[].questions)
   */
  static normalizeMockBased(task, mocks) {
    if (!mocks || !Array.isArray(mocks) || mocks.length === 0) {
      return {
        task_type: task.task_type,
        sections: [],
        allQuestions: [],
        totalQuestions: 0,
      };
    }

    const sections = [];
    const allQuestions = [];

    mocks.forEach((mock) => {
      // Handle both full mock objects and mock IDs
      const mockData = typeof mock === "string" || typeof mock === "object" && !mock.sections 
        ? null 
        : mock;
      
      if (!mockData || !mockData.sections || !Array.isArray(mockData.sections)) {
        // If mock is just an ID, we can't normalize it (should be fetched first)
        return;
      }

      const mockType = mockData.mock_type || "UNKNOWN";

      mockData.sections.forEach((section) => {
        if (!section.questions || !Array.isArray(section.questions)) return;

        const normalizedSection = {
          id: section.id || `section-${sections.length}`,
          type: mockType,
          title: section.instructions || `${mockType} - Part ${section.part_number || sections.length + 1}`,
          part_number: section.part_number || null,
          instructions: section.instructions || "",
          audio_file: section.audio_file || null,
          images: section.images || [],
          questions: [],
        };

        section.questions.forEach((question) => {
          const normalizedQuestion = {
            id: question.id || `q-${allQuestions.length}`,
            question_number: question.question_number_start || allQuestions.length + 1,
            question_number_end: question.question_number_end || question.question_number_start || allQuestions.length + 1,
            question_type: question.question_type || "MCQ_SINGLE",
            prompt: question.prompt || "",
            content: question.content || {},
            correct_answer: question.correct_answer || null,
            section_type: mockType,
            section_title: normalizedSection.title,
            section_id: normalizedSection.id,
          };

          normalizedSection.questions.push(normalizedQuestion);
          allQuestions.push(normalizedQuestion);
        });

        if (normalizedSection.questions.length > 0) {
          sections.push(normalizedSection);
        }
      });
    });

    return {
      task_type: task.task_type,
      sections,
      allQuestions,
      totalQuestions: allQuestions.length,
    };
  }

  /**
   * Extract answers from draft submission
   * @param {Object} draft - Draft submission object
   * @returns {Object} Map of question_id -> answer_data
   */
  static extractDraftAnswers(draft) {
    if (!draft || !draft.answers) return {};

    const answersMap = {};
    draft.answers.forEach((answer) => {
      answersMap[String(answer.question_id)] = answer.answer_data || {};
    });

    return answersMap;
  }
}

