import { useState, useCallback } from "react";
import fetcher from "@/utils/fetcher";
import { buildUserAnswersPayload } from "@/utils/submission-answers";

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

    /**
     * Start a homework item (mock) submission
     */
    const startItem = useCallback(
        async (itemId, mockId, contentType) => {
            try {
                setStartError(null);
                const response = await fetcher(
                    `/submissions/start_homework/`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            homework_item_id: itemId,
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
                console.error("[useHomeworkSubmission] startItem error:", {
                    message: error.message,
                    status: error.status,
                    data: error.data
                });

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

                        // Find the submission for this item that is still active
                        const existingSubmission =
                            resultResponse?.results?.[0]?.submissions?.find(
                                (sub) =>
                                    sub.item_id === itemId && (sub.status === "STARTED" || sub.status === "SAVED")
                            );

                        if (existingSubmission) {
                            setCurrentSubmissionId(existingSubmission.id);
                            setItemSubmissions((prev) => ({
                                ...prev,
                                [itemId]: {
                                    id: existingSubmission.id,
                                    status: existingSubmission.status,
                                },
                            }));
                            return { id: existingSubmission.id, resumed: true };
                        } else {
                            console.warn("[useHomeworkSubmission] API said 'in progress' but no matching active submission found in results.");
                        }
                    } catch (resumeError) {
                        console.error("[useHomeworkSubmission] Error during resume attempt:", resumeError);
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
                (val) => val !== null && val !== undefined && String(val).trim() !== ""
            );
            if (!hasAtLeastOneAnswer) {
                return { success: false, message: "No answers provided" };
            }

            setIsSavingDraft(true);
            try {
                const response = await fetcher(
                    `/submissions/${currentSubmissionId}/save_draft/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            answers: answersObject,
                            user_answers: buildUserAnswersPayload(answersObject),
                        }),
                    },
                    {},
                    true
                );

                if (response) {
                    setItemSubmissions((prev) => ({
                        ...prev,
                        [itemId]: {
                            ...prev[itemId],
                            status: response.status || "SAVED",
                        },
                    }));
                    return { success: true, data: response };
                }
            } catch (error) {
                console.error("[useHomeworkSubmission] saveDraft error:", {
                    message: error.message,
                    status: error.status,
                    data: error.data
                });
                return { success: false, message: error?.message };
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
                return { success: false, message: "No active submission" };
            }

            // Guard: require at least one answer unless force is set
            const finalAnswersCount = answersObject ? Object.keys(answersObject).length : 0;

            if (finalAnswersCount === 0 && !options.force) {
                console.warn("[useHomeworkSubmission] submitItem BLOCKED: No answers to submit (harvester found 0).", { answersObject });
                return { success: false, message: "No answers provided" };
            }

            setIsSubmitting(true);
            try {
                const response = await fetcher(
                    `/submissions/${currentSubmissionId}/submit/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            answers: answersObject,
                            user_answers: buildUserAnswersPayload(answersObject),
                        }),
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
                    return { success: true, data: response };
                }
            } catch (error) {
                console.error("[useHomeworkSubmission] submitItem error:", {
                    message: error.message,
                    status: error.status,
                    data: error.data
                });
                const errorMsg = error?.message ||
                    intl.formatMessage({
                        id: "Failed to submit homework item",
                        defaultMessage: "Failed to submit homework item",
                    });
                setStartError(errorMsg);
                return { success: false, message: errorMsg };
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
            console.error("[useHomeworkSubmission] submitHomework error:", {
                message: error.message,
                status: error.status,
                data: error.data
            });
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
        startItem,
        saveDraft,
        submitItem,
        submitHomework,
    };
};
