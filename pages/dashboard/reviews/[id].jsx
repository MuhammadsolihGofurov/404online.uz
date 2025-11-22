import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useState, useEffect, useMemo } from "react";
import { ExamDataNormalizer } from "@/components/exam/exam-data-normalizer";
import { QuestionRendererReadOnly } from "@/components/exam/question-renderer-readonly";
import { Input } from "@/components/custom/details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { ButtonSpinner } from "@/components/custom/loading";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import Link from "next/link";

function ReviewDetailPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { id } = router.query;
  const [normalizedData, setNormalizedData] = useState(null);
  const [answersMap, setAnswersMap] = useState({});
  const [feedback, setFeedback] = useState("");
  const [manualScore, setManualScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  // Fetch submission details
  const { data: submission, isLoading, error, mutate } = useSWR(
    id ? ["/reviews/", router.locale, id] : null,
    ([url, locale]) =>
      fetcher(
        `${url}${id}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Fetch task details (needed for questions)
  const { data: task } = useSWR(
    submission?.task?.id
      ? ["/tasks/", router.locale, submission.task.id]
      : null,
    async ([url, locale, taskId]) => {
      const taskData = await fetcher(
        `${url}${taskId}/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      );

      // If task has mocks (not QUIZ), fetch full mock details
      if (taskData && taskData.task_type !== "QUIZ" && taskData.mocks && taskData.mocks.length > 0) {
        const mockIds = taskData.mocks;
        const mockDetails = await Promise.all(
          mockIds.map((mockId) =>
            fetcher(
              `/mocks/${mockId}/`,
              {
                headers: {
                  "Accept-Language": locale,
                },
              },
              {},
              true
            ).catch((err) => {
              console.error(`Error fetching mock ${mockId}:`, err);
              return null;
            })
          )
        );
        taskData.mocks = mockDetails.filter(Boolean);
      }

      return taskData;
    }
  );

  // Normalize task data when loaded
  useEffect(() => {
    if (task) {
      const normalized = ExamDataNormalizer.normalize(task);
      setNormalizedData(normalized);
    }
  }, [task]);

  // Create answers map from submission
  useEffect(() => {
    if (submission?.answers) {
      const map = {};
      submission.answers.forEach((answer) => {
        map[String(answer.question_id)] = answer.answer_data || {};
      });
      setAnswersMap(map);
    }
  }, [submission]);

  // Initialize feedback from existing submission
  useEffect(() => {
    if (submission?.feedback) {
      setFeedback(submission.feedback);
    }
  }, [submission]);

  // Extract correct answers from normalized data
  const getCorrectAnswer = useMemo(() => {
    if (!normalizedData) return () => null;
    
    const correctAnswersMap = {};
    
    normalizedData.sections?.forEach((section) => {
      section.questions?.forEach((question) => {
        if (question.correct_answer !== undefined && question.correct_answer !== null) {
          correctAnswersMap[String(question.id)] = question.correct_answer;
        }
      });
    });
    
    return (questionId) => correctAnswersMap[String(questionId)] || null;
  }, [normalizedData]);

  // Check if task has Writing component
  const hasWriting = useMemo(() => {
    if (!task) return false;
    
    if (task.task_type === "QUIZ") {
      // QUIZ tasks may require manual review
      return true;
    }
    
    // Check if any mock is WRITING type
    if (task.mocks && Array.isArray(task.mocks)) {
      return task.mocks.some((mock) => {
        if (typeof mock === "object" && mock.mock_type) {
          return mock.mock_type === "WRITING";
        }
        return false;
      });
    }
    
    // Check CUSTOM_MOCK for WRITING in selected_section_types
    if (task.task_type === "CUSTOM_MOCK" && task.selected_section_types) {
      return task.selected_section_types.includes("WRITING");
    }
    
    return false;
  }, [task]);

  // Handle evaluation submission
  const handleEvaluate = async (status) => {
    // Validation
    if (status === "RESUBMISSION" || status === "REJECTED") {
      if (!feedback.trim()) {
        toast.error(intl.formatMessage({ id: "Feedback is required for resubmission or rejection" }));
        return;
      }
    }

    if (status === "APPROVED" && hasWriting) {
      if (!manualScore || parseFloat(manualScore) < 0 || parseFloat(manualScore) > 9) {
        toast.error(intl.formatMessage({ id: "Manual score (0-9) is required for writing tasks" }));
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setSelectedStatus(status);

      const payload = {
        status,
        feedback: feedback.trim() || null,
      };

      if (status === "APPROVED" && manualScore) {
        payload.manual_score = parseFloat(manualScore);
      }

      const response = await authAxios.post(`/reviews/${id}/evaluate/`, payload);

      toast.success(
        intl.formatMessage(
          { id: "Submission {status} successfully" },
          { status: status.toLowerCase() }
        )
      );

      // Refresh submission data
      mutate();

      // Redirect back to reviews list after a short delay
      setTimeout(() => {
        router.push("/dashboard/reviews");
      }, 1500);
    } catch (error) {
      console.error("Evaluation error:", error);
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.manual_score?.[0] ||
        intl.formatMessage({ id: "Failed to evaluate submission" });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setSelectedStatus("");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">{intl.formatMessage({ id: "Loading submission..." })}</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {intl.formatMessage({ id: "Failed to load submission" })}
          </p>
          <Link
            href="/dashboard/reviews"
            className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90"
          >
            {intl.formatMessage({ id: "Back to Reviews" })}
          </Link>
        </div>
      </div>
    );
  }

  const taskTitle = submission.task?.title || intl.formatMessage({ id: "Unknown Task" });
  const studentName = submission.student?.full_name || submission.student?.email || intl.formatMessage({ id: "Unknown Student" });
  const taskType = submission.task?.task_type || "";

  return (
    <>
      <Seo
        title={`Review - ${taskTitle}`}
        description=""
        keywords=""
      />
      <DashboardLayout user={user}>
        <Wrapper
          title={intl.formatMessage({ id: "Review Submission" })}
          isLink
          body={"Dashboard"}
        >
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {taskTitle}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{studentName}</span>
                    </div>
                    {submission.completed_at && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {intl.formatDate(submission.completed_at, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href="/dashboard/reviews"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft size={18} />
                  {intl.formatMessage({ id: "Back to Reviews" })}
                </Link>
              </div>

              {/* Current Scores (if already graded) */}
              {(submission.raw_score !== null || submission.band_score !== null) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  {submission.raw_score !== null && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        {intl.formatMessage({ id: "Raw Score" })}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {submission.raw_score}
                      </p>
                    </div>
                  )}
                  {submission.band_score !== null && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        {intl.formatMessage({ id: "Band Score" })}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {submission.band_score}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Split Layout: Submission Content + Grading Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Submission Content (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Questions Section */}
                {normalizedData && normalizedData.sections && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      {intl.formatMessage({ id: "Student Answers" })}
                    </h2>

                    {normalizedData.sections.map((section, sectionIdx) => (
                      <div key={section.id || sectionIdx} className="mb-8 last:mb-0">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                          {section.title}
                        </h3>

                        {section.questions?.map((question) => {
                          const userAnswer = answersMap[String(question.id)];
                          const correctAnswer = getCorrectAnswer(question.id);

                          return (
                            <div
                              key={question.id}
                              className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <QuestionRendererReadOnly
                                question={question}
                                userAnswer={userAnswer}
                                correctAnswer={correctAnswer}
                                showCorrectness={true}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Grading Panel (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    {intl.formatMessage({ id: "Grading Panel" })}
                  </h2>

                  <div className="space-y-6">
                    {/* Manual Score Input (for Writing tasks) */}
                    {hasWriting && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {intl.formatMessage({ id: "Manual Score" })} (0-9)
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          step="0.5"
                          value={manualScore}
                          onChange={(e) => setManualScore(e.target.value)}
                          placeholder="7.5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {intl.formatMessage({ id: "Required for writing tasks" })}
                        </p>
                      </div>
                    )}

                    {/* Feedback Textarea */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {intl.formatMessage({ id: "Feedback" })}
                        <span className="text-red-500 ml-1">
                          {submission.status === "PENDING" ? "" : "*"}
                        </span>
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={intl.formatMessage({ id: "Enter feedback for the student..." })}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent resize-none"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {intl.formatMessage({ id: "Required for resubmission or rejection" })}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEvaluate("APPROVED")}
                        disabled={isSubmitting || (hasWriting && !manualScore)}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting && selectedStatus === "APPROVED" ? (
                          <>
                            <ButtonSpinner size="sm" />
                            {intl.formatMessage({ id: "Approving..." })}
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            {intl.formatMessage({ id: "Approve" })}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleEvaluate("RESUBMISSION")}
                        disabled={isSubmitting || !feedback.trim()}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting && selectedStatus === "RESUBMISSION" ? (
                          <>
                            <ButtonSpinner size="sm" />
                            {intl.formatMessage({ id: "Processing..." })}
                          </>
                        ) : (
                          <>
                            <AlertCircle size={18} />
                            {intl.formatMessage({ id: "Request Revision" })}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleEvaluate("REJECTED")}
                        disabled={isSubmitting || !feedback.trim()}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting && selectedStatus === "REJECTED" ? (
                          <>
                            <ButtonSpinner size="sm" />
                            {intl.formatMessage({ id: "Rejecting..." })}
                          </>
                        ) : (
                          <>
                            <XCircle size={18} />
                            {intl.formatMessage({ id: "Reject" })}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Review Submission",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(ReviewDetailPage, ["TEACHER", "ASSISTANT", "CENTER_ADMIN"]);

