import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Shared hook for managing question session state and navigation.
 * Used by both exam-taking and homework-taking components to reduce duplication.
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.getMock - Function to get mock data for current section
 * @param {Function} options.getSectionConfig - Function to get section configuration
 * @param {string} options.sectionType - Current section type (LISTENING/READING/WRITING)
 * @returns {Object} - Question session state and handlers
 */
export const useQuestionSession = ({
  getMock,
  getSectionConfig,
  sectionType,
}) => {
  // State
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [partSummaries, setPartSummaries] = useState([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(null);
  const [focusQuestionNumber, setFocusQuestionNumber] = useState(null);
  const [questionNumberToIndexMap, setQuestionNumberToIndexMap] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ref for previous active part index
  const prevActivePartIndexRef = useRef(activePartIndex);

  /**
   * Handle answer change
   */
  const handleAnswerChange = useCallback((questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    setCurrentQuestionNumber(questionId);
  }, []);

  /**
   * Get total questions count from mock data
   */
  const getTotalQuestionsCount = useCallback((mock) => {
    if (!mock) return 0;

    const countQuestions = (items, groupKey) => {
      return items.reduce((total, item) => {
        const itemCount =
          item[groupKey]?.reduce((count, group) => {
            const groupCount =
              typeof group.question_count === "number"
                ? group.question_count
                : group.questions?.length || 0;
            return count + groupCount;
          }, 0) || 0;
        return total + itemCount;
      }, 0);
    };

    if (mock.parts) return countQuestions(mock.parts, "question_groups");
    if (mock.passages) return countQuestions(mock.passages, "question_groups");
    if (mock.tasks) return mock.tasks.length;

    return 0;
  }, []);

  /**
   * Navigate to next question
   */
  const handleNextQuestion = useCallback(() => {
    const currentMock = getMock(sectionType);
    const totalQuestions = getTotalQuestionsCount(currentMock);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [sectionType, currentQuestionIndex, getMock, getTotalQuestionsCount]);

  /**
   * Navigate to previous question
   */
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  /**
   * Select specific question by index
   */
  const handleSelectQuestion = useCallback(
    (index) => {
      const mockForSection = getMock(sectionType);
      const total = getTotalQuestionsCount(mockForSection);
      if (index >= 0 && index < total) {
        setCurrentQuestionIndex(index);
      }
    },
    [sectionType, getMock, getTotalQuestionsCount]
  );

  /**
   * Handle part summaries change from ExamQuestion component
   */
  const handlePartSummariesChange = useCallback(
    (summaries, activeIdx, questionNumToIdx) => {
      setPartSummaries(summaries);
      setActivePartIndex(activeIdx);
      if (questionNumToIdx) {
        setQuestionNumberToIndexMap(questionNumToIdx);
      }
    },
    []
  );

  /**
   * Handle part change from footer navigation
   */
  const handlePartChangeFromFooter = useCallback(
    (nextPartIndex) => {
      setActivePartIndex(nextPartIndex);

      const targetPart = partSummaries.find(
        (summary) => summary.partIndex === nextPartIndex
      );
      if (
        targetPart &&
        targetPart.startIndex !== null &&
        targetPart.startIndex !== undefined
      ) {
        setCurrentQuestionIndex(targetPart.startIndex);
        if (targetPart.firstQuestion != null) {
          setCurrentQuestionNumber(targetPart.firstQuestion);
          setFocusQuestionNumber(targetPart.firstQuestion);
          setTimeout(() => setFocusQuestionNumber(null), 500);
        }
      }
    },
    [partSummaries]
  );

  /**
   * Step to next/previous part
   */
  const handleStepPart = useCallback(
    (direction) => {
      const targetIndex = Math.min(
        partSummaries.length - 1,
        Math.max(0, activePartIndex + direction)
      );
      handlePartChangeFromFooter(targetIndex);
    },
    [partSummaries.length, activePartIndex, handlePartChangeFromFooter]
  );

  /**
   * Handle question select from footer
   */
  const handleQuestionSelectFromFooter = useCallback(
    (targetIndex, partIndex, questionNumber) => {
      setCurrentQuestionIndex(targetIndex);
      setActivePartIndex(partIndex);
      setCurrentQuestionNumber(questionNumber);
      setFocusQuestionNumber(questionNumber);
      setTimeout(() => setFocusQuestionNumber(null), 500);
    },
    []
  );

  /**
   * Toggle fullscreen mode
   */
  const handleFullscreen = useCallback(() => {
    const elem = document.documentElement;
    const isCurrentlyFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;

    try {
      if (!isCurrentlyFullscreen) {
        const requestFn =
          elem.requestFullscreen ||
          elem.webkitRequestFullscreen ||
          elem.msRequestFullscreen;
        requestFn?.call(elem);
      } else {
        const exitFn =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.msExitFullscreen;
        exitFn?.call(document);
      }
      setIsFullscreen(!isCurrentlyFullscreen);
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  /**
   * Reset session state (for switching items/sections)
   */
  const resetSession = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setActivePartIndex(0);
    setPartSummaries([]);
    setCurrentQuestionNumber(null);
    setFocusQuestionNumber(null);
    setQuestionNumberToIndexMap({});
  }, []);

  /**
   * Build answers object for submission based on section type
   */
  const buildAnswersObject = useCallback(
    (mock) => {
      if (!mock || !sectionType) return {};

      const config = getSectionConfig(sectionType);
      let answersObject = {};

      if (sectionType === "WRITING") {
        (mock?.tasks || []).forEach((task) => {
          answersObject[task.id] = answers[task.task_number] || "";
        });
      } else {
        const allQuestions = [];
        const dataArray = mock?.[config.dataKey] || [];

        dataArray.forEach((item) => {
          item[config.groupKey]?.forEach((group) => {
            allQuestions.push(...(group.questions || []));
          });
        });

        allQuestions.forEach((q) => {
          if (answers[q.question_number]) {
            answersObject[q.id] = String(answers[q.question_number]);
          }
        });
      }

      return answersObject;
    },
    [sectionType, answers, getSectionConfig]
  );

  /**
   * Check if at least one answer has been provided
   */
  const hasAnswers = useCallback(() => {
    return Object.values(answers).some(
      (val) => val && String(val).trim() !== ""
    );
  }, [answers]);

  // Sync currentQuestionIndex when activePartIndex changes
  useEffect(() => {
    if (prevActivePartIndexRef.current !== activePartIndex) {
      prevActivePartIndexRef.current = activePartIndex;

      if (partSummaries.length > 0 && typeof activePartIndex === "number") {
        const targetPart = partSummaries.find(
          (summary) => summary.partIndex === activePartIndex
        );

        if (
          targetPart &&
          targetPart.startIndex !== null &&
          targetPart.startIndex !== undefined
        ) {
          setCurrentQuestionIndex(targetPart.startIndex);
        }
      }
    }
  }, [activePartIndex, partSummaries]);

  return {
    // State
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    partSummaries,
    activePartIndex,
    setActivePartIndex,
    currentQuestionNumber,
    focusQuestionNumber,
    questionNumberToIndexMap,
    isFullscreen,

    // Handlers
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSelectQuestion,
    handlePartSummariesChange,
    handlePartChangeFromFooter,
    handleStepPart,
    handleQuestionSelectFromFooter,
    handleFullscreen,
    resetSession,

    // Utilities
    getTotalQuestionsCount,
    buildAnswersObject,
    hasAnswers,
  };
};
