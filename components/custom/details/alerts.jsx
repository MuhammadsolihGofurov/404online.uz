import React from "react";
import { useIntl } from "react-intl";
import {
  AlertTriangle, // Warning (Ogohlantirish)
  Info, // Info (Ma'lumot)
  CheckCircle, // Success (Muvaffaqiyat)
  AlertCircle, // Danger (Xavf)
} from "lucide-react";

export default function Alerts({ type, messageId }) {
  const intl = useIntl();
  const message = intl.formatMessage({ id: messageId });

  // Har bir tur uchun ranglar va ikonkalarni belgilash
  const getStyles = (alertType) => {
    switch (alertType) {
      case "warning":
        return {
          icon: AlertTriangle,
          classes: "bg-yellow-50 border-yellow-300 text-yellow-800",
        };
      case "info":
        return {
          icon: Info,
          classes: "bg-blue-50 border-blue-300 text-blue-800",
        };
      case "success":
        return {
          icon: CheckCircle,
          classes: "bg-green-50 border-green-300 text-green-800",
        };
      case "danger":
        return {
          icon: AlertCircle,
          classes: "bg-red-50 border-red-300 text-red-800",
        };
      default:
        return {
          icon: Info,
          classes: "bg-gray-100 border-gray-300 text-gray-700",
        };
    }
  };

  const { icon: Icon, classes } = getStyles(type);

  return (
    <div
      className={`
                    flex items-center p-4 rounded-lg shadow-sm text-left
                    ${classes}
                `}
    >
      {/* Ikonka */}
      <Icon size={20} className="flex-shrink-0 mr-3 mt-0.5" />

      {/* Matn */}
      <div>
        <p className="font-medium text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
