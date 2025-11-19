import React from "react";

export default function StepProgressBar({ steps, currentStep }) {
  return (
    <div className="flex justify-between items-center space-x-2 w-full p-4 bg-gray-50 rounded-2xl shadow-inner">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        // Dinamik rang klasslari
        const primaryColor = isCurrent ? "bg-indigo-600 text-white shadow-md shadow-indigo-300" : "bg-gray-200 text-gray-600";
        const completedColor = isCompleted ? "bg-green-500 text-white" : primaryColor;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              {/* Raqamli Indikator */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-extrabold transition-all duration-500 mb-2
                  ${isCompleted ? "bg-green-500 text-white" : isCurrent ? "bg-indigo-600 text-white ring-4 ring-indigo-200" : "bg-white border-2 border-gray-300 text-gray-500"}
                `}
              >
                {stepNumber}
              </div>
              
              {/* Yorliq Matni */}
              <div className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-colors duration-500 ${isCurrent ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                {step.label || `Qadam ${stepNumber}`}
              </div>
            </div>

            {/* Chiziq (Indikator) */}
            {index < steps.length - 1 && (
              <div className="flex-1 min-w-0 flex items-center">
                <div 
                  className={`w-full h-1 rounded-full transition-colors duration-500 
                    ${isCompleted ? "bg-green-500" : isCurrent ? "bg-indigo-300" : "bg-gray-300"}
                  `}
                ></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}