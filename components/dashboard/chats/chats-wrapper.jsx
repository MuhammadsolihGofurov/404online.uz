import React, { useEffect, useState } from "react";
import { ChatsCenterTopics, ChatsLeftGroups, ChatsRightMessages } from ".";
import { useParams } from "@/hooks/useParams";
import { MoveLeft } from "lucide-react";
import { useIntl } from "react-intl";

export default function ChatsWrapper({ role, loading, page }) {
  const [step, setStep] = useState(1); // MOBILE NAVIGATION STEP
  const [isDesktop, setIsDesktop] = useState(true);
  const { updateParams } = useParams();
  const intl = useIntl();

  // BREAKPOINT LISTENING
  useEffect(() => {
    const listener = () => setIsDesktop(window.innerWidth >= 1200);
    listener();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);

  return (
    <div className="grid grid-cols-12 bg-gray-50 rounded-2xl overflow-hidden h-[85vh]">
      {/* ===== LEFT (Groups) ===== */}
      <div
        className={`
          bg-white border-r border-gray-200 h-full
          ${isDesktop ? "col-span-2" : step === 1 ? "col-span-12" : "hidden"}
        `}
      >
        {!isDesktop && step !== 1 && (
          <button className="p-3 text-sm" onClick={() => setStep(1)}>
            ⬅ Ortga
          </button>
        )}

        <ChatsLeftGroups
          loading={loading}
          onSelectGroup={(group_id) => {
            updateParams("group_id", group_id);

            if (!isDesktop) {
              setStep(2);
            }
          }}
        />
      </div>

      {/* ===== CENTER (Topics) ===== */}
      <div
        className={`
          border-r bg-white border-gray-200 h-full overflow-y-auto flex flex-col
          ${isDesktop ? "col-span-3" : step === 2 ? "col-span-12" : "hidden"}
        `}
      >
        {!isDesktop && (
          <button
            className="p-3 text-sm flex items-center text-gray-400 gap-1 font-medium"
            onClick={() => setStep(1)}
          >
            <MoveLeft className="w-4 " />
            {intl.formatMessage({ id: "Return" })}
          </button>
        )}

        <ChatsCenterTopics
          loading={loading}
          onSelectTopic={(topic_id) => {
            updateParams("topic_id", topic_id);

            if (!isDesktop) {
              setStep(3);
            }
          }}
        />
      </div>

      {/* ===== RIGHT (Messages) ===== */}
      <div
        className={`
          bg-white h-full flex flex-col overflow-y-auto scroll_none
          ${isDesktop ? "col-span-7" : step === 3 ? "col-span-12" : "hidden"}
        `}
      >
        {!isDesktop && (
          <button
            className="p-3 text-sm flex items-center text-gray-400 gap-1 font-medium"
            onClick={() => setStep(2)}
          >
            <MoveLeft className="w-4 " />
            {intl.formatMessage({ id: "Return" })}
          </button>
        )}

        <ChatsRightMessages loading={loading} role={role} />
      </div>
    </div>
  );
}
