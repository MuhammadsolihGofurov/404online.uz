import React from "react";
import { List } from "lucide-react";
import { useIntl } from "react-intl";

export default function HomeworkItemsList({ items }) {
  const intl = useIntl();
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <h2 className="text-2xl font-bold text-gray-400 mb-2">
          {intl.formatMessage({ id: "No homework items", defaultMessage: "No homework items" })}
        </h2>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <List size={20} />
        {intl.formatMessage({ id: "Homework Items", defaultMessage: "Homework Items" })}
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold">{index + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {item.content_title || item.title}
              </p>
              {item.content_type && (
                <span className="inline-block text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 mr-2 mt-1">
                  {item.content_type}
                </span>
              )}
              {item.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {item.order && (
                  <span className="flex items-center gap-1">
                    {intl.formatMessage({
                      id: "Order",
                      defaultMessage: "Order",
                    })}
                    : {item.order}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
