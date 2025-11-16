import { Dropdown } from "@/components/custom/details";
import { Check, MoreVertical, Users, Users2 } from "lucide-react";
import React from "react";

export default function GroupListItem({ item }) {
  return (
    <div className="rounded-xl bg-[#F7F6FA] overflow-hidden">
      <div className="bg-[#495e61] min-h-[72px] relative">
        <div className="w-14 h-14 rounded-full bg-slate-400 absolute -bottom-5 left-2/4 -translate-x-2/4 flex items-center justify-center font-semibold text-textPrimary">
          {item?.name?.slice(0, 1).toUpperCase()}
        </div>
      </div>
      <div className="px-3 pb-3 pt-7 text-center text-textPrimary text-sm font-medium">
        {item?.name}
      </div>
      <div className="w-full p-3 text-sm border-t border-t-gray-200 text-[#625F68] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-textPrimary">
          <Users className="h-4 w-4"/>
          <span>{item?.member_count}</span>
        </div>
        <Dropdown
          buttonContent={<MoreVertical className="h-5 w-5 text-gray-500" />}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-green-500"
            onClick={() => {
              if (!item?.target_user) {
                toast.error(
                  intl.formatMessage({
                    id: "The user has not sent a request yet!",
                  })
                );
              } else {
                handleToggleActive(item?.code, "activate");
              }
            }}
          >
            <Check className="h-4 w-4 text-green-500" /> Activate
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
