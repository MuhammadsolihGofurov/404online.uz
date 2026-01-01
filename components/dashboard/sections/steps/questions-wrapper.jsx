import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import useSWR from "swr";
import { ButtonSpinner } from "@/components/custom/loading";
import { PartsContent, PartsTab } from "./details";
import { QuestionItem } from "../../details/items";
import Link from "next/link";
import { useIntl } from "react-intl";
import { ArrowLeft, Plus } from "lucide-react";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useModal } from "@/context/modal-context";
import { SECTIONS_PARTS_URL } from "@/mock/router";
import Pagination from "@/components/custom/pagination";

export default function QuestionsWrapper() {
  const { findParams } = useParams();
  const router = useRouter();
  const intl = useIntl();
  const { openOffcanvas, offcanvasClosed } = useOffcanvas();
  const { modalClosed } = useModal();

  const sectionType = findParams("section") || null;
  const sectionId = findParams("sectionId") || null;
  const partId = findParams("partId") || null;
  const questionGroupId = findParams("groupId") || null;
  const page = findParams("page") || 1;
  const partNumber = findParams("partNumber") || 1;

  const { data: questions, isLoading: isFetching } = useSWR(
    sectionId
      ? [
          `/editor/${sectionType}-questions/`,
          router.locale,
          questionGroupId,
          page,
          sectionType,
          offcanvasClosed,
          modalClosed,
        ]
      : null,
    ([url, locale, groupId, p]) =>
      fetcher(
        `${url}?group_id=${groupId}&page=${p}&page_size=8`,
        { headers: { "Accept-Language": locale } },
        {},
        {},
        true
      )
  );

  if (isFetching) {
    return (
      <div className="p-10 flex justify-center">
        <ButtonSpinner />
      </div>
    );
  }

  const handleOpenCreateOffcanvas = () => {
    openOffcanvas("questionOffcanvas", {}, "right");
  };

  return (
    <div className="flex flex-col gap-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <Link
          href={
            SECTIONS_PARTS_URL +
            `?section=${sectionType}&sectionId=${sectionId}&partId=${partId}&partNumber=${partNumber}`
          }
          className="text-xs font-medium text-main border border-main hover:bg-blue-50 rounded-xl py-2 px-3 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={12} /> {intl.formatMessage({ id: "Return section" })}
        </Link>
        <button
          type="button"
          onClick={() => handleOpenCreateOffcanvas()}
          className="text-xs font-medium text-white bg-main hover:bg-blue-700 rounded-xl py-2 px-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={12} /> {intl.formatMessage({ id: "Add question" })}
        </button>
      </div>
      {questions?.results?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {questions.results.map((q) => (
            <QuestionItem key={q.id} question={q} />
          ))}
          <Pagination count={questions?.results?.count} pageSize={8} />
        </div>
      ) : (
        <p className="text-gray-400 text-xs">
          {intl.formatMessage({ id: "No questions found in this group." })}
        </p>
      )}
    </div>
  );
}
