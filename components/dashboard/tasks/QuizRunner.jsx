import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { Loader, AlertCircle, ArrowRight, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

export default function QuizRunner({
    title,
    mockId,
    quizData,
    currentSubmissionId,
    startFn,
    submitFn,
    onFinalize,
    onExit,
    autoSaveConfig = null, // { onAutoSave, isSaving }
    fetchMock,
    sectionType,
    isLoadingMock,
    isFailed,
    isSubmitting,
    startError,
}) {
    const intl = useIntl();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);
    const [isStarting, setIsStarting] = useState(false);
    const startedRef = React.useRef(false);

    // Parse fields from quizData
    const questions = quizData?.content || [];
    const durationMinutes = quizData?.default_duration_minutes || 10;

    // Fetch quiz data if missing
    useEffect(() => {
        if (!quizData && mockId && sectionType && fetchMock && !isFetching && !isLoadingMock && !isFailed) {
            setIsFetching(true);
            fetchMock(sectionType, mockId).finally(() => setIsFetching(false));
        }
    }, [quizData, mockId, sectionType, fetchMock, isFetching, isLoadingMock, isFailed]);

    // Auto-start submission if missing
    useEffect(() => {
        if (!currentSubmissionId && startFn && !startError && !isLoadingMock && !startedRef.current && !isStarting) {
            const loadAndStart = async () => {
                setIsStarting(true);
                startedRef.current = true;
                try {
                    await startFn();
                } catch (err) {
                    console.error("Quiz auto-start failed:", err);
                    startedRef.current = false; // Allow retry if it failed
                } finally {
                    setIsStarting(false);
                }
            };
            loadAndStart();
        }
    }, [currentSubmissionId, startFn, startError, isLoadingMock, isStarting]);

    const handleOptionSelect = (index) => {
        if (isQuizCompleted || isSubmitting) return;
        setSelectedOption(index);
    };

    const getQuestionKey = (question) =>
        question?.id ?? question?.question_id ?? question?.questionId ?? null;

    const handleNext = () => {
        if (selectedOption === null || isSubmitting) return;

        // Save answer locally using question ID if available, otherwise index
        const currentQuestion = questions[currentQuestionIndex];
        const questionKey = getQuestionKey(currentQuestion);
        if (!questionKey) {
            console.warn("[QuizRunner] Missing question id for answer save:", currentQuestion);
            return;
        }

        setAnswers(prev => ({
            ...prev,
            [questionKey]: selectedOption
        }));

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
        } else {
            finishQuiz();
        }
    };

    const buildDraftAnswers = () => {
        const draftAnswers = { ...answers };
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return draftAnswers;
        const questionKey = getQuestionKey(currentQuestion);
        if (!questionKey) {
            console.warn("[QuizRunner] Missing question id for draft save:", currentQuestion);
            return draftAnswers;
        }
        if (selectedOption !== null && selectedOption !== undefined) {
            draftAnswers[questionKey] = selectedOption;
        }
        return draftAnswers;
    };

    const handleSaveAndExit = async () => {
        if (!autoSaveConfig?.onAutoSave) return;
        const draftAnswers = buildDraftAnswers();
        const result = await autoSaveConfig.onAutoSave(draftAnswers);
        const failed = result === false || result?.success === false;
        if (failed) {
            toast.error(
                result?.message ||
                intl.formatMessage({
                    id: "Failed to save",
                    defaultMessage: "Failed to save draft",
                })
            );
            return;
        }
        toast.success(
            intl.formatMessage({
                id: "Saved",
                defaultMessage: "Saved",
            })
        );
        onExit?.();
    };

    const finishQuiz = async () => {
        if (isSubmitting) return;
        setError(null);

        // Construct final answers object for submission
        const currentQuestion = questions[currentQuestionIndex];
        const lastQuestionKey = getQuestionKey(currentQuestion);
        if (!lastQuestionKey) {
            setError(intl.formatMessage({ id: "Missing question id", defaultMessage: "Missing question id." }));
            return;
        }
        const finalAnswersMap = { ...answers, [lastQuestionKey]: selectedOption };

        // Calculate score locally for immediate display
        let localScore = 0;
        questions.forEach((q, idx) => {
            const questionKey = getQuestionKey(q) ?? idx;
            const userAnswer = finalAnswersMap[questionKey];
            if (userAnswer === q.correct) {
                localScore++;
            }
        });
        setScore(localScore);

        if (submitFn) {
            try {
                console.log("Submitting quiz answers:", finalAnswersMap);
                const result = await submitFn(finalAnswersMap);
                console.log("Submission result:", result);

                if (result && result.success) {
                    setIsQuizCompleted(true);
                } else {
                    const msg = result?.message || intl.formatMessage({ id: "Submission failed", defaultMessage: "Submission failed. Please try again." });
                    setError(msg);
                }
            } catch (err) {
                console.error("Submission catch error:", err);
                setError(err.message || "Submission error");
            }
        } else {
            setIsQuizCompleted(true);
        }
    };

    if (isLoadingMock || isFetching) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (startError || isFailed) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <div className="text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2" size={32} />
                    <p>{startError || intl.formatMessage({ id: "Failed to load quiz data", defaultMessage: "Failed to load quiz content" })}</p>
                </div>
            </div>
        );
    }

    if (!quizData || questions.length === 0) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <p className="text-gray-500">No questions found for this quiz.</p>
            </div>
        );
    }

    if (isQuizCompleted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <CheckCircle size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
                <p className="text-gray-500 mb-8">You have successfully submitted your answers.</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Score</span>
                        <span className="text-2xl font-bold text-gray-900">{score} / {questions.length}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Percentage</span>
                        <span className="text-2xl font-bold text-gray-900">{Math.round((score / questions.length) * 100)}%</span>
                    </div>
                </div>

                <button
                    onClick={onFinalize}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                    Back to Homework List
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <div className="flex items-center gap-3">
                        <span>Duration: {durationMinutes} min</span>
                        {autoSaveConfig?.onAutoSave && (
                            <button
                                onClick={handleSaveAndExit}
                                disabled={isSubmitting || autoSaveConfig.isSaving}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {autoSaveConfig.isSaving ? "Saving..." : "Save and Exit"}
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 shadow-sm">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <XCircle size={18} />
                            <span>Submission Detail:</span>
                        </div>
                        <p>{error}</p>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[300px] flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.q}</h3>

                <div className="space-y-3 flex-1">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${selectedOption === idx
                                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedOption === idx ? "border-blue-600 bg-blue-600" : "border-gray-300"
                                    }`}>
                                    {selectedOption === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                {option}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={selectedOption === null || isSubmitting}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${selectedOption === null || isSubmitting
                            ? "bg-gray-200 cursor-not-allowed"
                            : "bg-main hover:bg-blue-800 shadow-lg shadow-main/20 active:scale-95"
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader className="animate-spin" size={20} />
                        ) : (
                            <>
                                {currentQuestionIndex === questions.length - 1 ? "Submit Quiz" : "Next Question"}
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
