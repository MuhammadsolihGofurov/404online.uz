import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIntl } from "react-intl";

export function QuestionPalette({
  questions = [],
  answers = {},
  currentQuestionId,
  onSelectQuestion,
  markedForReview = new Set(),
  onToggleReview,
}) {
  const intl = useIntl();
  const scrollRef = useRef(null);

  // Auto-scroll to current question
  useEffect(() => {
    if (scrollRef.current && currentQuestionId) {
      const currentBtn = scrollRef.current.querySelector(`[data-qid="${currentQuestionId}"]`);
      if (currentBtn) {
        currentBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentQuestionId]);

  if (!questions || questions.length === 0) return null;

  return (
    <div className="h-[72px] bg-[#e5e7eb] border-t border-[#9ca3af] flex items-center px-4 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {/* Review Button Area */}
      <div className="mr-6 pr-6 border-r border-gray-300 flex items-center h-10">
        <button
          onClick={() => currentQuestionId && onToggleReview && onToggleReview(String(currentQuestionId))}
          className="flex flex-col items-center group outline-none"
          title={intl.formatMessage({ id: "Mark for Review" })}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              markedForReview.has(String(currentQuestionId))
                ? "bg-yellow-400 border-yellow-400 shadow-sm"
                : "border-gray-500 group-hover:border-black bg-white"
            }`}
          >
            {markedForReview.has(String(currentQuestionId)) && (
              <div className="w-2 h-2 bg-black rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 text-gray-700 uppercase tracking-wide group-hover:text-black">
            {intl.formatMessage({ id: "Review" })}
          </span>
        </button>
      </div>

      {/* Navigation Arrows (Left) */}
      <button 
        className="p-1 text-gray-500 hover:text-black hover:bg-gray-200 rounded mr-2"
        onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Question Numbers */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-hide px-2"
      >
        {questions.map((q, index) => {
          const qId = String(q.id);
          // Check if answered
          const answer = answers[qId];
          let isAnswered = false;
          if (answer) {
             if (Array.isArray(answer)) isAnswered = answer.length > 0;
             else if (typeof answer === 'object') isAnswered = Object.values(answer).some(v => v && String(v).trim().length > 0);
             else isAnswered = !!String(answer).trim();
          }

          const isCurrent = qId === String(currentQuestionId);
          const isReview = markedForReview.has(qId);

          return (
            <button
              key={q.id}
              data-qid={qId}
              onClick={() => onSelectQuestion(index)}
              className={`
                relative flex items-center justify-center w-8 h-8 text-sm font-bold transition-all outline-none
                ${isReview ? 'rounded-full' : 'rounded-[2px]'} 
                ${isCurrent 
                  ? 'bg-[#1f2937] text-white border border-[#1f2937]' 
                  : 'bg-white text-black border border-[#9ca3af] hover:bg-gray-50 hover:border-gray-500'
                }
                ${isReview && !isCurrent ? 'bg-yellow-100 border-yellow-500 text-yellow-900' : ''}
              `}
            >
              {q.question_number || index + 1}
              
              {/* Answered Indicator (Underline) */}
              {isAnswered && !isCurrent && !isReview && (
                 <div className="absolute bottom-[3px] w-4 h-[2px] bg-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Arrows (Right) */}
      <button 
        className="p-1 text-gray-500 hover:text-black hover:bg-gray-200 rounded ml-2"
        onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

