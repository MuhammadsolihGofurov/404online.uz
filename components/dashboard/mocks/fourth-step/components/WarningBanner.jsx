/**
 * WarningBanner Component
 * Displays warning/error messages
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

export function WarningBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 p-3 text-sm border rounded-2xl border-amber-200 bg-amber-50 text-amber-700">
      <AlertTriangle size={16} />
      {message}
    </div>
  );
}

