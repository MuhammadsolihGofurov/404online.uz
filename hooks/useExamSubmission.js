import { useState, useCallback } from "react";
import { SECTION_TYPES } from "@/utils/examConstants";
import fetcher from "@/utils/fetcher";

/**
 * Custom hook for managing exam submission workflow
 * Handles starting sections and detecting in-progress submissions
 */
export const useExamSubmission = (examId, intl) => {
    const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
    const [examResultId, setExamResultId] = useState(null);
    const [sectionSubmissions, setSectionSubmissions] = useState({});
    const [startError, setStartError] = useState(null);

    const startSection = useCallback(
        async (section, mockId) => {
            try {
                setStartError(null);
                const response = await fetcher(
                    `/submissions/actions/start-exam/`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            exam_task_id: examId,
                            content_type: section,
                            content_id: mockId,
                        }),
                    },
                    {},
                    true
                );

                if (response) {
                    setCurrentSubmissionId(response.id);
                    setExamResultId(response.exam_result_id);
                    setSectionSubmissions((prev) => ({
                        ...prev,
                        [section]: { id: response.id, status: "STARTED" },
                    }));
                    return response;
                }
            } catch (error) {
                const errorMsgArray = Array.isArray(error?.error) ? error.error : null;
                const primaryErrorMsg = errorMsgArray?.length ? errorMsgArray[0] : null;
                const errorMsg = primaryErrorMsg || error?.message || "";

                // If section already in progress, try to resume it
                if (errorMsg.includes("already in progress")) {
                    try {
                        const resultResponse = await fetcher(
                            `/exam-results/?exam_task_id=${examId}`,
                            {},
                            {},
                            true
                        );

                        const existingSubmission =
                            resultResponse?.results?.[0]?.submissions?.find(
                                (sub) =>
                                    sub.content_type === section && sub.status === "STARTED"
                            );

                        if (existingSubmission) {
                            setCurrentSubmissionId(existingSubmission.id);
                            setExamResultId(resultResponse.results[0].id);
                            setSectionSubmissions((prev) => ({
                                ...prev,
                                [section]: {
                                    id: existingSubmission.id,
                                    status: "STARTED",
                                },
                            }));
                            return { id: existingSubmission.id, resumed: true };
                        }
                    } catch (resumeError) {
                        console.error("Error resuming submission:", resumeError);
                    }
                }

                const friendlyError =
                    errorMsg ||
                    intl.formatMessage({
                        id: "Failed to start section",
                        defaultMessage: "Failed to start section",
                    });
                setStartError(friendlyError);
                return { error: true, message: friendlyError };
            }
        },
        [examId, intl]
    );

    return {
        currentSubmissionId,
        setCurrentSubmissionId,
        examResultId,
        setExamResultId,
        sectionSubmissions,
        setSectionSubmissions,
        startError,
        setStartError,
        startSection,
    };
};
