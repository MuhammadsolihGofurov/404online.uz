import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Clock, AlertTriangle } from "lucide-react";

export default function ExamTimer({ initialTime, onTimeUp }) {
  const intl = useIntl();
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft <= 300; // Last 5 minutes
  const isCritical = timeLeft <= 60; // Last 1 minute

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
        isCritical
          ? "bg-red-100 text-red-700 animate-pulse"
          : isWarning
          ? "bg-yellow-100 text-yellow-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {isCritical ? (
        <AlertTriangle size={20} className="animate-bounce" />
      ) : (
        <Clock size={20} />
      )}
      <span>
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
