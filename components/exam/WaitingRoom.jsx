import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Clock, AlertCircle, Loader2, Users, Radio } from "lucide-react";
import { authAxios } from "@/utils/axios";

/**
 * WaitingRoom Component - Auditorium Mode
 * 
 * Modern waiting room with countdown for synchronized exam start.
 * 
 * Flow:
 * 1. Teacher starts exam
 * 2. Students join and see this waiting room
 * 3. First student triggers 30-second countdown
 * 4. All students wait together (like a phone call connecting...)
 * 5. After 30 seconds, everyone enters exam simultaneously
 * 
 * Design inspired by: Zoom waiting room, Google Meet, Phone call connecting
 */
export function WaitingRoom({ taskId, onExamStarted }) {
  const intl = useIntl();
  const [waitingStatus, setWaitingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    const checkWaitingRoom = async () => {
      try {
        const response = await authAxios.get(`/tasks/${taskId}/waiting-room-status/`);
        const data = response.data;
        
        setWaitingStatus(data);
        setError(null);
        
        // Update countdown display
        if (data.waiting_time_remaining !== null && data.waiting_time_remaining !== undefined) {
          setCountdown(data.waiting_time_remaining);
        } else {
          setCountdown(null);
        }
        
        // If exam can start, notify parent
        if (data.can_start_exam) {
          setTimeout(() => {
            onExamStarted();
          }, 500); // Small delay for smooth transition
        }
      } catch (err) {
        console.error("Error checking waiting room status:", err);
        
        // Handle 403 (exam not started yet)
        if (err.response?.status === 403) {
          setError(err.response?.data?.message || "Waiting for teacher to start exam...");
        } else {
          setError("Connection error. Retrying...");
        }
      }
    };

    // Initial check
    checkWaitingRoom();

    // Poll every 2 seconds for smooth countdown
    const interval = setInterval(checkWaitingRoom, 2000);
    return () => clearInterval(interval);
  }, [taskId, onExamStarted]);

  // Local countdown ticker for smoother UX
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const ticker = setInterval(() => {
        setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(ticker);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100 backdrop-blur-sm">
          
          {/* Status Icon */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              {countdown !== null && countdown > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="text-5xl font-bold text-white">{countdown}</div>
                  <div className="text-xs text-blue-100 mt-1">seconds</div>
                </div>
              ) : (
                <Radio className="w-16 h-16 text-white animate-pulse" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {countdown !== null && countdown > 0 
              ? intl.formatMessage({ id: "Get Ready!" }) || "Get Ready!"
              : intl.formatMessage({ id: "Waiting Room" }) || "Waiting Room"
            }
          </h1>

          {/* Status Message */}
          <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
            {error ? (
              <span className="text-orange-600">{error}</span>
            ) : countdown !== null && countdown > 0 ? (
              <>
                <span className="font-semibold text-blue-600">
                  {intl.formatMessage({ id: "Exam starting in {seconds} seconds..." }, { seconds: countdown }) || `Exam starting in ${countdown} seconds...`}
                </span>
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  {intl.formatMessage({ id: "Please wait, connecting all students..." }) || "Please wait, connecting all students..."}
                </span>
              </>
            ) : (
              waitingStatus?.message || intl.formatMessage({ id: "Connecting to exam session..." }) || "Connecting to exam session..."
            )}
          </p>

          {/* Connecting Animation */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce animation-delay-400"></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-left">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-blue-900 mb-3">
                  {intl.formatMessage({ id: "Important Instructions:" }) || "Important Instructions:"}
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{intl.formatMessage({ id: "Do NOT refresh or close this page" }) || "Do NOT refresh or close this page"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{intl.formatMessage({ id: "Ensure your internet connection is stable" }) || "Ensure your internet connection is stable"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{intl.formatMessage({ id: "Prepare your writing materials" }) || "Prepare your writing materials"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{intl.formatMessage({ id: "Exam will start automatically - no action needed" }) || "Exam will start automatically - no action needed"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Status */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono">
              {intl.formatMessage({ id: "Syncing..." }) || "Syncing..."} • {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Bottom Help Text */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            {intl.formatMessage({ id: "Having issues?" }) || "Having issues?"}{" "}
            <button className="text-blue-600 hover:underline font-medium">
              {intl.formatMessage({ id: "Contact support" }) || "Contact support"}
            </button>
          </p>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
}

