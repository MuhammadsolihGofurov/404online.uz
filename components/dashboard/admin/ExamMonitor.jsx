import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { Play, Square, Send, Users, Clock, Activity, AlertCircle, Lock } from "lucide-react";
import { ButtonSpinner } from "@/components/custom/loading";

/**
 * ExamMonitor - Real-time Teacher Dashboard for Exam Monitoring
 * 
 * Features:
 * - Live student tracking (polls every 5 seconds)
 * - Exam control buttons (Start/Stop/Publish)
 * - Student status display (Online/Offline, Current Section, Time Spent)
 */
export function ExamMonitor({ taskId, task, onTaskUpdate }) {
    const intl = useIntl();
    const [activeStudents, setActiveStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // 'start', 'stop', 'publish'
    
    // Derive exam status from task prop
    const isExamActive = task?.is_exam_active || false;

    // Fetch active students
    const fetchActiveStudents = async () => {
        if (!taskId) return;

        try {
            const response = await authAxios.get(`/tasks/${taskId}/active-students/`);
            setActiveStudents(response.data.active_students || []);
        } catch (error) {
            console.error("Error fetching active students:", error);
        }
    };

    // Poll every 5 seconds if exam is active
    useEffect(() => {
        if (!taskId) return;

        setIsLoading(true);
        fetchActiveStudents().finally(() => setIsLoading(false));

        if (task?.is_exam_active) {
            const interval = setInterval(fetchActiveStudents, 5000);
            return () => clearInterval(interval);
        }
    }, [taskId, task?.is_exam_active]);

    // Start Exam
    const handleStartExam = async () => {
        setActionLoading('start');
        try {
            await authAxios.post(`/tasks/${taskId}/start-exam/`);
            toast.success(intl.formatMessage({ id: "Exam started successfully!" }));
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            const errorMsg = error?.response?.data?.detail || "Failed to start exam";
            toast.error(errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    // Stop Exam
    const handleStopExam = async () => {
        setActionLoading('stop');
        try {
            await authAxios.post(`/tasks/${taskId}/stop-exam/`);
            toast.success(intl.formatMessage({ id: "Exam stopped successfully!" }));
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            const errorMsg = error?.response?.data?.detail || "Failed to stop exam";
            toast.error(errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    // Publish Results
    const handlePublishResults = async () => {
        // Double-check on client side
        if (isExamActive) {
            toast.warning(intl.formatMessage({ id: "Cannot publish results while exam is active. Please stop the exam first." }));
            return;
        }
        
        setActionLoading('publish');
        try {
            await authAxios.post(`/tasks/${taskId}/publish-results/`);
            toast.success(intl.formatMessage({ id: "Results published successfully!" }));
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            // Handle specific error from backend
            if (error?.response?.status === 400 && error?.response?.data?.is_exam_active) {
                const activeCount = error?.response?.data?.active_student_count || 0;
                toast.error(
                    intl.formatMessage(
                        { id: "Cannot publish results. {count} student(s) are still taking the exam." },
                        { count: activeCount }
                    ),
                    { autoClose: 5000 }
                );
            } else {
                const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.response?.data?.detail || "Failed to publish results";
                toast.error(errorMsg);
            }
        } finally {
            setActionLoading(null);
        }
    };

    // Format time spent (seconds to HH:MM:SS)
    const formatTimeSpent = (seconds) => {
        if (!seconds) return "00:00:00";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Get status badge
    const getStatusBadge = (isActive) => {
        if (isActive) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {intl.formatMessage({ id: "Online" })}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                {intl.formatMessage({ id: "Offline" })}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Activity size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {intl.formatMessage({ id: "Exam Monitor" })}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {intl.formatMessage({ id: "Real-time student tracking" })}
                            </p>
                        </div>
                    </div>

                    {/* Exam Status Badge */}
                    <div>
                        {task?.is_exam_active ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                                {intl.formatMessage({ id: "EXAM ACTIVE" })}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-bold border border-gray-200">
                                <Square size={16} />
                                {intl.formatMessage({ id: "Exam Stopped" })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3">
                    {!task?.is_exam_active ? (
                        <button
                            onClick={handleStartExam}
                            disabled={actionLoading === 'start'}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                        >
                            {actionLoading === 'start' ? (
                                <>
                                    <ButtonSpinner size="sm" />
                                    {intl.formatMessage({ id: "Starting..." })}
                                </>
                            ) : (
                                <>
                                    <Play size={20} />
                                    {intl.formatMessage({ id: "Start Exam" })}
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleStopExam}
                            disabled={actionLoading === 'stop'}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                        >
                            {actionLoading === 'stop' ? (
                                <>
                                    <ButtonSpinner size="sm" />
                                    {intl.formatMessage({ id: "Stopping..." })}
                                </>
                            ) : (
                                <>
                                    <Square size={20} />
                                    {intl.formatMessage({ id: "Stop Exam" })}
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handlePublishResults}
                        disabled={actionLoading === 'publish' || isExamActive}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg ${
                            isExamActive 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                        title={isExamActive ? intl.formatMessage({ id: "Cannot publish results while exam is active" }) : ''}
                    >
                        {actionLoading === 'publish' ? (
                            <>
                                <ButtonSpinner size="sm" />
                                {intl.formatMessage({ id: "Publishing..." })}
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                {intl.formatMessage({ id: "Publish Results" })}
                                {isExamActive && <Lock size={16} className="ml-1" />}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Student List */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users size={20} />
                        {intl.formatMessage({ id: "Active Students" })} ({activeStudents.length})
                    </h3>
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ButtonSpinner size="sm" />
                            {intl.formatMessage({ id: "Updating..." })}
                        </div>
                    )}
                </div>

                {activeStudents.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">
                            {intl.formatMessage({ id: "No students currently taking the exam" })}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {intl.formatMessage({ id: "Student" })}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {intl.formatMessage({ id: "Status" })}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {intl.formatMessage({ id: "Current Section" })}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {intl.formatMessage({ id: "Time Spent" })}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {intl.formatMessage({ id: "Last Seen" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {activeStudents.map((student) => (
                                    <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {student.student_name?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{student.student_name}</p>
                                                    <p className="text-xs text-gray-500">{student.student_email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(student.is_currently_active)}
                                        </td>
                                        <td className="px-4 py-4">
                                            {student.current_section ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium">
                                                    {student.current_section}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Clock size={16} className="text-gray-400" />
                                                <span className="font-mono text-sm">
                                                    {formatTimeSpent(student.time_spent_seconds)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600">
                                                {student.last_seen_at
                                                    ? new Date(student.last_seen_at).toLocaleTimeString()
                                                    : '—'
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
