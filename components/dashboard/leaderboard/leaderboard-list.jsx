import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React from "react";
import { useIntl } from "react-intl";
import useSWR from "swr";
import { useParams } from "@/hooks/useParams";
import { useModal } from "@/context/modal-context";
import {
  CentersTableSkeleton,
  LeaderboardTableSkeleton,
} from "@/components/skeleton";
import Pagination from "@/components/custom/pagination";
import { LeaderboardItem, UserListItem } from "../details/items";

export default function LeaderboardLists({ loading, role }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentPage = parseInt(findParams("page")) || 1;
  const currentExam = findParams("exam_task_id") || "";
  const currentGroup = findParams("group_id") || "";

  const { data: leaderboards, isLoading } = useSWR(
    [
      "/exam-results/leaderboard/",
      router.locale,
      currentPage,
      currentExam,
      currentGroup,
    ],
    ([url, locale, page, exam, group]) =>
      fetcher(
        `${url}?page=${page}${
          group && `&group_id=${group}`
        }&exam_task_id=${exam}`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  if (loading || isLoading) {
    return <LeaderboardTableSkeleton />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-x-auto sm:w-full">
        <table className="w-[700px] sm:w-full text-textPrimary rounded-2xl">
          <thead>
            <tr className="border-b border-dashboard-bg bg-slate-50/50">
              <th className="text-xs font-bold p-4 text-start uppercase tracking-wider">
                {intl.formatMessage({ id: "Name" })}
              </th>
              <th className="text-xs font-bold p-4 text-start uppercase tracking-wider">
                {intl.formatMessage({ id: "Exam Task" })}
              </th>
              <th className="text-xs font-bold p-4 text-center uppercase tracking-wider">
                {intl.formatMessage({ id: "Band Score" })}
              </th>
              <th className="text-xs font-bold p-4 text-start uppercase tracking-wider">
                {intl.formatMessage({ id: "Status" })}
              </th>
              <th className="text-xs font-bold p-4 text-start uppercase tracking-wider">
                {intl.formatMessage({ id: "Completed At" })}
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboards?.results?.length > 0 ? (
              leaderboards.results.map((item) => (
                <LeaderboardItem key={item.id} item={item} role={role} />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-12 text-textSecondary">
                  {intl.formatMessage({ id: "Select a exam from filter" })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination count={leaderboards?.count} />
    </>
  );
}
