import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { Clock, Calendar, ArrowRight, AlertCircle, Play, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatDate } from "@/utils/funcs";

function StudentExamsPage({ info, user, loading }) {
  const intl = useIntl();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch EXAM_MOCK tasks
  const { data: responseData, isLoading } = useSWR(
    user ? ["/tasks/", user.role] : null,
    ([url]) => fetcher(`${url}?task_type=EXAM_MOCK`, {}, {}, true)
  );

  // Handle pagination or direct array
  const tasks = Array.isArray(responseData) ? responseData : (responseData?.results || []);

  const getExamStatus = (task) => {
    const startTime = task.start_time ? new Date(task.start_time).getTime() : 0;
    const endTime = task.end_time ? new Date(task.end_time).getTime() : null;
    const isLive = task.is_exam_active;

    if (isLive) return "LIVE";
    
    // If finished/past deadline
    if (endTime && now > endTime) return "FINISHED";
    
    // If scheduled in future
    if (now < startTime) return "SCHEDULED";
    
    // If window started but not live (and not finished)
    if (now >= startTime) return "WAITING";

    return "UNKNOWN";
  };

  const getStatusCard = (task) => {
    const status = getExamStatus(task);
    const startTime = task.start_time ? new Date(task.start_time).getTime() : 0;

    switch (status) {
      case "LIVE":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 font-bold animate-pulse border border-red-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              {intl.formatMessage({ id: "EXAM LIVE" })}
            </span>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Play size={20} />
              {intl.formatMessage({ id: "Join Exam" })}
            </Link>
            <p className="text-xs text-gray-500">
              {intl.formatMessage({ id: "Strict Mode Enabled" })}
            </p>
          </div>
        );

      case "SCHEDULED":
        const timeDiff = startTime - now;
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <Calendar size={18} />
              <span className="font-semibold">
                {formatDate(task.start_time)}
              </span>
            </div>
            <div className="text-2xl font-mono font-bold text-gray-700">
              {days > 0 && `${days}d `}{hours}h {minutes}m
            </div>
            <p className="text-sm text-gray-500">
              {intl.formatMessage({ id: "until exam starts" })}
            </p>
          </div>
        );

      case "WAITING":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full">
              <Clock size={24} />
            </div>
            <h4 className="font-bold text-gray-900">
              {intl.formatMessage({ id: "Waiting Room Open" })}
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              {intl.formatMessage({ id: "Wait for the invigilator to start the exam" })}
            </p>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="w-full py-2.5 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors shadow-md shadow-yellow-200"
            >
              {intl.formatMessage({ id: "Enter Waiting Room" })}
            </Link>
          </div>
        );

      case "FINISHED":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-2 bg-gray-100 text-gray-500 rounded-full">
              <CheckCircle size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {intl.formatMessage({ id: "Exam Completed" })}
            </p>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1"
            >
              {intl.formatMessage({ id: "View Details" })} <ArrowRight size={16} />
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Seo
        title={info?.seo_home_title || "My Exams"}
        description={info?.data?.seo_home_description}
      />
      <DashboardLayout user={user} loading={loading}>
        <Wrapper
          title={intl.formatMessage({ id: "My Exams" })}
          isLink
          body={intl.formatMessage({ id: "Dashboard" })}
          backUrl="/dashboard"
        >
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse bg-gray-100" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {intl.formatMessage({ id: "No exams scheduled" })}
                </h3>
                <p className="text-gray-500 mt-1">
                  {intl.formatMessage({ id: "You don't have any upcoming exams assigned." })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full transition-shadow hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider">
                          {intl.formatMessage({ id: "Exam Mock" })}
                        </span>
                        {task.duration_minutes > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={14} />
                            {Math.floor(task.duration_minutes / 60)}h {task.duration_minutes % 60}m
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        {intl.formatMessage({ id: "Hosted by" })} {task.center?.name || intl.formatMessage({ id: "Center" })}
                      </p>
                    </div>

                    <div className="mt-auto border-t pt-6">
                      {getStatusCard(task)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "My Exams",
    seo_home_keywords: "exams, ielts, mock tests",
    seo_home_description: "View your scheduled and active exams",
  };
  return { props: { info } };
}

export default withAuthGuard(StudentExamsPage, ["STUDENT", "GUEST"]);

