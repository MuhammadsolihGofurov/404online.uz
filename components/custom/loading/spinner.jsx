import React from "react";

export default function ButtonSpinner({
  mainColor = "border-t-white",
  secondColor = "border-gray-300",
}) {
  return (
    <div
      className={`w-6 h-6 border-2 ${mainColor} ${secondColor} rounded-full animate-spin`}
    ></div>
  );
}
