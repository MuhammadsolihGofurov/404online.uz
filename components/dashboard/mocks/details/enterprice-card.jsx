import React from "react";
import { ListChecks, BookOpen, Settings, Check } from "lucide-react";
import { useIntl } from "react-intl";

const EnterpriseCard = ({ title, description, onClick, icon: Icon }) => {
  const intl = useIntl();

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col justify-between items-center py-8 px-6 rounded-2xl transition-all duration-500 ease-in-out cursor-pointer 
         w-full text-center bg-white text-gray-800 border-2 border-gray-100 hover:border-indigo-200
      `}
    >
      <div
        className={`
          mb-4 p-5 rounded-full flex items-center justify-center 
          transition-colors duration-500 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100
        `}
      >
        <Icon size={36} strokeWidth={"1.5"} />
      </div>

      <div className="flex flex-col gap-3 pb-5">
        <h3
          className={`
              font-semibold text-lg
              transition-colors duration-500 text-textPrimary
            `}
        >
          {title}
        </h3>

        <p
          className={`
              text-sm transition-colors duration-500 text-gray-400`}
        >
          {description}
        </p>
      </div>

      <div className={`pt-4 w-full border-t border-gray-100`}>
        <span
          className={`
            text-sm font-semibold uppercase tracking-widest transition-colors duration-500 flex items-center justify-center text-indigo-500`}
        >
          {intl.formatMessage({ id: "Choose" })}
        </span>
      </div>
    </div>
  );
};

export default EnterpriseCard;
