import { Alerts } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import Pagination from "@/components/custom/pagination";
import { PartQuestionItem } from "@/components/dashboard/details/items";
import { PartQuestionGroupItemSkeleton } from "@/components/skeleton";
import { useModal } from "@/context/modal-context";
import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { Plus, PlusCircle } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";

export default function PartsContent({ sectionType }) {
  const { findParams } = useParams();
  const router = useRouter();
  const activePartId = findParams("partId") || null;
  const page = findParams("page") || 1;
  const intl = useIntl();
  const { openModal, modalClosed } = useModal();

  // Question guruhlarini olish
  // Endpoint: /editor/listening-groups/?part=id yoki /editor/reading-groups/?passage=id
  const groupKey = sectionType === "listening" ? "part_id" : "passage_id";

  const { data: groups, isLoading } = useSWR(
    activePartId
      ? [
          `/editor/${sectionType}-groups/`,
          router.locale,
          activePartId,
          page,
          modalClosed,
        ]
      : null,
    ([url, locale, id, p]) =>
      fetcher(
        `${url}?${groupKey}=${id}&page=${p}&page_size=8`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const handleModal = () => {
    openModal("questionGroupModal", {}, "big");
  };

  return (
    <div className="bg-white flex flex-col gap-5 rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">
            {intl.formatMessage({ id: "Question Groups" })}
          </h3>
          <p className="text-xs text-textSecondary italic">
            {intl.formatMessage({
              id: "Manage your question sets for this part",
            })}
          </p>
        </div>
        <button
          type="button"
          disabled={!activePartId}
          onClick={() => handleModal()}
          className="text-xs font-medium text-white bg-main hover:bg-blue-700 rounded-xl py-2 px-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={12} /> {intl.formatMessage({ id: "Create group" })}
        </button>
      </div>

      <Alerts
        type={"info"}
        messageId={
          "Each group can contain different question types (Multiple choice, Matching, etc.)"
        }
      />

      {!activePartId ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 border-2 border-dashed rounded-3xl bg-gray-50">
          {intl.formatMessage({ id: "Please select a part to start editing" })}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <PartQuestionGroupItemSkeleton />
          <PartQuestionGroupItemSkeleton />
          <PartQuestionGroupItemSkeleton />
        </div>
      ) : groups?.results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {groups?.results?.map((group) => (
              <PartQuestionItem key={group.id} group={group} />
            ))}
          </div>
          <Pagination count={groups?.count} pageSize={8} />
        </>
      ) : (
        <div className="animate-fadeIn p-10 rounded-2xl border-gray-200 border-2 border-dashed flex flex-col items-center justify-center gap-2 text-gray-400">
          <p className="text-sm">
            {intl.formatMessage({
              id: "No question groups found for this part.",
            })}
          </p>
          <button className="text-main text-xs font-bold hover:underline">
            {intl.formatMessage({ id: "Click 'Create group' to start" })}
          </button>
        </div>
      )}
    </div>
  );
}
