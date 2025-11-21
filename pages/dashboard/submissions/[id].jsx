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
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import Link from "next/link";

function SubmissionDetailPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { id } = router.query;
  const [normalizedData, setNormalizedData] = useState(null);
  const [answersMap, setAnswersMap] = useState({});

  // Fetch submission details
  const { data: submission, isLoading, error } = useSWR(
    id ? ["/submissions/", router.locale, id] : null,
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

  // Determine if we should show correctness indicators
  const showCorrectness = useMemo(() => {
    if (!submission || !user) return false;
    
    // Backend already filters scores, but we check for UI purposes
    const isStudent = user.role === "STUDENT" || user.role === "GUEST";
    const hideResults = submission.task?.hide_results_from_student;
    
    // Show correctness only if:
    // 1. User is not a student/guest, OR
    // 2. Results are not hidden from students
    return !isStudent || !hideResults;
  }, [submission, user]);

  // Get status badge
  const getStatusBadge = () => {
    if (!submission) return null;
    
    switch (submission.status) {
      case "APPROVED":
        return {
          label: intl.formatMessage({ id: "Approved" }),
          color: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle size={16} />,
        };
      case "PENDING":
        return {
          label: intl.formatMessage({ id: "Pending Review" }),
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <Clock size={16} />,
        };
      case "REJECTED":
        return {
          label: intl.formatMessage({ id: "Rejected" }),
          color: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle size={16} />,
        };
      case "RESUBMISSION":
        return {
          label: intl.formatMessage({ id: "Resubmission Required" }),
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: <AlertCircle size={16} />,
        };
      case "DRAFT":
        return {
          label: intl.formatMessage({ id: "Draft" }),
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <FileText size={16} />,
        };
      default:
        return null;
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
            href="/dashboard/my-tasks"
            className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90"
          >
            {intl.formatMessage({ id: "Back to My Tasks" })}
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge();
  const taskTitle = submission.task?.title || intl.formatMessage({ id: "Unknown Task" });
  const studentName = submission.student?.full_name || submission.student?.email || intl.formatMessage({ id: "Unknown Student" });

  return (
    <>
      <Seo
        title={`Submission - ${taskTitle}`}
        description=""
        keywords=""
      />
      <DashboardLayout user={user}>
        <Wrapper
          title={intl.formatMessage({ id: "Submission Details" })}
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
                {statusBadge && (
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusBadge.color}`}
                  >
                    {statusBadge.icon}
                    <span className="font-semibold">{statusBadge.label}</span>
                  </div>
                )}
              </div>

              {/* Scores Section */}
              {(submission.raw_score !== null && submission.raw_score !== undefined) ||
              (submission.band_score !== null && submission.band_score !== undefined) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  {submission.raw_score !== null && submission.raw_score !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        {intl.formatMessage({ id: "Raw Score" })}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {submission.raw_score}
                      </p>
                    </div>
                  )}
                  {submission.band_score !== null && submission.band_score !== undefined && (
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
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 italic">
                    {intl.formatMessage({ id: "Scores are not available" })}
                  </p>
                </div>
              )}

              {/* Feedback Section */}
              {submission.feedback && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {intl.formatMessage({ id: "Teacher Feedback" })}
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Questions Section */}
            {normalizedData && normalizedData.sections && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {intl.formatMessage({ id: "Answers" })}
                </h2>

                {normalizedData.sections.map((section, sectionIdx) => (
                  <div key={section.id || sectionIdx} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      {section.title}
                    </h3>

                    {section.questions?.map((question) => {
                      const userAnswer = answersMap[String(question.id)];
                      // For read-only view, we don't have correct answers from backend
                      // They would need to be fetched separately or included in submission response
                      const correctAnswer = null; // TODO: Fetch correct answers if needed

                      return (
                        <div
                          key={question.id}
                          className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <QuestionRendererReadOnly
                            question={question}
                            userAnswer={userAnswer}
                            correctAnswer={correctAnswer}
                            showCorrectness={showCorrectness}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Back Button */}
            <div className="flex justify-end">
              <Link
                href={
                  user?.role === "STUDENT" || user?.role === "GUEST"
                    ? "/dashboard/my-tasks"
                    : "/dashboard/tasks"
                }
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {intl.formatMessage({ id: "Back" })}
              </Link>
            </div>
          </div>
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Submission Details",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(SubmissionDetailPage, [
  "STUDENT",
  "GUEST",
  "TEACHER",
  "ASSISTANT",
  "CENTER_ADMIN",
]);

