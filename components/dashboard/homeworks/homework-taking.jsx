import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { SECTION_TYPES } from "@/utils/examConstants";
import { parseDurationToMinutes } from "@/utils/durationParser";
import { getSectionConfig } from "@/utils/sectionConfig";
import { useHomeworkSubmission } from "@/hooks/useHomeworkSubmission";
import { useLazyMocks } from "@/hooks/useLazyMocks";
import { useQuestionSession } from "@/hooks/useQuestionSession";
import ExamTimer from "@/components/dashboard/exams/exam-timer";
import ExamQuestion from "@/components/dashboard/exams/exam-question";
import ListeningFooter from "@/components/dashboard/exams/listening-footer";
import { 
  AlertCircle, 
  Loader, 
  Maximize, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  PlayCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import { toast } from "react-toastify";

/**
 * Map content_type from homework items to SECTION_TYPES
 */
const mapContentTypeToSection = (contentType) => {
  if (!contentType) return null;
  const typeMap = {
    listening: SECTION_TYPES.LISTENING,
    reading: SECTION_TYPES.READING,
    writing: SECTION_TYPES.WRITING,
    LISTENING: SECTION_TYPES.LISTENING,
    READING: SECTION_TYPES.READING,
    WRITING: SECTION_TYPES.WRITING,
  };
  return typeMap[contentType] || null;
};

const HomeworkTaking = ({ loading: pageLoading }) => {
  const router = useRouter();
  const intl = useIntl();
  const { id: homeworkId } = router.query;

  // --- STATE ---
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'TAKING'
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [loadingItemMock, setLoadingItemMock] = useState(false);
  
  // Refs
  const loadedItemRef = useRef(null);
  const startedItemRef = useRef(null);

  // --- DATA FETCHING ---
  const {
    data: homework,
    isLoading: homeworkLoading,
    error: homeworkError,
    mutate: mutateHomework
  } = useSWR(
    homeworkId ? [`/tasks/homeworks/${homeworkId}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(
        url,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  const items = useMemo(() => {
    return homework?.items || homework?.homework_items || [];
  }, [homework]);

  // Derived based on currentItemIndex
  const currentItem = currentItemIndex !== null ? items[currentItemIndex] : null;
  const currentSectionType = useMemo(() => 
    currentItem ? mapContentTypeToSection(currentItem.content_type) : null,
  [currentItem]);

  const homeworkDurationMinutes = useMemo(() => 
    parseDurationToMinutes(homework?.duration) ?? null,
  [homework]);


  // --- HOOKS ---
  const {
    currentSubmissionId,
    itemSubmissions,
    setItemSubmissions,
    startError,
    setStartError,
    isSubmitting,
    startItem,
    submitItem,
    submitHomework,
    saveDraft,
    lastSavedAt,
  } = useHomeworkSubmission(homeworkId, intl);

  const {
    fetchMock,
    getMock,
    isMockLoading,
    setMockForSection,
  } = useLazyMocks(router.locale, intl, setStartError);

  const {
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    partSummaries,
    activePartIndex,
    setActivePartIndex,
    currentQuestionNumber,
    focusQuestionNumber,
    questionNumberToIndexMap,
    isFullscreen,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSelectQuestion,
    handlePartSummariesChange,
    handlePartChangeFromFooter,
    handleStepPart,
    handleQuestionSelectFromFooter,
    handleFullscreen,
    resetSession,
    buildAnswersObject,
    hasAnswers,
  } = useQuestionSession({
    getMock,
    getSectionConfig,
    sectionType: currentSectionType,
  });


  // --- EFFECTS ---

  // 1. Initialize submissions
  useEffect(() => {
    if (homework?.my_submissions) {
      const initialSubmissions = {};
      Object.entries(homework.my_submissions).forEach(([itemId, data]) => {
        if (data?.status) {
          initialSubmissions[itemId] = { status: data.status, score: data.score };
        }
      });
      if (Object.keys(initialSubmissions).length > 0) {
        setItemSubmissions((prev) => ({ ...prev, ...initialSubmissions }));
      }
    }
  }, [homework?.my_submissions, setItemSubmissions]);

  // 2. Load Mock (when entering TAKING mode)
  useEffect(() => {
    if (viewMode !== 'TAKING' || !currentItem || !currentSectionType) return;

    const loadMock = async () => {
      const itemKey = `${currentItem.id}-${currentSectionType}`;
      if (loadedItemRef.current === itemKey) return;
      
      setLoadingItemMock(true);
      try {
        await fetchMock(currentSectionType, currentItem.mock_id);
        loadedItemRef.current = itemKey;
      } catch (err) {
        console.error("Failed to load mock:", err);
      } finally {
        setLoadingItemMock(false);
      }
    };

    loadMock();
  }, [viewMode, currentItem, currentSectionType, fetchMock]);

  // 3. Start Submission (when entering TAKING mode and mock loaded)
  useEffect(() => {
    if (viewMode !== 'TAKING' || !currentItem || !currentSectionType || loadingItemMock) return;

    const startSubmissionFn = async () => {
      const mock = getMock(currentSectionType);
      if (!mock) return;

      const itemKey = `${currentItem.id}`;
      // Logic: if already started this session, don't restart api call
      // Logic: if status is already STARTED/SUBMITTED in itemSubmissions, we are technically "resuming" locally
      // but might need to tell backend if it's a new session. 
      // useHomeworkSubmission handles "already in progress" gracefully.
      if (startedItemRef.current === itemKey) return;

      const existingStatus = itemSubmissions[currentItem.id]?.status;
      if (existingStatus === 'SUBMITTED' || existingStatus === 'GRADED') {
         // Already done, shouldn't really be here unless reviewing? 
         // Assuming "No leavable" means strictly taking. 
         // For now, let's allow re-entry if backend allows, or just don't call start.
         return; 
      }

      try {
        await startItem(currentItem.id, currentItem.mock_id, currentItem.content_type);
        startedItemRef.current = itemKey;
      } catch (err) {
        console.error("Failed to start item:", err);
      }
    };

    startSubmissionFn();
  }, [viewMode, currentItem, currentSectionType, loadingItemMock, getMock, itemSubmissions, startItem]);

  // 4. Block Navigation (Strict Mode)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only block if in TAKING mode and not submitting
      if (viewMode === 'TAKING' && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Push state hack to prevent back button
    if (viewMode === 'TAKING') {
      history.pushState(null, null, location.href);
      const handlePopState = () => {
         history.pushState(null, null, location.href);
         toast.warning(intl.formatMessage({ id: "Cannot leave", defaultMessage: "You cannot leave the homework while taking a question." }));
      };
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [viewMode, isSubmitting, intl]);

  // 5. Auto-Save
  useEffect(() => {
    if (viewMode !== 'TAKING' || !currentItem || !currentSubmissionId || !hasAnswers()) return;

    const performAutoSave = async () => {
      setIsAutoSaving(true);
      try {
        const mock = getMock(currentSectionType);
        const answersObj = buildAnswersObject(mock);
        await saveDraft(currentItem.id, answersObj);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsAutoSaving(false);
      }
    };

    const timer = setTimeout(performAutoSave, 2000);
    return () => clearTimeout(timer);
  }, [answers, currentItem, currentSubmissionId, hasAnswers, viewMode, buildAnswersObject, getMock, currentSectionType, saveDraft]);


  // --- ACTIONS ---

  const handleStartItem = (index) => {
    setCurrentItemIndex(index);
    setViewMode('TAKING');
    resetSession();
    // Start refs will trigger in effects
  };

  const handleReturnToList = () => {
    setViewMode('LIST');
    setCurrentItemIndex(null);
    resetSession();
    loadedItemRef.current = null;
    startedItemRef.current = null;
    mutateHomework(); // Refresh statuses
  };

  const handleSubmitItemWrapper = async () => {
    if (!currentItem || !currentSubmissionId) return;

    const mock = getMock(currentSectionType);
    const answersObj = buildAnswersObject(mock);

    const hasAny = Object.values(answersObj).some(val => val && String(val).trim() !== "");
    if (!hasAny) {
      toast.error(intl.formatMessage({ id: "Answer required", defaultMessage: "Please answer at least one question." }));
      return;
    }

    const success = await submitItem(currentItem.id, answersObj);
    if (success) {
       toast.success(intl.formatMessage({ id: "Item submitted", defaultMessage: "Item submitted!" }));
       // Return to list after successful submission
       handleReturnToList();
    }
  };

  const isItemCompleted = (itemId) => {
    const s = itemSubmissions[itemId]?.status;
    return s === "GRADED" || s === "SUBMITTED";
  };
  
  const finishHomework = () => {
     submitHomework().then((res) => {
        if(res) {
          toast.success("Homework Finished!");
          router.push("/dashboard/homeworks");
        }
     });
  };


  // --- RENDER ---

  if (pageLoading || homeworkLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader className="animate-spin text-blue-600" /></div>;
  }

  if (homeworkError || !homework) {
    return <div className="h-screen flex items-center justify-center"><p className="text-red-500">Error loading homework</p></div>;
  }

  // --- VIEW: LIST MODE ---
  if (viewMode === 'LIST') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
           <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <button onClick={() => router.push("/dashboard/homeworks")} className="flex items-center text-gray-500 mb-6 hover:text-gray-900 transition-colors">
                 <ArrowLeft size={18} className="mr-2"/> 
                 {intl.formatMessage({ id: "Back to Homeworks", defaultMessage: "Back to Homeworks" })}
              </button>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                   <h1 className="text-3xl font-bold text-gray-900 mb-2">{homework.title}</h1>
                   {homework.description && (
                     <p className="text-gray-600 max-w-2xl">{homework.description}</p>
                   )}
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                   {homework.deadline && (
                     <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <Clock size={16} className="mr-2" />
                        <span className="font-medium">
                          {intl.formatMessage({ id: "Deadline", defaultMessage: "Deadline" })}: {" "}
                          {new Date(homework.deadline).toLocaleString(router.locale, {
                             dateStyle: 'medium',
                             timeStyle: 'short'
                          })}
                        </span>
                     </div>
                   )}
                   <div className="flex items-center text-sm text-gray-500 px-1">
                      <span>{items.length} {intl.formatMessage({ id: "tasks", defaultMessage: "tasks" })}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {intl.formatMessage({ id: "Created by", defaultMessage: "Created by" })} {homework.created_by_name}
                      </span>
                   </div>
                </div>
              </div>
           </div>

           {/* Cards Grid - Exam Style */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {items.map((item, idx) => {
                 const status = itemSubmissions[item.id]?.status || 'NOT_STARTED';
                 const isCompleted = status === 'SUBMITTED' || status === 'GRADED';
                 const isStarted = status === 'STARTED';
                 
                 // Map status to styling (similar to ExamSectionCard)
                 const statusConfig = {
                    NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-800", label: intl.formatMessage({ id: "Not Started", defaultMessage: "Not Started" }) },
                    STARTED: { bg: "bg-yellow-100", text: "text-yellow-800", label: intl.formatMessage({ id: "In Progress", defaultMessage: "In Progress" }) },
                    SUBMITTED: { bg: "bg-blue-100", text: "text-blue-800", label: intl.formatMessage({ id: "Submitted", defaultMessage: "Submitted" }) },
                    GRADED: { bg: "bg-green-100", text: "text-green-800", label: intl.formatMessage({ id: "Graded", defaultMessage: "Graded" }) },
                 };
                 const style = statusConfig[status] || statusConfig.NOT_STARTED;

                 return (
                   <button 
                      key={item.id} 
                      onClick={() => handleStartItem(idx)}
                      disabled={isCompleted}
                      className={`group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-left flex flex-col items-start h-full
                        ${isCompleted ? 'opacity-75' : ''}
                      `}
                   >
                      <div className="flex justify-between items-start w-full mb-4">
                         <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {idx + 1}
                         </span>
                         
                         {item.content_type && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                              item.content_type === 'LISTENING' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                              item.content_type === 'READING' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                              item.content_type === 'WRITING' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                            }`}>
                              {item.content_type}
                            </span>
                         )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2" title={item.content_title || item.title}>
                         {item.content_title || item.title || `Task ${idx + 1}`}
                      </h3>
                      
                      <div className="mt-auto pt-4 w-full flex items-center justify-between">
                         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.bg} ${style.text}`}>
                            {(status === 'GRADED' || status === 'SUBMITTED') && <CheckCircle className="w-4 h-4" />}
                            <span className="text-sm font-semibold">{style.label}</span>
                         </div>
                         
                         {!isCompleted && (
                            <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                               <PlayCircle size={24} />
                            </div>
                         )}
                      </div>
                   </button>
                 );
              })}
           </div>
           
           {/* Finish Button */}
           <div className="mt-12 flex justify-end border-t pt-6">
               <button 
                  onClick={finishHomework}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
               >
                  Finish Homework
               </button>
           </div>
        </div>
      </div>
    );
  }

  // --- VIEW: TAKING MODE ---
  const showContent = getMock(currentSectionType) && !loadingItemMock;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden fixed inset-0 z-50">
       {/* Header */}
       <div className="bg-white border-b px-4 py-3 flex justify-between items-center shrink-0">
          <div>
             <h2 className="font-bold text-gray-900 line-clamp-1">{homework.title}</h2>
             <p className="text-xs text-gray-500">
                Task {currentItemIndex + 1}: {currentItem?.content_title || 'Untitled'}
                {isAutoSaving && <span className="ml-2 text-blue-500">Saving...</span>}
                {!isAutoSaving && lastSavedAt && <span className="ml-2 text-green-500">Saved</span>}
             </p>
          </div>
          
          <div className="flex gap-2">
             <button onClick={handleFullscreen} className="p-2 hover:bg-gray-100 rounded">
                <Maximize size={18} />
             </button>
             <button 
               onClick={handleSubmitItemWrapper}
               disabled={isSubmitting} 
               className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50"
             >
               {isSubmitting ? 'Submitting...' : 'Submit Task'}
             </button>
          </div>
       </div>

       {/* Body */}
       <div className="flex-1 overflow-auto relative bg-gray-50">
          {!showContent ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" />
             </div>
          ) : (
             <div className={`p-4 md:p-8 max-w-5xl mx-auto min-h-full ${partSummaries.length > 0 ? 'pb-32' : ''}`}>
                 <ExamQuestion 
                    mock={getMock(currentSectionType)}
                    sectionType={currentSectionType}
                    currentQuestionIndex={currentQuestionIndex}
                    answers={answers}
                    onAnswerChange={handleAnswerChange}
                    onNext={handleNextQuestion}
                    onPrevious={handlePreviousQuestion}
                    onSelectQuestion={handleSelectQuestion}
                    onPartSummariesChange={handlePartSummariesChange}
                    onPartChange={handlePartChangeFromFooter}
                    activePartIndex={activePartIndex}
                    focusQuestionNumber={focusQuestionNumber}
                    isPractice={false}
                 />
             </div>
          )}
       </div>

       {/* Footer */}
       {showContent && partSummaries.length > 0 && (
          <ListeningFooter 
             partSummaries={partSummaries}
             activePartIndex={activePartIndex}
             currentQuestionNumber={currentQuestionNumber}
             answers={answers}
             questionNumberToIndexMap={questionNumberToIndexMap}
             onPartChange={handlePartChangeFromFooter}
             onStepPart={handleStepPart}
             onQuestionSelect={handleQuestionSelectFromFooter}
          />
       )}
    </div>
  );
};

export default HomeworkTaking;
