import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import ExamTimer from "./exam-timer";
import QuestionDisplay from "./question-display";

export default function ExamInterface({ task, user }) {
  const intl = useIntl();
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (task?.submission_status === "IN_PROGRESS") {
      setHasStarted(true);
      // Set remaining time if available
      if (task?.time_remaining) {
        setTimeRemaining(task.time_remaining * 60); // Convert minutes to seconds
      } else if (task?.duration_minutes) {
        setTimeRemaining(task.duration_minutes * 60);
      }
    }
  }, [task]);

  const handleStartTask = async () => {
    try {
      await authAxios.post(`/students/tasks/${task.id}/start/`);
      setHasStarted(true);
      if (task?.duration_minutes) {
        setTimeRemaining(task.duration_minutes * 60);
      }
      toast.success(intl.formatMessage({ id: "Task started successfully!" }));
    } catch (error) {
      console.error("Error starting task:", error);
      toast.error(
        error.response?.data?.message ||
          intl.formatMessage({ id: "Failed to start task" })
      );
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    const confirmSubmit = window.confirm(
      intl.formatMessage({ id: "Are you sure you want to submit?" }) +
        "\n" +
        intl.formatMessage({ id: "Once submitted, you cannot change your answers" })
    );

    if (!confirmSubmit) return;

    try {
      setIsSubmitting(true);

      // Prepare submission data
      const submissionData = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: parseInt(questionId),
          answer: answer,
        })),
      };

      await authAxios.post(
        `/students/tasks/${task.id}/submit/`,
        submissionData
      );

      toast.success(intl.formatMessage({ id: "Submission successful!" }));

      // Redirect back to task list
      setTimeout(() => {
        router.push("/dashboard/student-tasks");
      }, 2000);
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error(
        error.response?.data?.message ||
          intl.formatMessage({ id: "Failed to submit" })
      );
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    // Auto-submit when time runs out
    handleSubmit();
  };

  const questions = task?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // If task not started yet, show start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {task?.title}
            </h1>
            <p className="text-gray-600">{task?.description}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">
                {intl.formatMessage({ id: "Type" })}:
              </span>
              <span className="text-gray-900 font-semibold">
                {task?.task_type?.replace(/_/g, " ")}
              </span>
            </div>

            {task?.duration_minutes && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  {intl.formatMessage({ id: "Duration" })}:
                </span>
                <span className="text-gray-900 font-semibold flex items-center gap-2">
                  <Clock size={18} />
                  {Math.floor(task.duration_minutes / 60)}h {task.duration_minutes % 60}m
                </span>
              </div>
            )}

            {task?.deadline && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  {intl.formatMessage({ id: "Deadline" })}:
                </span>
                <span className="text-gray-900 font-semibold">
                  {intl.formatDate(task.deadline, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">
                {intl.formatMessage({ id: "Questions" })}:
              </span>
              <span className="text-gray-900 font-semibold">
                {questions.length}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  {intl.formatMessage({
                    id: "You cannot leave this page until you finish",
                  })}
                </p>
                <p className="text-xs text-yellow-700">
                  Make sure you have enough time to complete this task.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTask}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {intl.formatMessage({ id: "Start Exam" })}
          </button>
        </div>
      </div>
    );
  }

  // Main exam interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with timer */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{task?.title}</h1>
              <p className="text-sm text-gray-600">
                {intl.formatMessage({ id: "Question" })} {currentQuestionIndex + 1}{" "}
                {intl.formatMessage({ id: "of" })} {questions.length}
              </p>
            </div>

            {timeRemaining !== null && (
              <ExamTimer
                initialTime={timeRemaining}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>
        </div>
      </div>

      {/* Question display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) =>
              handleAnswerChange(currentQuestion.id, answer)
            }
          />
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() =>
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
            }
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {intl.formatMessage({ id: "Previous" })}
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {intl.formatMessage({ id: "Submit Answers" })}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex(
                  Math.min(questions.length - 1, currentQuestionIndex + 1)
                )
              }
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {intl.formatMessage({ id: "Next" })}
            </button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-primary text-white"
                    : answers[q.id]
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
