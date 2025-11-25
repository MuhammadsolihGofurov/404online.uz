import { useState, useEffect, useCallback, useRef } from "react";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";

/**
 * useExamStatus
 * 
 * Custom hook to manage section-based exam status with real-time polling.
 * Integrates with backend endpoints for section locking, timer tracking, and progression.
 * 
 * @param {string} submissionId - The submission ID to track
 * @param {boolean} enabled - Whether to enable polling (default: true)
 * @param {number} pollInterval - Polling interval in milliseconds (default: 5000)
 * @returns {Object} Exam status state and control methods
 */
export function useExamStatus(submissionId, enabled = true, pollInterval = 5000) {
  const [examStatus, setExamStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionPending, setIsActionPending] = useState(false);
  
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch exam status from backend
   */
  const fetchStatus = useCallback(async () => {
    if (!submissionId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAxios.get(`/submissions/${submissionId}/exam-status/`);
      
      // Only update if component is still mounted
      if (isMountedRef.current) {
        setExamStatus(response.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching exam status:", err);
      
      if (isMountedRef.current) {
        setError(err);
        
        // Only show error toast for non-404 errors (404 might mean exam not started yet)
        if (err.response?.status !== 404) {
          const errorMsg = err.response?.data?.detail || "Failed to fetch exam status";
          toast.error(errorMsg, { toastId: "exam-status-error" });
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [submissionId, enabled]);

  /**
   * Complete current section and advance to next (EXAM_MOCK) or clear current (PRACTICE_MOCK)
   */
  const completeSection = useCallback(async () => {
    if (!submissionId) {
      console.warn("Cannot complete section: No submission ID");
      return { success: false, error: "No submission ID" };
    }

    if (isActionPending) {
      console.warn("Action already in progress");
      return { success: false, error: "Action already in progress" };
    }

    setIsActionPending(true);

    try {
      const response = await authAxios.post(
        `/submissions/${submissionId}/complete-section/`
      );

      if (isMountedRef.current) {
        // Optimistically update local state
        setExamStatus(response.data.exam_status);
        
        const nextSection = response.data.next_section;
        const message = nextSection 
          ? `Section completed! Moving to ${nextSection}...`
          : "All sections completed!";
        
        toast.success(message, { toastId: "section-complete" });
        
        return {
          success: true,
          nextSection: nextSection,
          examStatus: response.data.exam_status,
        };
      }
    } catch (err) {
      console.error("Error completing section:", err);
      
      const errorMsg = 
        err.response?.data?.detail || 
        err.response?.data?.message ||
        "Failed to complete section. Please try again.";
      
      toast.error(errorMsg, { toastId: "section-complete-error" });
      
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      if (isMountedRef.current) {
        setIsActionPending(false);
      }
    }
  }, [submissionId, isActionPending]);

  /**
   * Switch to a different section (PRACTICE_MOCK only)
   * 
   * @param {string} sectionType - Target section (LISTENING, READING, WRITING)
   */
  const switchSection = useCallback(async (sectionType) => {
    if (!submissionId) {
      console.warn("Cannot switch section: No submission ID");
      return { success: false, error: "No submission ID" };
    }

    if (!sectionType) {
      console.warn("Cannot switch section: No section type provided");
      return { success: false, error: "Section type is required" };
    }

    if (isActionPending) {
      console.warn("Action already in progress");
      return { success: false, error: "Action already in progress" };
    }

    // Check if switching is allowed
    if (examStatus && !examStatus.allows_section_switching) {
      const errorMsg = "Section switching is not allowed in exam mode. You must follow the sequential order.";
      toast.error(errorMsg, { toastId: "section-switch-blocked" });
      return { success: false, error: errorMsg };
    }

    setIsActionPending(true);

    try {
      const response = await authAxios.post(
        `/submissions/${submissionId}/switch-section/`,
        { section: sectionType }
      );

      if (isMountedRef.current) {
        // Optimistically update local state
        setExamStatus(response.data.exam_status);
        
        toast.success(`Switched to ${sectionType}`, { 
          toastId: "section-switch",
          autoClose: 2000 
        });
        
        return {
          success: true,
          currentSection: response.data.current_section,
          examStatus: response.data.exam_status,
        };
      }
    } catch (err) {
      console.error("Error switching section:", err);
      
      // Handle 403 (forbidden) specifically
      if (err.response?.status === 403) {
        const errorMsg = err.response?.data?.detail || 
          "You cannot switch sections in exam mode.";
        toast.error(errorMsg, { toastId: "section-switch-forbidden" });
        return { success: false, error: errorMsg, forbidden: true };
      }
      
      const errorMsg = 
        err.response?.data?.detail || 
        err.response?.data?.message ||
        "Failed to switch section. Please try again.";
      
      toast.error(errorMsg, { toastId: "section-switch-error" });
      
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      if (isMountedRef.current) {
        setIsActionPending(false);
      }
    }
  }, [submissionId, examStatus, isActionPending]);

  /**
   * Manually refresh exam status (useful after external actions)
   */
  const refreshStatus = useCallback(() => {
    return fetchStatus();
  }, [fetchStatus]);

  /**
   * Get section status by type (helper method)
   */
  const getSectionStatus = useCallback((sectionType) => {
    if (!examStatus || !examStatus.sections) return null;
    return examStatus.sections.find(s => s.type === sectionType);
  }, [examStatus]);

  /**
   * Check if a section is accessible (not LOCKED)
   */
  const isSectionAccessible = useCallback((sectionType) => {
    const section = getSectionStatus(sectionType);
    if (!section) return false;
    return section.status !== "LOCKED";
  }, [getSectionStatus]);

  // Initial fetch on mount
  useEffect(() => {
    if (!submissionId || !enabled) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchStatus();
  }, [submissionId, enabled, fetchStatus]);

  // Set up polling interval
  useEffect(() => {
    if (!submissionId || !enabled) return;

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set up new polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, pollInterval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [submissionId, enabled, pollInterval, fetchStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    examStatus,
    isLoading,
    error,
    isActionPending,
    
    // Computed properties (for convenience)
    currentSection: examStatus?.current_section || null,
    sectionTimeRemaining: examStatus?.section_time_remaining,
    totalTimeRemaining: examStatus?.total_time_remaining,
    isStrictMode: examStatus?.is_strict_mode || false,
    allowsSectionSwitching: examStatus?.allows_section_switching || false,
    taskType: examStatus?.task_type || null,
    sections: examStatus?.sections || [],
    
    // Methods
    completeSection,
    switchSection,
    refreshStatus,
    getSectionStatus,
    isSectionAccessible,
  };
}

