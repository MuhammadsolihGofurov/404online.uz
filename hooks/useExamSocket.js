/**
 * useExamSocket - WebSocket Hook for Real-Time Exam Updates
 *
 * Replaces REST polling (useExamStatus) with WebSocket connection.
 *
 * CRITICAL FEATURES:
 * 1. Real-time exam status updates (no more polling!)
 * 2. Server-side timer sync (prevents drift)
 * 3. Active student tracking (for monitoring dashboard)
 * 4. Automatic reconnection on disconnect
 * 5. Keep-alive pings (updates last_seen_at)
 *
 * USAGE:
 *
 * Student Side (Exam Room):
 * ```jsx
 * const {
 *   examStatus,
 *   isConnected,
 *   error
 * } = useExamSocket(taskId, 'student');
 *
 * if (!examStatus?.is_exam_active) {
 *   return <div>Exam has not started yet</div>;
 * }
 * ```
 *
 * Teacher Side (Monitoring Dashboard):
 * ```jsx
 * const {
 *   activeStudents,
 *   totalStudents,
 *   isConnected
 * } = useExamSocket(taskId, 'teacher');
 *
 * return (
 *   <div>
 *     Active Students: {totalStudents}
 *     {activeStudents.map(student => ...)}
 *   </div>
 * );
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const RECONNECT_INTERVAL = 3000; // 3 seconds
const PING_INTERVAL = 15000; // 15 seconds (keep-alive)
const MAX_RECONNECT_ATTEMPTS = 10;

export function useExamSocket(taskId, role = 'student') {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Exam state
  const [examStatus, setExamStatus] = useState(null);
  const [activeStudents, setActiveStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  // Refs
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  /**
   * Get WebSocket URL with authentication token
   */
  const getWebSocketUrl = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // WebSocket URL: ws://host/ws/exam/<task_id>/?token=<jwt_token>
    return `${WS_BASE_URL}/ws/exam/${taskId}/?token=${token}`;
  }, [taskId]);

  /**
   * Send message to WebSocket server
   */
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  /**
   * Send ping to keep connection alive and update last_seen_at
   */
  const sendPing = useCallback(() => {
    sendMessage({ type: 'ping' });
  }, [sendMessage]);

  /**
   * Request current exam status
   */
  const requestStatus = useCallback(() => {
    sendMessage({ type: 'request_status' });
  }, [sendMessage]);

  /**
   * Request active students list (teachers only)
   */
  const requestActiveStudents = useCallback(() => {
    if (role === 'teacher' || role === 'admin') {
      sendMessage({ type: 'request_active_students' });
    }
  }, [sendMessage, role]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'exam_status':
            // Initial status on connection
            setExamStatus({
              is_exam_active: data.is_exam_active,
              exam_start_time: data.exam_start_time,
              exam_end_time: data.exam_end_time,
              duration_minutes: data.duration_minutes,
              start_time: data.start_time,
              end_time: data.end_time,
            });
            break;

          case 'exam_status_update':
            // Real-time status update (teacher started/stopped exam)
            setExamStatus((prev) => ({
              ...prev,
              is_exam_active: data.is_exam_active,
              exam_start_time: data.exam_start_time,
              exam_end_time: data.exam_end_time,
              duration_minutes: data.duration_minutes,
            }));

            // Show toast notification
            if (data.message) {
              if (data.is_exam_active) {
                toast.info(data.message, { toastId: 'exam-started' });
              } else {
                toast.warning(data.message, { toastId: 'exam-stopped' });
              }
            }
            break;

          case 'timer_sync':
            // Server time sync (prevents client-side drift)
            setExamStatus((prev) => ({
              ...prev,
              server_time: data.server_time,
              time_remaining: data.time_remaining,
              exam_end_time: data.exam_end_time,
            }));
            break;

          case 'student_joined':
            // Student joined (for monitoring dashboard)
            if (role === 'teacher' || role === 'admin') {
              setActiveStudents((prev) => {
                // Check if student already in list
                const exists = prev.some(
                  (s) => s.student_id === data.student_id,
                );
                if (exists) return prev;

                return [
                  ...prev,
                  {
                    student_id: data.student_id,
                    student_name: data.student_name,
                    student_email: data.student_email,
                    joined_at: data.joined_at,
                    status: 'Online',
                  },
                ];
              });
              setTotalStudents((prev) => prev + 1);

              toast.success(`${data.student_name} joined the exam`, {
                toastId: `student-joined-${data.student_id}`,
                autoClose: 2000,
              });
            }
            break;

          case 'student_left':
            // Student left (for monitoring dashboard)
            if (role === 'teacher' || role === 'admin') {
              setActiveStudents((prev) =>
                prev.map((s) =>
                  s.student_id === data.student_id
                    ? { ...s, status: 'Offline', left_at: data.left_at }
                    : s,
                ),
              );
              setTotalStudents((prev) => Math.max(0, prev - 1));

              toast.info(`${data.student_name} left the exam`, {
                toastId: `student-left-${data.student_id}`,
                autoClose: 2000,
              });
            }
            break;

          case 'active_students':
            // Full active students list (response to request)
            if (role === 'teacher' || role === 'admin') {
              setActiveStudents(data.students || []);
              setTotalStudents(data.total_students || 0);
            }
            break;

          case 'pong':
            // Pong response to ping (keep-alive)
            // No action needed
            break;

          case 'error':
            console.error('WebSocket error:', data.error);
            setError(data.error);
            break;

          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    },
    [role],
  );

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!taskId) {
      console.warn('Cannot connect: No task ID provided');
      return;
    }

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket connected to exam:', taskId);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Request initial status
        requestStatus();

        // For teachers, request active students list
        if (role === 'teacher' || role === 'admin') {
          setTimeout(() => requestActiveStudents(), 500);
        }

        // Start ping interval (keep-alive)
        pingIntervalRef.current = setInterval(sendPing, PING_INTERVAL);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection if not intentional close
        if (
          isMountedRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError('Failed to reconnect after multiple attempts');
          toast.error(
            'Lost connection to exam server. Please refresh the page.',
            {
              toastId: 'ws-reconnect-failed',
              autoClose: false,
            },
          );
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err.message);
      setIsConnected(false);
    }
  }, [
    taskId,
    getWebSocketUrl,
    handleMessage,
    requestStatus,
    requestActiveStudents,
    sendPing,
    role,
  ]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // Connection state
    isConnected,
    error,

    // Exam state
    examStatus,

    // Monitoring state (teachers only)
    activeStudents,
    totalStudents,

    // Actions
    requestStatus,
    requestActiveStudents,
    reconnect: connect,
  };
}
