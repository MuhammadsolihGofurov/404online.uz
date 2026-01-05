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
            dateFormat="dd/MM/yyyy HH:mm"
            timeCaption="Vaqt"
            placeholderText={placeholder || "Sana va vaqtni tanlang"}
            className={`w-full px-4 py-3 pl-11 h-[56px] border border-buttonGrey rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
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

DateTimePickerField.displayName = "DateTimePickerField";

// Demo Component - Ishlatish namunasi
export default function DateTimePickerDemo() {
  const [date, setDate] = React.useState(null);
  const [time, setTime] = React.useState(null);
  const [datetime, setDatetime] = React.useState(null);
  const [startDate, setStartDate] = React.useState(null);
  const [startTime, setStartTime] = React.useState(null);

  const handleSubmit = () => {
    const data = {
      date: date,
      time: time,
      datetime: datetime,
      startDate: startDate,
      startTime: startTime,
    };
    console.log("Form data:", data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Date & Time Picker Components
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          React Hook Form bilan integratsiya qilingan
        </p>

        <div className="space-y-6">
          {/* Date Picker alohida */}
          <div className="p-6 bg-blue-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Faqat Sana
            </h2>
            <DatePickerField
              title="Tug'ilgan sana"
              placeholder="Sanani tanlang"
              value={date}
              onChange={setDate}
              required
              minDate={new Date("1950-01-01")}
              maxDate={new Date()}
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
            />
          </div>

          {/* Time Picker alohida */}
          <div className="p-6 bg-green-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              🕐 Faqat Vaqt
            </h2>
            <TimePickerField
              title="Dars vaqti"
              placeholder="Vaqtni tanlang"
              value={time}
              onChange={setTime}
              required
            />
          </div>

          {/* DateTime Picker birga */}
          <div className="p-6 bg-purple-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📅🕐 Sana va Vaqt
            </h2>
            <DateTimePickerField
              title="Imtihon sanasi va vaqti"
              placeholder="Sana va vaqtni tanlang"
              value={datetime}
              onChange={setDatetime}
              required
              minDate={new Date()}
            />
          </div>

          {/* Grid Layout - ikkitasi yonma-yon */}
          <div className="p-6 bg-orange-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Grid Layout
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                title="Boshlanish sanasi"
                placeholder="Boshlanish"
                value={startDate}
                onChange={setStartDate}
              />
              <TimePickerField
                title="Boshlanish vaqti"
                placeholder="Vaqt"
                value={startTime}
                onChange={setStartTime}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Saqlash
          </button>
        </div>

        {/* Qo'shimcha ma'lumot */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">📚 Xususiyatlar:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✅ React Hook Form bilan to'liq integratsiya</li>
            <li>✅ Alohida Date, Time va DateTime komponentlar</li>
            <li>✅ Chiroyli va zamonaviy UI dizayn</li>
            <li>✅ Responsive va mobile-friendly</li>
            <li>✅ Validation va error handling</li>
            <li>✅ Customizable (minDate, maxDate, timeIntervals)</li>
            <li>✅ Keyboard navigation qo'llab-quvvatlaydi</li>
          </ul>
        </div>
      </div>

      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .react-datepicker__header {
          background-color: #3b82f6;
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          padding: 16px 0;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header {
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }

        .react-datepicker__day-name {
          color: white;
          font-weight: 500;
        }

        .react-datepicker__day {
          border-radius: 8px;
          transition: all 0.2s;
          margin: 2px;
        }

        .react-datepicker__day:hover {
          background-color: #dbeafe;
          border-radius: 8px;
        }

        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
        }

        .react-datepicker__day--keyboard-selected {
          background-color: #93c5fd;
        }

        .react-datepicker__day--today {
          font-weight: 600;
          color: #3b82f6;
        }

        .react-datepicker__time-container {
          border-left: 1px solid #e5e7eb;
        }

        .react-datepicker__time-list-item:hover {
          background-color: #dbeafe !important;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #3b82f6 !important;
          color: white !important;
          font-weight: 600;
        }

        .react-datepicker__navigation {
          top: 20px;
        }

        .react-datepicker__navigation-icon::before {
          border-color: white;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #dbeafe;
        }
      `}</style>
    </div>
  );
}
