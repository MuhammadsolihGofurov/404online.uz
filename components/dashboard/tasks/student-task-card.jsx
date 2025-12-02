import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import {
  Calendar,
  Clock,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { formatDate } from "@/utils/funcs";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { ButtonSpinner } from "@/components/custom/loading";

export function StudentTaskCard({ task, submission, onRefresh }) {
  const intl = useIntl();
  const router = useRouter();
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const {
    id,
    title,
    task_type,
    deadline,
    duration_minutes,
    start_time,
    end_time,
    is_exam_active,
  } = task;

  // Check eligibility when component mounts or task changes
  // Check for EXAM_MOCK and PRACTICE_MOCK (both can have restrictions)
  useEffect(() => {
    if ((task_type === "EXAM_MOCK" || task_type === "PRACTICE_MOCK") && !submission) {
      checkEligibility();
    }
  }, [id, task_type]);

  const checkEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const response = await authAxios.get(`/tasks/${id}/check-submission-eligibility/`);
      setEligibility(response.data);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setEligibility({
        can_submit: false,
        reason: error?.response?.data?.reason || "Unable to check eligibility",
      });
    } finally{
      setCheckingEligibility(false);
    }
  };

  // Helper functions
  const formatType = (type) => {
    return type
      ?.replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "EXAM_MOCK":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "PRACTICE_MOCK":
        return "bg-green-50 text-green-700 border-green-100";
      case "CUSTOM_MOCK":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "QUIZ":
        return "bg-orange-50 text-orange-700 border-orange-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const isExpired = deadline ? new Date(deadline) < new Date() : false;
  const isDeadlineSoon =
    deadline &&
    new Date(deadline) > new Date() &&
    new Date(deadline) - new Date() < 24 * 60 * 60 * 1000; // Less than 24 hours

  // Determine task status
  const getTaskStatus = () => {
    if (!submission) return null;
    switch (submission.status) {
      case "DRAFT":
        return { label: "In Progress", color: "text-blue-600 bg-blue-50" };
      case "PENDING":
        return { label: "Submitted", color: "text-yellow-600 bg-yellow-50" };
      case "APPROVED":
        return { label: "Approved", color: "text-green-600 bg-green-50" };
      case "REJECTED":
        return { label: "Rejected", color: "text-red-600 bg-red-50" };
      case "RESUBMISSION":
        return { label: "Resubmission", color: "text-orange-600 bg-orange-50" };
      default:
        return null;
    }
  };

  const status = getTaskStatus();

  // Determine action button
  const getActionButton = () => {
    // If completed (APPROVED, REJECTED, RESUBMISSION)
    if (
      submission &&
      ["APPROVED", "REJECTED", "RESUBMISSION"].includes(submission.status)
    ) {
      return (
        <Link
          href={`/dashboard/submissions/${submission.id}`}
          className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <FileText size={16} />
          {intl.formatMessage({ id: "View Results" })}
        </Link>
      );
    }

    // EXAM_MOCK specific logic
    if (task_type === "EXAM_MOCK") {
      if (checkingEligibility) {
        return (
          <button
            disabled
            className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ButtonSpinner />
            {intl.formatMessage({ id: "Checking..." })}
          </button>
        );
      }

      if (eligibility?.can_submit) {
        if (is_exam_active) {
          return (
            <Link
              href={`/dashboard/exam-room/${id}`}
              className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              {intl.formatMessage({ id: "Enter Exam Room" })}
            </Link>
          );
        } else if (start_time && new Date(start_time) > new Date()) {
          // Exam hasn't started yet
          return (
            <button
              disabled
              className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed"
            >
              {intl.formatMessage(
                { id: "Starts at {time}" },
                {
                  time: intl.formatDate(start_time, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }),
                }
              )}
            </button>
          );
        } else {
          return (
            <button
              disabled
              className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed"
            >
              {intl.formatMessage({ id: "Exam Closed" })}
            </button>
          );
        }
      } else {
        // Check if reason is deadline-related
        const isDeadlinePassed = eligibility?.reason?.toLowerCase().includes("deadline");
        return (
          <button
            disabled
            className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed"
            title={eligibility?.reason}
          >
            {isDeadlinePassed
              ? intl.formatMessage({ id: "Deadline Passed" })
              : eligibility?.reason || intl.formatMessage({ id: "Not Available" })}
          </button>
        );
      }
    }

    // PRACTICE_MOCK: Only show "Start Practice" button (no Practice Mode)
    if (task_type === "PRACTICE_MOCK") {
      if (checkingEligibility) {
        return (
          <button
            disabled
            className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ButtonSpinner />
            {intl.formatMessage({ id: "Checking..." })}
          </button>
        );
      }

      // If not eligible (e.g., deadline passed), show reason
      if (eligibility && !eligibility.can_submit) {
        const isDeadlinePassed = eligibility.reason?.toLowerCase().includes("deadline");
        return (
          <button
            disabled
            className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed"
            title={eligibility.reason}
          >
            {isDeadlinePassed
              ? intl.formatMessage({ id: "Deadline Passed" })
              : eligibility.reason || intl.formatMessage({ id: "Not Available" })}
          </button>
        );
      }

      // Eligible - show Start Practice button
      if (submission?.status === "DRAFT") {
        return (
          <Link
            href={`/dashboard/exam-room/${id}`}
            className="w-full px-4 py-2.5 bg-main text-white rounded-xl font-medium text-sm hover:bg-main/90 transition-colors flex items-center justify-center gap-2"
          >
            <Play size={16} />
            {intl.formatMessage({ id: "Continue" })}
          </Link>
        );
      }

      return (
        <Link
          href={`/dashboard/exam-room/${id}`}
          className="w-full px-4 py-2.5 bg-main text-white rounded-xl font-medium text-sm hover:bg-main/90 transition-colors flex items-center justify-center gap-2"
        >
          <Play size={16} />
          {intl.formatMessage({ id: "Start Practice" })}
        </Link>
      );
    }

    // CUSTOM_MOCK, QUIZ: Check deadline
    if (isExpired) {
      return (
        <button
          disabled
          className="w-full px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed"
        >
          {intl.formatMessage({ id: "Deadline Passed" })}
        </button>
      );
    }

    if (submission?.status === "DRAFT") {
      return (
        <Link
          href={`/dashboard/exam-room/${id}`}
          className="w-full px-4 py-2.5 bg-main text-white rounded-xl font-medium text-sm hover:bg-main/90 transition-colors flex items-center justify-center gap-2"
        >
          <Play size={16} />
          {intl.formatMessage({ id: "Continue" })}
        </Link>
      );
    }

    return (
      <Link
        href={`/dashboard/exam-room/${id}`}
        className="w-full px-4 py-2.5 bg-main text-white rounded-xl font-medium text-sm hover:bg-main/90 transition-colors flex items-center justify-center gap-2"
      >
        <Play size={16} />
        {intl.formatMessage({ id: "Start" })}
      </Link>
    );
  };

  return (
    <div className="relative flex flex-col justify-between p-5 transition-all duration-300 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
      {/* Header: Badges & Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {/* Type Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getTypeColor(
              task_type
            )}`}
          >
            {formatType(task_type)}
          </span>

          {/* Expired Badge */}
          {isExpired && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
              {intl.formatMessage({ id: "Expired" })}
            </span>
          )}

          {/* Status Badge */}
          {status && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.color}`}
            >
              {status.label}
            </span>
          )}

          {/* Active Exam Indicator */}
          {is_exam_active && task_type === "EXAM_MOCK" && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Body: Title & Meta */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-bold leading-tight text-gray-900 line-clamp-2">
          {title}
        </h3>

        <div className="space-y-2.5">
          {/* Deadline */}
          <div
            className={`flex items-center gap-2 text-sm ${isExpired
              ? "text-red-500"
              : isDeadlineSoon
                ? "text-orange-500"
                : "text-gray-500"
              }`}
          >
            <Calendar size={16} className="shrink-0" />
            <span>
              {task_type === "EXAM_MOCK" && start_time ? (
                <>
                  <span className="font-semibold text-gray-700">
                    {intl.formatMessage({ id: "Starts" })}:
                  </span>{" "}
                  {intl.formatDate(start_time, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </>
              ) : deadline ? (
                <>
                  {intl.formatDate(deadline, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                  {isDeadlineSoon && !isExpired && (
                    <span className="ml-2 text-xs font-semibold">
                      ({intl.formatMessage({ id: "Due Soon" })})
                    </span>
                  )}
                </>
              ) : (
                <span className="italic text-gray-400">
                  {intl.formatMessage({ id: "No deadline" })}
                </span>
              )}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} className="shrink-0" />
            <span>
              {duration_minutes > 0
                ? `${Math.floor(duration_minutes / 60)}h ${duration_minutes % 60
                }m`
                : intl.formatMessage({ id: "No time limit" })}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        {getActionButton()}
      </div>

      {/* Decoration Gradient on Hover */}
      <div className="absolute top-0 left-0 w-full h-1 transition-opacity opacity-0 bg-gradient-to-r from-transparent via-primary to-transparent hover:opacity-100 rounded-t-xl" />
    </div >
  );
}

