import React from "react";
import { StepProgressBar } from ".";
import { useIntl } from "react-intl";
import { AlertTriangle } from "lucide-react";
import { Alerts } from "@/components/custom/details";

export default function StepsWrapper({
  title,
  description,
  currentStep,
  steps,
  children,
  alert_type = "info",
}) {
  const intl = useIntl();

  return (
    <div className="w-full bg-white rounded-2xl py-12 px-5 sm:px-6 flex flex-col gap-10">
      <StepProgressBar steps={steps} currentStep={currentStep} />

      <Alerts type={alert_type} messageId={description} />

      {children}
    </div>
  );
}
