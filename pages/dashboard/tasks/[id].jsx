import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useModal } from "@/context/modal-context";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  Play,
  Square,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { ButtonSpinner } from "@/components/custom/loading";
import { useState, useEffect } from "react";

function TaskDetailPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const { openModal, modalClosed } = useModal();
  const { id } = router.query;
  const [examActionLoading, setExamActionLoading] = useState(false);
  const [activeStudents, setActiveStudents] = useState([]);
  const [activeStudentsLoading, setActiveStudentsLoading] = useState(false);

  // Fetch task details
  const { data: task, isLoading, mutate } = useSWR(
    id ? ["/tasks/", router.locale, id, modalClosed] : null,
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

  // Fetch active students (for teachers/admins)
  const fetchActiveStudents = async () => {
    if (!id || !["CENTER_ADMIN", "TEACHER", "ASSISTANT"].includes(user?.role)) {
      return;
    }
    try {
      setActiveStudentsLoading(true);
      const response = await authAxios.get(`/tasks/${id}/active_students/`);
      setActiveStudents(response.data.active_students || []);
    } catch (error) {
      console.error("Error fetching active students:", error);
    } finally {
      setActiveStudentsLoading(false);
    }
  };

  // Poll active students every 5 seconds if exam is active
  useEffect(() => {
    if (task?.is_exam_active && ["CENTER_ADMIN", "TEACHER", "ASSISTANT"].includes(user?.role)) {
      fetchActiveStudents();
      const interval = setInterval(fetchActiveStudents, 5000);
      return () => clearInterval(interval);
    }
  }, [task?.is_exam_active, id, user?.role]);

  const handleDelete = () => {
    openModal(
      "confirmModal",
      {
        title: "Delete task",
        description:
          "Are you sure you want to delete this task? This action cannot be undone.",
        onConfirm: async () => {
          await authAxios.delete(`/tasks/${id}/`);
          toast.success(intl.formatMessage({ id: "Task deleted successfully!" }));
          router.push("/dashboard/tasks");
        },
      },
      "short"
    );
  };

  const handleEdit = () => {
    openModal(
      "taskModal",
      {
        id: task.id,
        old_data: task,
      },
      "big"
    );
  };

  const handleStartExam = async () => {
    try {
      setExamActionLoading(true);
      await authAxios.post(`/tasks/${id}/start_exam/`);
      toast.success(intl.formatMessage({ id: "Exam started successfully!" }));
      mutate(); // Refresh task data
      fetchActiveStudents();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        intl.formatMessage({ id: "Failed to start exam" });
      toast.error(errorMsg);
    } finally {
      setExamActionLoading(false);
    }
  };

  const handleStopExam = async () => {
    try {
      setExamActionLoading(true);
      await authAxios.post(`/tasks/${id}/stop_exam/`);
      toast.success(intl.formatMessage({ id: "Exam stopped successfully!" }));
      mutate(); // Refresh task data
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        intl.formatMessage({ id: "Failed to stop exam" });
      toast.error(errorMsg);
    } finally {
      setExamActionLoading(false);
    }
  };

  const handlePublishResults = async () => {
    try {
      setExamActionLoading(true);
      const response = await authAxios.post(`/tasks/${id}/publish_results/`);
      toast.success(
        intl.formatMessage(
          { id: "Results published! Updated {count} submissions." },
          { count: response.data.updated_count }
        )
      );
      mutate(); // Refresh task data
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        intl.formatMessage({ id: "Failed to publish results" });
      toast.error(errorMsg);
    } finally {
      setExamActionLoading(false);
    }
  };

  const formatType = (type) => {
    return type
      ?.replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "EXAM_MOCK":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "PRACTICE_MOCK":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "CUSTOM_MOCK":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "QUIZ":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const canEdit =
    user?.role === "CENTER_ADMIN" ||
    (user?.role !== "STUDENT" && (task?.created_by?.id || task?.created_by) === user?.id);
  
  // Exam Controls Permission: Center Admin OR Task Owner
  const canControlExam = canEdit; 

  if (loading || isLoading) {
    return (
      <DashboardLayout user={user} loading={loading}>
        <div className="bg-white rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout user={user} loading={loading}>
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-500">{intl.formatMessage({ id: "Task not found" })}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Seo
        title={task.title || info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={task.title}
          isLink
          body="Dashboard"
          backUrl="/dashboard/tasks"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${getTypeColor(
                    task.task_type
                  )}`}
                >
                  {formatType(task.task_type)}
                </span>
                {task.is_exam_active && (
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-green-100 text-green-700 border border-green-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {intl.formatMessage({ id: "Live" })}
                  </span>
                )}
                {!task.is_visible && (
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200">
                    <AlertCircle size={16} />
                    {intl.formatMessage({ id: "Hidden" })}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                    {intl.formatMessage({ id: "Edit" })}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                    {intl.formatMessage({ id: "Delete" })}
                  </button>
                </div>
              )}
            </div>

            {/* Task Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deadline */}
              {task.deadline && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">
                      {intl.formatMessage({ id: "Deadline" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {intl.formatDate(task.deadline, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Duration */}
              {task.duration_minutes > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">
                      {intl.formatMessage({ id: "Duration" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {Math.floor(task.duration_minutes / 60)}h{" "}
                      {task.duration_minutes % 60}m
                    </p>
                  </div>
                </div>
              )}

              {/* Start Time (for EXAM_MOCK) */}
              {task.start_time && (
                <div className="flex items-start gap-3">
                  <Play className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">
                      {intl.formatMessage({ id: "Start Time" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {intl.formatDate(task.start_time, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* End Time (for EXAM_MOCK) */}
              {task.end_time && (
                <div className="flex items-start gap-3">
                  <Square className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">
                      {intl.formatMessage({ id: "End Time" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {intl.formatDate(task.end_time, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Max Attempts */}
              <div className="flex items-start gap-3">
                <CheckCircle className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">
                    {intl.formatMessage({ id: "Max Attempts" })}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {task.max_attempts === 0
                      ? intl.formatMessage({ id: "Unlimited" })
                      : task.max_attempts}
                  </p>
                </div>
              </div>

              {/* Active Students Count */}
              {["CENTER_ADMIN", "TEACHER", "ASSISTANT"].includes(user?.role) && (
                <div className="flex items-start gap-3">
                  <Users className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">
                      {intl.formatMessage({ id: "Active Students" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {task.active_students_count || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Exam Controls (for Teachers/Admins) */}
            {task.task_type === "EXAM_MOCK" &&
              canControlExam && (
                <div className="pt-6 border-t">
                  <div className="flex items-center gap-4">
                    {!task.is_exam_active ? (
                      <button
                        onClick={handleStartExam}
                        disabled={examActionLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {examActionLoading ? (
                          <ButtonSpinner size="sm" />
                        ) : (
                          <Play size={18} />
                        )}
                        {intl.formatMessage({ id: "Start Exam" })}
                      </button>
                    ) : (
                      <button
                        onClick={handleStopExam}
                        disabled={examActionLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {examActionLoading ? (
                          <ButtonSpinner size="sm" />
                        ) : (
                          <Square size={18} />
                        )}
                        {intl.formatMessage({ id: "Stop Exam" })}
                      </button>
                    )}

                    {/* Publish Results Button */}
                    {!task.is_exam_active && (
                      <button
                        onClick={handlePublishResults}
                        disabled={examActionLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {examActionLoading ? (
                          <ButtonSpinner size="sm" />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                        {intl.formatMessage({ id: "Publish Results" })}
                      </button>
                    )}
                  </div>
                </div>
              )}

            {/* Active Students List (for Teachers/Admins when exam is active) */}
            {task.is_exam_active &&
              ["CENTER_ADMIN", "TEACHER", "ASSISTANT"].includes(user?.role) &&
              activeStudents.length > 0 && (
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {intl.formatMessage({ id: "Active Students" })}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                            {intl.formatMessage({ id: "Student" })}
                          </th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                            {intl.formatMessage({ id: "Joined At" })}
                          </th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                            {intl.formatMessage({ id: "Time Spent" })}
                          </th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                            {intl.formatMessage({ id: "Current Section" })}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeStudents.map((student) => (
                          <tr key={student.student_id} className="border-b">
                            <td className="py-2 px-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.student_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {student.student_email}
                                </p>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-sm text-gray-600">
                              {intl.formatDate(student.joined_at, {
                                hour: "numeric",
                                minute: "numeric",
                              })}
                            </td>
                            <td className="py-2 px-4 text-sm text-gray-600">
                              {student.time_spent}
                            </td>
                            <td className="py-2 px-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {student.current_section || "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Assigned Groups/Students */}
            {(task.assigned_groups?.length > 0 ||
              task.assigned_students?.length > 0) && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {intl.formatMessage({ id: "Assignments" })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.assigned_groups?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        {intl.formatMessage({ id: "Assigned Groups" })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {task.assigned_groups.map((group) => (
                          <span
                            key={group.id}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                          >
                            {group.name || group.id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {task.assigned_students?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        {intl.formatMessage({ id: "Assigned Students" })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {task.assigned_students.map((student) => (
                          <span
                            key={student.id}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                          >
                            {student.full_name || student.email || student.id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Created Info */}
            <div className="pt-6 border-t text-sm text-gray-500">
              <p>
                {intl.formatMessage({ id: "Created" })}: {formatDate(task.created_at)}
              </p>
              {task.created_by && (
                <p>
                  {intl.formatMessage({ id: "Created by" })}:{" "}
                  {task.created_by.full_name || task.created_by.email}
                </p>
              )}
            </div>
          </div>
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Task Details",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(TaskDetailPage, [
  "CENTER_ADMIN",
  "TEACHER",
  "ASSISTANT",
  "STUDENT",
  "GUEST",
]);

