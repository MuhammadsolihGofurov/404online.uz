import { useParams } from "@/hooks/useParams";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { useIntl } from "react-intl";

export default function MaterialsTypes({ role }) {
  const intl = useIntl();
  const router = useRouter();
  const { updateParams } = useParams();

  const navItems = useMemo(
    () => [
      {
        label: "Documents",
        type: "DOCUMENTS",
        allowedRoles: ["CENTER_ADMIN", "TEACHER", "ASSISTANT", "STUDENT"],
      },
      {
        label: "Training zone",
        type: "TRAINING_ZONE",
        allowedRoles: ["STUDENT"],
      },
      // {
      //   label: "Templates",
      //   type: "TEMPLATES",
      //   allowedRoles: ["CENTER_ADMIN", "TEACHER", "ASSISTANT"],
      // },
    ],
    []
  );

  const visibleItems = navItems.filter((item) =>
    item.allowedRoles.includes(role)
  );

  const handleTabChange = (type) => {
    updateParams("type", type);
  };

  return (
    <div className="bg-white w-full rounded-2xl p-5 flex flex-col sm:flex-row flex-wrap sm:items-center gap-5">
      <p className="text-textPrimary text-sm font-semibold">
        {intl.formatMessage({ id: "Types" })}:
      </p>
      <div className="flex items-center gap-3">
        {visibleItems.map((item) => {
          const currentQueryType = router.query.type;
          const isActive = currentQueryType === item.type;

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => handleTabChange(item.type)}
              className={`px-4 py-2 rounded-xl border text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-main text-white border-main"
                  : "border-gray-200 text-textPrimary hover:border-main hover:text-main"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
