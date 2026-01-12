import { useState, useCallback, useRef, useEffect } from "react";
import { extractQuestionNumbers } from "@/utils/templateRenderer";

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
    // console.log(`[useQuestionSession] handleAnswerChange: Question#${questionId} = "${answer}"`);
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

      const answersObject = {};

      const isUuid = (value) =>
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        );

      if (sectionType === "WRITING") {
        (mock?.tasks || []).forEach((task) => {
          const ans = answers[task.task_number];
          if (ans !== undefined && ans !== null) {
            answersObject[task.id] = String(ans);
          }
        });
      } else {
        const questionIdByKey = {};

        const getQuestionKey = (obj) =>
          obj?.placeholder_key ??
          obj?.placeholderKey ??
          obj?.placeholder ??
          obj?.key ??
          obj?.question?.placeholder_key ??
          obj?.question?.placeholderKey ??
          obj?.question?.placeholder ??
          obj?.question?.key;
        const deriveQuestionNumber = (value) => {
          if (value === undefined || value === null) return null;
          const match = String(value).match(/\d+/);
          return match ? Number(match[0]) : null;
        };
        const getQuestionNumber = (obj) => {
          const direct =
            obj?.question_number ??
            obj?.number ??
            obj?.questionNumber ??
            obj?.question_no ??
            obj?.question?.question_number ??
            obj?.question?.number ??
            obj?.question?.questionNumber ??
            obj?.question?.question_no;
          if (direct !== undefined && direct !== null) return direct;
          return deriveQuestionNumber(getQuestionKey(obj));
        };
        const getQuestionId = (obj) => {
          if (typeof obj === "string") return obj;
          return (
            obj?.id ??
            obj?.pk ??
            obj?.uuid ??
            obj?.question_uuid ??
            obj?.question_id ??
            obj?.questionId ??
            obj?.question?.id ??
            obj?.question?.pk ??
            obj?.question?.uuid ??
            obj?.question?.question_uuid ??
            obj?.question?.question_id ??
            obj?.question?.questionId
          );
        };

        const recordQuestionKey = (qKey, qId) => {
          if (qKey === undefined || qKey === null || qId === undefined || qId === null) {
            return;
          }
          const key = String(qKey);
          if (!questionIdByKey[key]) {
            questionIdByKey[key] = qId;
          }
        };

        
        // Even MORE robust recursive harvester
        const findQuestionsRecursively = (obj, depth = 0) => {
          if (!obj || depth > 10) return;
          
          if (Array.isArray(obj)) {
            obj.forEach(item => findQuestionsRecursively(item, depth + 1));
            return;
          }
          
          if (typeof obj === 'object') {
            const qNum = getQuestionNumber(obj);
            const qId = getQuestionId(obj);
            recordQuestionKey(qNum, qId);

            const qKey = getQuestionKey(obj);
            if (qKey !== undefined && qKey !== null) {
              recordQuestionKey(qKey, qId);
            }

            Object.entries(obj).forEach(([key, value]) => {
              const keyNum = Number(key);
              const derivedKeyNumber = deriveQuestionNumber(key);
              if (!Number.isFinite(keyNum) && derivedKeyNumber === null) return;
              const valueId = getQuestionId(value);
              if (valueId) {
                recordQuestionKey(
                  Number.isFinite(keyNum) ? keyNum : derivedKeyNumber,
                  valueId
                );
              }
            });
            
            // Recurse into all object keys
            Object.values(obj).forEach(val => {
                if (val && typeof val === 'object') {
                   findQuestionsRecursively(val, depth + 1);
                }
            });
          }
        };

        // Run deep structural search
        findQuestionsRecursively(mock);

        const mapGroupQuestions = (group) => {
          const extractedNumbers = extractQuestionNumbers(group?.template || "");
          const fallbackNumbers = Array.isArray(group?.question_numbers)
            ? group.question_numbers
            : extractedNumbers;
          const questionNumbers =
            fallbackNumbers.length > 0 ? fallbackNumbers : extractedNumbers;

          const rawQuestions =
            group?.questions ??
            group?.question_ids ??
            group?.questionIds ??
            group?.question_id_map ??
            group?.questionIdMap ??
            group?.questions_by_number ??
            group?.questionsByNumber ??
            group?.question_map ??
            group?.questionMap ??
            group?.questions_map ??
            group?.questions_list ??
            null;

          if (Array.isArray(rawQuestions)) {
            rawQuestions.forEach((question, index) => {
              const qNum = getQuestionNumber(question) ?? questionNumbers[index];
              const qId = getQuestionId(question);
              recordQuestionKey(qNum, qId);
              const qKey = getQuestionKey(question);
              if (qKey !== undefined && qKey !== null) {
                recordQuestionKey(qKey, qId);
              }
            });
            return;
          }

          if (rawQuestions && typeof rawQuestions === "object") {
            Object.entries(rawQuestions).forEach(([key, value], index) => {
              const keyAsNumber = Number(key);
              const derivedKeyNumber = deriveQuestionNumber(key);
              const qNum =
                getQuestionNumber(value) ??
                (Number.isFinite(keyAsNumber) ? keyAsNumber : null) ??
                derivedKeyNumber ??
                questionNumbers[index];
              const qId = getQuestionId(value) ?? getQuestionId(key);
              recordQuestionKey(qNum, qId);
              const qKey = getQuestionKey(value);
              if (qKey !== undefined && qKey !== null) {
                recordQuestionKey(qKey, qId);
              }
            });
          }
        };

        const mapQuestionGroups = (container) => {
          (container?.question_groups || []).forEach((group) => {
            mapGroupQuestions(group);
          });
        };

        if (mock?.parts) {
          mock.parts.forEach((part) => mapQuestionGroups(part));
        }
        if (mock?.passages) {
          mock.passages.forEach((passage) => mapQuestionGroups(passage));
        }
        if (mock?.question_groups) {
          mapQuestionGroups(mock);
        }

        Object.entries(answers).forEach(([questionNumber, answer]) => {
          if (answer === undefined || answer === null || String(answer).trim() === "") {
            return;
          }
          const key = String(questionNumber);
          const questionId = isUuid(key) ? key : questionIdByKey[key];
          if (questionId) {
            answersObject[questionId] = String(answer);
            return;
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
    const hasAny = Object.values(answers).some(
      (val) => val !== null && val !== undefined && String(val).trim() !== ""
    );
    return hasAny;
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
