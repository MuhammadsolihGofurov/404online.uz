import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { authAxios } from "@/utils/axios";

/**
 * WaitingRoom Component
 * 
 * Displays a holding screen for students when an exam is scheduled but not yet active.
 * Polls the backend every 10 seconds to check for exam start.
 * Automatically transitions to the exam when eligible.
 */
export function WaitingRoom({ taskId, onExamStarted }) {
  const intl = useIntl();
  const [reason, setReason] = useState("");
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await authAxios.get(`/tasks/${taskId}/check_submission_eligibility/`);
        
        setLastChecked(new Date());
        
        if (response.data?.can_submit) {
          // Exam is ready!
          onExamStarted();
        } else {
          // Still waiting
          setReason(response.data?.reason || "Waiting for invigilator...");
        }
      } catch (err) {
        console.error("Error polling exam status:", err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [taskId, onExamStarted]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {intl.formatMessage({ id: "Exam Waiting Room" })}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {reason || intl.formatMessage({ id: "Please wait for the invigilator to start the exam." })}
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 py-2 px-4 rounded-full inline-flex mx-auto">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>
            {intl.formatMessage({ id: "Auto-refreshing..." })} 
            ({lastChecked.toLocaleTimeString()})
          </span>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-left">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                {intl.formatMessage({ id: "Instructions" })}
              </h3>
              <p className="text-xs text-yellow-700 leading-relaxed">
                {intl.formatMessage({ id: "Do not refresh the page. You will be automatically redirected to the exam screen once it starts." })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

