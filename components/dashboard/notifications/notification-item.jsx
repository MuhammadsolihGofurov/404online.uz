import { NotificationItemSkeleton } from "@/components/skeleton";
import { HOMEWORKS_URL } from "@/mock/router";
import { authAxios } from "@/utils/axios";
import { formatDateToShort } from "@/utils/funcs";
import {
  ClipboardList,
  CheckCircle,
  Users,
  UserPlus,
  FileText,
  Bell,
  Megaphone,
  Clock,
  FolderKanban,
  MoveRight,
} from "lucide-react";
import Link from "next/link";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

const typeMeta = {
  TASK_ASSIGNED: {
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-100",
    label: "Task Assigned",
  },
  SUBMISSION_REVIEWED: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
    label: "Submission Reviewed",
  },
  INVITATION_APPROVED: {
    icon: CheckCircle,
    color: "text-emerald-600 bg-emerald-100",
    label: "Invitation Approved",
  },
  GROUP_ADDED: {
    icon: Users,
    color: "text-purple-600 bg-purple-100",
    label: "Added to Group",
  },
  NEW_SUBMISSION: {
    icon: FileText,
    color: "text-orange-600 bg-orange-100",
    label: "New Submission",
  },
  STUDENT_APPROVED: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
    label: "Student Approved",
  },
  ASSIGNED_TO_GROUP: {
    icon: Users,
    color: "text-indigo-600 bg-indigo-100",
    label: "Assigned to Group",
  },
  ASSIGNED_TO_TASK: {
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-100",
    label: "Assigned to Task",
  },
  CONTACT_REQUEST: {
    icon: UserPlus,
    color: "text-pink-600 bg-pink-100",
    label: "Contact Request",
  },
  PENDING_APPROVAL: {
    icon: Clock,
    color: "text-yellow-600 bg-yellow-100",
    label: "Pending Approval",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    color: "text-red-600 bg-red-100",
    label: "Announcement",
  },
};

export default function NotificationItem({ item }) {
  const meta = typeMeta[item.notification_type] || typeMeta.ANNOUNCEMENT;
  const Icon = meta.icon;
  const intl = useIntl();

  const handleClick = async (id, is_read) => {
    if (!is_read) {
      try {
        const response = await authAxios.post(
          `/notifications/${id}/mark_read/`,
        );
        toast.success(
          intl.formatMessage({ id: "Notification marked as read" }),
        );
      } catch (error) {
        toast.error(intl.formatMessage({ id: "Failed to mark notification" }));
      }
    } else {
      toast.warning(intl.formatMessage({ id: "This notification is read." }));
    }
  };

  return (
    <div
      className={`
        w-full p-4 rounded-xl bg-white
        flex items-start gap-4 transition cursor-pointer
        hover:bg-gray-50
        ${!item.is_read ? "border-l-4 border border-main" : ""}
      `}
      onClick={() => handleClick(item?.id, item?.is_read)}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${meta.color}`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Text section */}
      <div className="flex-1 flex flex-col items-start gap-1">
        {/* Type label */}
        <span className="text-xs font-semibold uppercase opacity-70">
          {meta.label}
        </span>

        {/* Message */}
        <div className="text-gray-800 font-medium">{item.message}</div>

        {/* Link */}
        {item?.link && (
          <Link
            href={HOMEWORKS_URL}
            className="text-blue-600 flex items-center gap-1 text-sm pt-1 hover:underline"
          >
            Open <MoveRight className="w-3" />
          </Link>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-1">
          {formatDateToShort(item?.created_at)}
        </div>
      </div>
    </div>
  );
}
