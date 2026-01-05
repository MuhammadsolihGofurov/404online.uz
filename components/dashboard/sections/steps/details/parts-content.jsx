import { Alerts } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import Pagination from "@/components/custom/pagination";
import { PartQuestionItem } from "@/components/dashboard/details/items";
import { PartQuestionGroupItemSkeleton } from "@/components/skeleton";
import { useModal } from "@/context/modal-context";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useParams } from "@/hooks/useParams";
import { setPartData } from "@/redux/slice/settings";
import fetcher from "@/utils/fetcher";
import { Plus, PlusCircle } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useIntl } from "react-intl";
import { useDispatch } from "react-redux";
import useSWR from "swr";

export default function PartsContent({ sectionType }) {
  const { findParams } = useParams();
  const router = useRouter();
  const activePartId = findParams("partId") || null;
  const page = findParams("page") || 1;
  const intl = useIntl();
  const { openModal, modalClosed } = useModal();
  const { openOffcanvas, offcanvasClosed } = useOffcanvas();

  const groupKey =
    sectionType === "listening"
      ? "part_id"
      : sectionType === "reading"
      ? "passage_id"
      : "task_id";

  const groupValue =
    sectionType === "listening"
      ? "parts"
      : sectionType === "reading"
      ? "passages"
      : "tasks";

  // 1. Question guruhlarini olish (Writing bo'lsa fetch qilmaydi)
  const { data: groups, isLoading } = useSWR(
    activePartId && sectionType !== "writing" // Writing bo'lsa null qaytaradi
      ? [
          `/editor/${sectionType}-groups/`,
          router.locale,
          activePartId,
          page,
          offcanvasClosed,
        ]
      : null,
    ([url, locale, id, p]) =>
      fetcher(
        `${url}?${groupKey}=${id}&page=${p}&page_size=8`,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  // 2. Part/Passage ma'lumotlarini olish (Writing bo'lsa fetch qilmaydi)
  const { data: partInfo } = useSWR(
    activePartId
      ? [
          `/editor/${sectionType}-${groupValue}/`,
          router.locale,
          activePartId,
          modalClosed,
        ]
      : null,
    ([url, locale, iid]) =>
      fetcher(
        `${url}${iid}`,
        { headers: { "Accept-Language": locale } },
        {},
        true
      )
  );

  const handleModal = () => {
    openOffcanvas("questionGeneratorOffcanvas", {}, "right");
  };

  const handlePassageTextModal = () => {
    const modalName =
      sectionType === "reading" ? "passageTextModal" : "taskTextModal";
    openModal(modalName, { id: activePartId, partInfo: partInfo || {} }, "big");
  };

  return (
    <div className="bg-white flex flex-col gap-5 rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">
            {sectionType === "writing"
              ? "Writing Task Details"
              : intl.formatMessage({ id: "Question Groups" })}
          </h3>
          <p className="text-xs text-textSecondary italic">
            {sectionType === "writing"
              ? "Create and manage your writing task prompts"
              : intl.formatMessage({
                  id: "Manage your question sets for this part",
                })}
          </p>
        </div>

        <div className="flex flex-row gap-1">
          {/* Writing va Reading uchun Text Modal tugmasi */}
          {(sectionType === "reading" || sectionType === "writing") && (
            <button
              type="button"
              disabled={!activePartId}
              onClick={handlePassageTextModal}
              className="text-xs font-medium text-textPrimary hover:text-main rounded-xl py-2 px-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={12} />
              {sectionType === "reading"
                ? "Add passage text"
                : "Add task prompt"}
            </button>
          )}

          {/* Writing bo'lmasa Create Group tugmasini ko'rsatish */}
          {sectionType !== "writing" && (
            <button
              type="button"
              disabled={!activePartId}
              onClick={handleModal}
              className="text-xs font-medium text-white bg-main hover:bg-blue-700 rounded-xl py-2 px-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={12} /> {intl.formatMessage({ id: "Create group" })}
            </button>
          )}
        </div>
      </div>

      <Alerts
        type={"info"}
        messageId={
          sectionType === "writing"
            ? "You can set task instructions, word limits and upload images for Writing tasks."
            : "Each group can contain different question types (Multiple choice, Matching, etc.)"
        }
      />

      {/* KONTENT QISMI: 
         Agar writing bo'lsa, pastki qismda hech narsa chiqmaydi (faqat yuqoridagi tugmalar qoladi).
      */}
      {sectionType !== "writing" ? (
        <>
          {!activePartId ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 border-2 border-dashed rounded-3xl bg-gray-50">
              {intl.formatMessage({
                id: "Please select a part to start editing",
              })}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PartQuestionGroupItemSkeleton />
              <PartQuestionGroupItemSkeleton />
            </div>
          ) : groups?.results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <button
                onClick={handleModal}
                className="text-main text-xs font-bold hover:underline"
              >
                {intl.formatMessage({ id: "Click 'Create group' to start" })}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Writing uchun maxsus chiroyli UI */
        <div className="flex flex-col gap-6 animate-fadeIn">
          {!activePartId ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 border-2 border-dashed rounded-3xl bg-gray-50">
              {intl.formatMessage({
                id: "Please select a writing task to view",
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Header qismi */}
              <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <span className="bg-main/10 text-main text-xs font-bold px-3 py-1 rounded-full uppercase">
                  Task {activePartId || 1}
                </span>
                <span className="text-textSecondary text-xs font-medium">
                  Min words:{" "}
                  <span className="text-textPrimary font-bold">
                    {partInfo?.min_words || 150}
                  </span>
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Prompt qismi */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                    Task Instructions
                  </h4>
                  <div
                    className="prose prose-sm max-w-none text-textSecondary bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                    dangerouslySetInnerHTML={{
                      __html:
                        partInfo?.prompt || "<p>No prompt provided yet.</p>",
                    }}
                  />
                </div>

                {/* Rasm qismi */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                    Reference Image
                  </h4>
                  {partInfo?.image ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img
                        src={partInfo.image}
                        alt="Task Reference"
                        className="w-full h-auto object-contain max-h-[400px] transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-white text-gray-400 text-xs italic">
                      No image uploaded for this task
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
