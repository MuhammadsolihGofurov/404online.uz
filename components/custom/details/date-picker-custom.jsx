import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock } from "lucide-react";

// Date Picker Component (faqat sana)
export const DatePickerField = forwardRef(
  ({ title, error, placeholder, value, onChange, required, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {title && (
          <label className="text-sm font-medium text-gray-700">
            {title}
            {/* {required && <span className="text-red-500 ml-1">*</span>} */}
          </label>
        )}
        <div className="relative w-full">
          <DatePicker
            selected={value}
            onChange={onChange}
            dateFormat="dd/MM/yyyy"
            placeholderText={placeholder || "Sanani tanlang"}
            className={`w-full px-4 py-3 pl-11 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            wrapperClassName="w-full"
            calendarClassName="custom-calendar"
            {...props}
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);

DatePickerField.displayName = "DatePickerField";

// Time Picker Component (faqat vaqt)
export const TimePickerField = forwardRef(
  ({ title, error, placeholder, value, onChange, required, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {title && (
          <label className="text-sm font-medium text-gray-700">
            {title}
            {/* {required && <span className="text-red-500 ml-1">*</span>} */}
          </label>
        )}
        <div className="relative w-full">
          <DatePicker
            selected={value}
            onChange={onChange}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Vaqt"
            dateFormat="HH:mm"
            timeFormat="HH:mm"
            placeholderText={placeholder || "Vaqtni tanlang"}
            className={`w-full px-4 py-3 pl-11 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            wrapperClassName="w-full"
            {...props}
          />
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);

TimePickerField.displayName = "TimePickerField";

// Date Time Picker Component (sana va vaqt birga)
export const DateTimePickerField = forwardRef(
  ({ title, error, placeholder, value, onChange, required, ...props }, ref) => {
    return (
      <div className="flex flex-col items-start gap-2 w-full">
        {title && (
          <label className="text-textSecondary font-semibold text-sm">
            {title}
            {/* {required && <span className="text-red-500 ml-1">*</span>} */}
          </label>
        )}
        <div className="relative w-full">
          <DatePicker
            selected={value}
            onChange={onChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="dd.MM.yyyy, HH:mm"
            timeCaption="Time"
            placeholderText={placeholder || "Date and Time"}
            className={`
            w-full h-[50px] px-11 bg-white border rounded-xl outline-none transition-all duration-200
            text-gray-700 text-sm placeholder:text-gray-400
            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-gray-300"
            }
          `}
            calendarClassName="modern-datepicker-calendar"
            wrapperClassName="w-full"
            autoComplete="off"
            {...props}
          />
          <Calendar
            className={`
          absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-200
          ${
            error
              ? "text-red-400"
              : "text-gray-400 group-focus-within:text-blue-500"
          }
        `}
          />
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);

DateTimePickerField.displayName = "DateTimePickerField";
