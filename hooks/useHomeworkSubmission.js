import { useState, useCallback } from "react";
import fetcher from "@/utils/fetcher";

/**
 * Custom hook for managing homework submission workflow
 * Handles starting homework items, saving drafts, and tracking submissions
 */
export const useHomeworkSubmission = (homeworkId, intl) => {
    const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
    const [itemSubmissions, setItemSubmissions] = useState({});
    const [startError, setStartError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    /**
     * Start a homework item (mock) submission
     */
    const startItem = useCallback(
        async (itemId, mockId, contentType) => {
            try {
                setStartError(null);
                const response = await fetcher(
                    `/submissions/actions/start-homework/`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            homework_task_id: homeworkId,
                            item_id: itemId,
                            content_type: contentType,
                            content_id: mockId,
                        }),
                    },
                    {},
                    true
                );

                if (response) {
                    setCurrentSubmissionId(response.id);
                    setItemSubmissions((prev) => ({
                        ...prev,
                        [itemId]: { id: response.id, status: "STARTED" },
                    }));
                    return response;
                }
            } catch (error) {
                const errorMsgArray = Array.isArray(error?.error) ? error.error : null;
                const primaryErrorMsg = errorMsgArray?.length ? errorMsgArray[0] : null;
                const errorMsg = primaryErrorMsg || error?.message || "";

                // If submission already in progress, try to resume it
                if (errorMsg.includes("already in progress")) {
                    try {
                        const resultResponse = await fetcher(
                            `/homework-results/?homework_task_id=${homeworkId}`,
                            {},
                            {},
                            true
                        );

                        const existingSubmission =
                            resultResponse?.results?.[0]?.submissions?.find(
                                (sub) =>
                                    sub.item_id === itemId && sub.status === "STARTED"
                            );

                        if (existingSubmission) {
                            setCurrentSubmissionId(existingSubmission.id);
                            setItemSubmissions((prev) => ({
                                ...prev,
                                [itemId]: {
                                    id: existingSubmission.id,
                                    status: "STARTED",
                                },
                            }));
                            return { id: existingSubmission.id, resumed: true };
                        }
                    } catch (resumeError) {
                        console.error("Error resuming homework submission:", resumeError);
                    }
                }

                const friendlyError =
                    errorMsg ||
                    intl.formatMessage({
                        id: "Failed to start homework item",
                        defaultMessage: "Failed to start homework item",
                    });
                setStartError(friendlyError);
                return { error: true, message: friendlyError };
            }
        },
        [homeworkId, intl]
    );

    /**
     * Save current answers as draft without finalizing
     */
    const saveDraft = useCallback(
        async (itemId, answersObject) => {
            if (!currentSubmissionId) {
                return false;
            }

            // Don't save empty drafts
            const hasAtLeastOneAnswer = Object.values(answersObject).some(
                (val) => val && String(val).trim() !== ""
            );
            if (!hasAtLeastOneAnswer) {
                return false;
            }

            setIsSavingDraft(true);
            try {
                const response = await fetcher(
                    `/submissions/${currentSubmissionId}/save_draft/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({ answers: answersObject }),
                    },
                    {},
                    true
                );

                if (response) {
                    setLastSavedAt(new Date());
                    setItemSubmissions((prev) => ({
                        ...prev,
                        [itemId]: {
                            ...prev[itemId],
                            status: response.status || "SAVED",
                        },
                    }));
                    return true;
                }
            } catch (error) {
                console.error("Error saving draft:", error);
                return false;
            } finally {
                setIsSavingDraft(false);
            }
        },
        [currentSubmissionId]
    );

    /**
     * Submit answers for current homework item
     */
    const submitItem = useCallback(
        async (itemId, answersObject, options = {}) => {
            if (!currentSubmissionId) {
                setStartError(
                    intl.formatMessage({
                        id: "No active submission",
                        defaultMessage: "No active submission found",
                    })
                );
                return false;
            }

            // Guard: require at least one answer unless force is set
            const hasAtLeastOneAnswer = Object.values(answersObject).some(
                (val) => val && String(val).trim() !== ""
            );
            if (!hasAtLeastOneAnswer && !options.force) {
                return false;
            }

            setIsSubmitting(true);
            try {
                const response = await fetcher(
                    `/submissions/${currentSubmissionId}/submit/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({ answers: answersObject }),
                    },
                    {},
                    true
                );

                if (response) {
                    setItemSubmissions((prev) => ({
                        ...prev,
                        [itemId]: {
                            id: currentSubmissionId,
                            status: response.status,
                            score: response.score,
                        },
                    }));
                    setCurrentSubmissionId(null);
                    return true;
                }
            } catch (error) {
                setStartError(
                    error?.message ||
                    intl.formatMessage({
                        id: "Failed to submit homework item",
                        defaultMessage: "Failed to submit homework item",
                    })
                );
                console.error("Error submitting homework item:", error);
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [currentSubmissionId, intl]
    );

    /**
     * Submit entire homework (finalize all items)
     */
    const submitHomework = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const response = await fetcher(
                `/tasks/homeworks/${homeworkId}/finalize/`,
                {
                    method: "POST",
                },
                {},
                true
            );
            return response;
        } catch (error) {
            setStartError(
                error?.message ||
                intl.formatMessage({
                    id: "Failed to submit homework",
                    defaultMessage: "Failed to submit homework",
                })
            );
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [homeworkId, intl]);

    return {
        currentSubmissionId,
        setCurrentSubmissionId,
        itemSubmissions,
        setItemSubmissions,
        startError,
        setStartError,
        isSubmitting,
        isSavingDraft,
        lastSavedAt,
        startItem,
        saveDraft,
        submitItem,
        submitHomework,
    };
};
