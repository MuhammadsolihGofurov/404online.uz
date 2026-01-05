import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { useIntl } from "react-intl";

export default function ExamTimer({
  duration = 180, // in minutes
  onTimeUp = () => {},
  onWarning = () => {},
}) {
  const intl = useIntl();
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        if (newTime === 0) {
          onTimeUp();
          clearInterval(timer);
          return 0;
        }

        // Warning when 10 minutes left
        if (newTime === 600 && !isWarning) {
          setIsWarning(true);
          onWarning();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp, onWarning, isWarning]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isLowTime = timeLeft < 600; // Less than 10 minutes

  return (
    <>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isLowTime ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          {isLowTime ? (
            <AlertTriangle
              size={20}
              className={isLowTime ? "text-red-600" : "text-blue-600"}
            />
          ) : (
            <Clock
              size={20}
              className={isLowTime ? "text-red-600" : "text-blue-600"}
            />
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">
            {intl.formatMessage({
              id: "Time Remaining",
              defaultMessage: "Time Remaining",
            })}
          </p>
          <p
            className={`text-lg font-bold font-mono ${
              isLowTime ? "text-red-600" : "text-gray-900"
            }`}
          >
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      {isLowTime && (
        <div className="text-sm font-medium text-red-600 animate-pulse">
          {intl.formatMessage({
            id: "Hurry up!",
            defaultMessage: "Hurry up!",
          })}
        </div>
      )}
    </>
  );
}
