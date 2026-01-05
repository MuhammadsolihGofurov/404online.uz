import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { SECTION_TYPES } from "@/utils/examConstants";
import ExamTimer from "./exam-timer";
import ExamSectionCard from "./exam-section-card";
import ExamQuestion from "./exam-question";
import { AlertCircle, Loader } from "lucide-react";

export default function ExamTaking({ role, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const { id } = router.query;

  // State
  const [examStarted, setExamStarted] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null); // 'LISTENING', 'READING', 'WRITING', null
  const [answers, setAnswers] = useState({}); // { [question_id]: answer }
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startError, setStartError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseDurationToMinutes = (value) => {
    if (!value && value !== 0) return null;
    if (typeof value === "number") return value;

    if (typeof value === "string") {
      // Format: HH:MM:SS
      const parts = value.split(":");
      if (parts.length === 3 && parts.every((p) => p !== "")) {
        const [h, m, s] = parts.map((p) => Number(p) || 0);
        return h * 60 + m + Math.floor(s / 60);
      }

      // Format: PT40M / PT1H20M
      const iso = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
      if (iso) {
        const hours = Number(iso[1]) || 0;
        const minutes = Number(iso[2]) || 0;
        const seconds = Number(iso[3]) || 0;
        return hours * 60 + minutes + Math.floor(seconds / 60);
      }
    }

    return null;
  };

  // Fetch exam details
  const {
    data: exam,
    isLoading: examLoading,
    error: examError,
  } = useSWR(
    id ? [`/tasks/exams/${id}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  // Fetch listening mock
  const { data: listeningMock, isLoading: listeningLoading } = useSWR(
    exam?.listening_mock
      ? [`/mocks/listening/${exam.listening_mock}/`, router.locale]
      : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  // Fetch reading mock
  const { data: readingMock, isLoading: readingLoading } = useSWR(
    exam?.reading_mock
      ? [`/mocks/reading/${exam.reading_mock}/`, router.locale]
      : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  // Fetch writing mock
  const { data: writingMock, isLoading: writingLoading } = useSWR(
    exam?.writing_mock
      ? [`/mocks/writing/${exam.writing_mock}/`, router.locale]
      : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: { "Accept-Language": locale },
        },
        {},
        true
      )
  );

  // Open exam room on mount
  useEffect(() => {
    if (id && !examStarted && exam) {
      openExamRoom();
    }
  }, [id, exam]);

  const openExamRoom = async () => {
    try {
      setStartError(null);
      const response = await fetcher(
        `/tasks/exams/${id}/open-room/`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        {},
        true
      );

      if (response) {
        setExamStarted(true);
      }
    } catch (error) {
      const errorMsg =
        error?.message ||
        intl.formatMessage({
          id: "Failed to start exam",
          defaultMessage: "Failed to start exam",
        });

      console.error("Error opening exam room:", errorMsg);

      // If already open, continue anyway
      if (errorMsg.includes("already") || errorMsg.includes("open")) {
        setExamStarted(true);
        return;
      }

      setStartError(errorMsg);
    }
  };

  const handleTimeUp = () => {
    handleSubmitExam();
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    const currentMock = getMockForSection(selectedSection);
    const totalQuestions = getTotalQuestionsCount(currentMock);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSelectQuestion = (index) => {
    const mockForSection = getMockForSection(selectedSection);
    const total = getTotalQuestionsCount(mockForSection);
    if (index >= 0 && index < total) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setCurrentQuestionIndex(0); // Reset to first question
  };

  const handleBackToSections = () => {
    setSelectedSection(null);
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      // Submit all answers to backend
      const submissionData = {
        exam_task_id: id,
        answers: answers,
      };

      const response = await fetcher(
        `/submissions/actions/submit/`,
        {
          method: "POST",
          body: JSON.stringify(submissionData),
        },
        {},
        true
      );

      if (response) {
        router.push(`/dashboard/exams/${id}/results`);
      }
    } catch (error) {
      setStartError(
        error?.message ||
          intl.formatMessage({
            id: "Failed to submit exam",
            defaultMessage: "Failed to submit exam",
          })
      );
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMockForSection = (section) => {
    if (section === SECTION_TYPES.LISTENING) return listeningMock;
    if (section === SECTION_TYPES.READING) return readingMock;
    if (section === SECTION_TYPES.WRITING) return writingMock;
    return null;
  };

  const getTotalQuestionsCount = (mock) => {
    if (!mock) return 0;

    if (mock.parts) {
      // Listening: extract question numbers from templates in question_groups
      return mock.parts.reduce((total, part) => {
        const partQuestions =
          part.question_groups?.reduce((count, group) => {
            // Count questions by parsing template or using questions array length
            const questionCount = group.questions?.length || 0;
            return count + questionCount;
          }, 0) || 0;
        return total + partQuestions;
      }, 0);
    }

    if (mock.passages) {
      // Reading: extract question numbers from templates in question_groups
      return mock.passages.reduce((total, passage) => {
        const passageQuestions =
          passage.question_groups?.reduce((count, group) => {
            const questionCount = group.questions?.length || 0;
            return count + questionCount;
          }, 0) || 0;
        return total + passageQuestions;
      }, 0);
    }

    if (mock.tasks) {
      // Writing: count writing tasks
      return mock.tasks.length;
    }

    return 0;
  };

  const getProgressStats = () => {
    // Calculate progress based on the section mocks themselves
    const listeningTotal = getTotalQuestionsCount(listeningMock);
    const readingTotal = getTotalQuestionsCount(readingMock);
    const writingTotal = getTotalQuestionsCount(writingMock);

    // Count answered questions per section using question numbers
    const getAnsweredCount = (mock, sectionType) => {
      if (!mock) return 0;
      let count = 0;

      if (sectionType === SECTION_TYPES.LISTENING && mock.parts) {
        mock.parts.forEach((part) => {
          part.question_groups?.forEach((group) => {
            group.questions?.forEach((question) => {
              // Check by question_number instead of question.id
              if (answers[question.question_number]) count++;
            });
          });
        });
      } else if (sectionType === SECTION_TYPES.READING && mock.passages) {
        mock.passages.forEach((passage) => {
          passage.question_groups?.forEach((group) => {
            group.questions?.forEach((question) => {
              // Check by question_number instead of question.id
              if (answers[question.question_number]) count++;
            });
          });
        });
      } else if (sectionType === SECTION_TYPES.WRITING && mock.tasks) {
        mock.tasks.forEach((task) => {
          // For writing, check by task_number
          if (answers[task.task_number]) count++;
        });
      }

      return count;
    };

    return {
      LISTENING: {
        answered: getAnsweredCount(listeningMock, SECTION_TYPES.LISTENING),
        total: listeningTotal,
      },
      READING: {
        answered: getAnsweredCount(readingMock, SECTION_TYPES.READING),
        total: readingTotal,
      },
      WRITING: {
        answered: getAnsweredCount(writingMock, SECTION_TYPES.WRITING),
        total: writingTotal,
      },
    };
  };

  const isLoading =
    loading ||
    examLoading ||
    (selectedSection &&
      ((selectedSection === SECTION_TYPES.LISTENING && listeningLoading) ||
        (selectedSection === SECTION_TYPES.READING && readingLoading) ||
        (selectedSection === SECTION_TYPES.WRITING && writingLoading)));

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {intl.formatMessage({
              id: "Loading exam",
              defaultMessage: "Loading exam...",
            })}
          </p>
        </div>
      </div>
    );
  }

  if (examError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">
                {intl.formatMessage({
                  id: "Error loading exam",
                  defaultMessage: "Error loading exam",
                })}
              </h3>
              <p className="text-red-700 text-sm mb-4">{examError?.message}</p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {intl.formatMessage({
                  id: "Go Back",
                  defaultMessage: "Go Back",
                })}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const progress = getProgressStats();
  const examDurationMinutes = parseDurationToMinutes(exam?.duration) ?? 180;
  const listeningDuration =
    parseDurationToMinutes(listeningMock?.duration) ?? examDurationMinutes;
  const readingDuration =
    parseDurationToMinutes(readingMock?.duration) ?? examDurationMinutes;
  const writingDuration =
    parseDurationToMinutes(writingMock?.duration) ?? examDurationMinutes;

  // Show section selection cards
  if (!selectedSection) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        <ExamTimer duration={examDurationMinutes} onTimeUp={handleTimeUp} />

        {startError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm">
            {startError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex items-center justify-center pt-24">
          <div className="w-full max-w-6xl px-6 pb-40">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              {exam.title}
            </h1>
            <p className="text-gray-600 mb-12">{exam.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exam.listening_mock && (
                <ExamSectionCard
                  title={exam.listening_mock_title || "Listening"}
                  duration={listeningDuration}
                  answered={progress.LISTENING.answered}
                  total={progress.LISTENING.total}
                  onClick={() => handleSectionChange(SECTION_TYPES.LISTENING)}
                  isLoading={listeningLoading}
                />
              )}

              {exam.reading_mock && (
                <ExamSectionCard
                  title={exam.reading_mock_title || "Reading"}
                  duration={readingDuration}
                  answered={progress.READING.answered}
                  total={progress.READING.total}
                  onClick={() => handleSectionChange(SECTION_TYPES.READING)}
                  isLoading={readingLoading}
                />
              )}

              {exam.writing_mock && (
                <ExamSectionCard
                  title={exam.writing_mock_title || "Writing"}
                  duration={writingDuration}
                  answered={progress.WRITING.answered}
                  total={progress.WRITING.total}
                  onClick={() => handleSectionChange(SECTION_TYPES.WRITING)}
                  isLoading={writingLoading}
                />
              )}
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting
                  ? intl.formatMessage({
                      id: "Submitting...",
                      defaultMessage: "Submitting...",
                    })
                  : intl.formatMessage({
                      id: "Submit Exam",
                      defaultMessage: "Submit Exam",
                    })}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show question view for selected section
  const currentMock = getMockForSection(selectedSection);

  if (!currentMock) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Mock data not loaded</p>
          <button
            onClick={handleBackToSections}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 overflow-hidden flex flex-col">
      <ExamTimer duration={examDurationMinutes} onTimeUp={handleTimeUp} />

      {startError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm">
          {startError}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col mt-10 mb-32 px-4 md:px-8">
        <ExamQuestion
          mock={currentMock}
          sectionType={selectedSection}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
          onSelectQuestion={handleSelectQuestion}
          onBackToSections={handleBackToSections}
        />
      </div>
    </div>
  );
}
