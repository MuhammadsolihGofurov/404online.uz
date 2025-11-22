import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useState, useMemo } from "react";
import { Select } from "@/components/custom/details";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { ButtonSpinner } from "@/components/custom/loading";
import { formatDate } from "@/utils/funcs";
import Link from "next/link";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

function ReviewsPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const [taskTypeFilter, setTaskTypeFilter] = useState("");
  const [studentNameFilter, setStudentNameFilter] = useState("");
  const [selectedSubmissions, setSelectedSubmissions] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (taskTypeFilter) params.append("task__task_type", taskTypeFilter);
    if (studentNameFilter) params.append("student__full_name__icontains", studentNameFilter);
    return params.toString();
  }, [taskTypeFilter, studentNameFilter]);

  // Fetch pending submissions
  const { data: submissionsData, isLoading, mutate } = useSWR(
    ["/reviews/", router.locale, queryParams],
    ([url, locale]) =>
      fetcher(
        `${url}${queryParams ? `?${queryParams}` : ""}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const submissions = useMemo(() => {
    if (!submissionsData) return [];
    return Array.isArray(submissionsData) ? submissionsData : submissionsData?.results || [];
  }, [submissionsData]);

  // Filter by student name (client-side for now, can be moved to backend)
  const filteredSubmissions = useMemo(() => {
    if (!studentNameFilter) return submissions;
    const searchTerm = studentNameFilter.toLowerCase();
    return submissions.filter((sub) => {
      const studentName = sub.student?.full_name || sub.student?.email || "";
      return studentName.toLowerCase().includes(searchTerm);
    });
  }, [submissions, studentNameFilter]);

  // Task type options
  const taskTypeOptions = [
    { value: "", name: intl.formatMessage({ id: "All Types" }) },
    { value: "EXAM_MOCK", name: "Exam Mock" },
    { value: "PRACTICE_MOCK", name: "Practice Mock" },
    { value: "CUSTOM_MOCK", name: "Custom Mock" },
    { value: "QUIZ", name: "Quiz" },
  ];

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedSubmissions.size === 0) {
      toast.warning(intl.formatMessage({ id: "Please select at least one submission" }));
      return;
    }

    try {
      setBulkLoading(true);
      const response = await authAxios.post("/reviews/bulk_evaluate/", {
        submission_ids: Array.from(selectedSubmissions),
        status: "APPROVED",
      });

      if (response.data.successful > 0) {
        toast.success(
          intl.formatMessage(
            { id: "Successfully approved {count} submission(s)" },
            { count: response.data.successful }
          )
        );
        setSelectedSubmissions(new Set());
        mutate(); // Refresh list
      }

      if (response.data.failed > 0) {
        toast.warning(
          intl.formatMessage(
            { id: "{count} submission(s) could not be approved" },
            { count: response.data.failed }
          )
        );
      }
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast.error(
        error?.response?.data?.detail ||
          intl.formatMessage({ id: "Failed to approve submissions" })
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // Toggle selection
  const toggleSelection = (submissionId) => {
    const newSet = new Set(selectedSubmissions);
    if (newSet.has(submissionId)) {
      newSet.delete(submissionId);
    } else {
      newSet.add(submissionId);
    }
    setSelectedSubmissions(newSet);
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s) => s.id)));
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return {
          label: intl.formatMessage({ id: "Pending" }),
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <Clock size={14} />,
        };
      case "RESUBMISSION":
        return {
          label: intl.formatMessage({ id: "Resubmission" }),
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: <AlertCircle size={14} />,
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
          <p className="text-gray-600">{intl.formatMessage({ id: "Loading reviews..." })}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={info?.seo_home_title || "Pending Reviews"}
        description=""
        keywords=""
      />
      <DashboardLayout user={user}>
        <Wrapper
          title={intl.formatMessage({ id: "Pending Reviews" })}
          isLink
          body={"Dashboard"}
        >
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select
                    title={intl.formatMessage({ id: "Task Type" })}
                    options={taskTypeOptions}
                    value={taskTypeFilter}
                    onChange={setTaskTypeFilter}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {intl.formatMessage({ id: "Student Name" })}
                  </label>
                  <input
                    type="text"
                    value={studentNameFilter}
                    onChange={(e) => setStudentNameFilter(e.target.value)}
                    placeholder={intl.formatMessage({ id: "Search by student name..." })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  {selectedSubmissions.size > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {bulkLoading ? (
                        <>
                          <ButtonSpinner size="sm" />
                          {intl.formatMessage({ id: "Approving..." })}
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          {intl.formatMessage(
                            { id: "Bulk Approve ({count})" },
                            { count: selectedSubmissions.size }
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4">
                        <input
                          type="checkbox"
                          checked={
                            filteredSubmissions.length > 0 &&
                            selectedSubmissions.size === filteredSubmissions.length
                          }
                          onChange={toggleAll}
                          className="w-4 h-4 text-main border-gray-300 rounded focus:ring-main"
                        />
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Student" })}
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Task Title" })}
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Task Type" })}
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Submitted At" })}
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Status" })}
                      </th>
                      <th className="p-4 text-sm font-semibold text-gray-700 text-center">
                        {intl.formatMessage({ id: "Action" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((submission) => {
                        const statusBadge = getStatusBadge(submission.status);
                        const studentName =
                          submission.student?.full_name ||
                          submission.student?.email ||
                          intl.formatMessage({ id: "Unknown Student" });
                        const taskTitle =
                          submission.task?.title ||
                          intl.formatMessage({ id: "Unknown Task" });
                        const taskType = submission.task?.task_type || "";

                        return (
                          <tr
                            key={submission.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedSubmissions.has(submission.id)}
                                onChange={() => toggleSelection(submission.id)}
                                className="w-4 h-4 text-main border-gray-300 rounded focus:ring-main"
                              />
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900">{studentName}</div>
                              {submission.student?.email && (
                                <div className="text-sm text-gray-500">
                                  {submission.student.email}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900">{taskTitle}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                {taskType.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {submission.completed_at
                                ? formatDate(submission.completed_at)
                                : submission.created_at
                                ? formatDate(submission.created_at)
                                : "-"}
                            </td>
                            <td className="p-4">
                              {statusBadge && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${statusBadge.color}`}
                                >
                                  {statusBadge.icon}
                                  {statusBadge.label}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Link
                                href={`/dashboard/reviews/${submission.id}`}
                                className="inline-flex items-center px-4 py-2 bg-main text-white rounded-lg font-medium text-sm hover:bg-main/90 transition-colors"
                              >
                                {intl.formatMessage({ id: "Grade" })}
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-gray-500"
                        >
                          {intl.formatMessage({ id: "No pending submissions found" })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
    seo_home_title: "Pending Reviews",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(ReviewsPage, ["TEACHER", "ASSISTANT", "CENTER_ADMIN"]);

