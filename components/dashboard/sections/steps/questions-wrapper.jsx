import { useModal } from "@/context/modal-context";
import { useOffcanvas } from "@/context/offcanvas-context";
import { useParams } from "@/hooks/useParams";
import { SECTIONS_PARTS_URL } from "@/mock/router";
import fetcher from "@/utils/fetcher";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquareCodeIcon,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import Skeleton from "react-loading-skeleton";
import useSWR from "swr";
import { QuestionItem } from "../../details/items";
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

  const groupKey = sectionType === "listening" ? "parts" : "passages";

  const { data: questions, isLoading: isFetching } = useSWR(
    sectionId
      ? [
          `/editor/${sectionType}-questions/`,
          router.locale,
          questionGroupId,
          page,
          offcanvasClosed,
          modalClosed,
        ]
      : null,
    ([url, locale, groupId, p]) =>
      fetcher(
        `${url}?group_id=${groupId}&page=${p}&page_size=9`,
        { headers: { "Accept-Language": locale } },
        {},
        {},
        true
      )
  );

  const { data: groupInfo, isLoading: isGroupFetching } = useSWR(
    sectionId
      ? [
          `/editor/${sectionType}-groups/`,
          router.locale,
          questionGroupId,
          offcanvasClosed,
          modalClosed,
        ]
      : null,
    ([url, locale, groupId]) =>
      fetcher(
        `${url}${groupId}`,
        { headers: { "Accept-Language": locale } },
        {},
        {},
        true
      )
  );

  const { data: partInfo } = useSWR(
    sectionId
      ? [
          `/editor/${sectionType}-${groupKey}/`,
          router.locale,
          partId,
          offcanvasClosed,
          modalClosed,
        ]
      : null,
    ([url, locale, id]) =>
      fetcher(
        `${url}${id}`,
        { headers: { "Accept-Language": locale } },
        {},
        {},
        true
      )
  );

  const handleOpenCreateOffcanvas = () => {
    openOffcanvas(
      "questionGeneratorOffcanvas",
      { partInfo, groupInfo },
      "right"
    );
  };

  // Loading State (Skeleton)
  if (isFetching || isGroupFetching) {
    return (
      <div className="space-y-6 p-6 bg-white rounded-3xl border border-gray-100">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-1">
          <Link
            href={`${SECTIONS_PARTS_URL}?section=${sectionType}&sectionId=${sectionId}&partId=${partId}&partNumber=${partNumber}`}
            className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-main transition-colors"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {intl.formatMessage({ id: "Return section" })}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">
            {intl.formatMessage({ id: "Questions Management" })}
          </h1>
        </div>

        <button
          onClick={handleOpenCreateOffcanvas}
          className="flex items-center gap-2 bg-main hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={18} />
          {intl.formatMessage({ id: "Add question" })}
        </button>
      </div>

      {/* Instruction Card */}
      {groupInfo?.instruction && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
          <div className="bg-blue-500/10 p-2 h-fit rounded-lg">
            <MessageSquareCodeIcon className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1 uppercase tracking-wider">
              {intl.formatMessage({ id: "Instruction" })}
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              {groupInfo.instruction}
            </p>
          </div>
        </div>
      )}

      {/* Questions Grid */}
      <div className="flex flex-col gap-6">
        {questions?.results?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {questions.results.map((q) => (
                <div
                  key={q.id}
                  className="hover:translate-y-[-4px] transition-transform duration-300"
                >
                  <QuestionItem question={q} />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center bg-white p-4 rounded-2xl border border-gray-100">
              <Pagination count={questions?.count} pageSize={9} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <HelpCircle size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              {intl.formatMessage({ id: "No questions found in this group." })}
            </p>
            <button
              onClick={handleOpenCreateOffcanvas}
              className="mt-4 text-main text-sm font-semibold hover:underline"
            >
              + {intl.formatMessage({ id: "Create the first question" })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
