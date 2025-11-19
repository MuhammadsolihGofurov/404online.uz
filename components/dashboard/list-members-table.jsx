import React, { useState } from "react";
import { ListMembersItem } from "./details/items";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { useParams } from "@/hooks/useParams";
import { useModal } from "@/context/modal-context";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { CentersTableSkeleton } from "../skeleton";

export default function ListMembersTable({ loading, role }) {
  const router = useRouter();
  const intl = useIntl();
  const { findParams } = useParams();
  const { modalClosed } = useModal();

  const currentGroupId = findParams("group_id") || "";

  const { data: members, isLoading } = useSWR(
    [
      `/groups/${currentGroupId}/members/`,
      router.locale,
      modalClosed,
      currentGroupId,
    ],
    ([url, locale, page]) =>
      fetcher(
        `${url}?page_size=all`,
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
    return <CentersTableSkeleton />;
  }

  return (
    <div className="bg-white rounded-2xl overflow-x-auto sm:w-full">
      <table className="w-full text-left text-textPrimary rounded-2xl">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="p-4 text-sm font-semibold text-center">#</th>
            <th className="p-4 text-sm font-semibold">Name</th>
            <th className="p-4 text-sm font-semibold">Role</th>
            <th className="p-4 text-sm font-semibold">Date</th>
            <th className="p-4 text-sm font-semibold text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {members?.length ? (
            members.map((member) => (
              <ListMembersItem key={member.id} member={member} role={role} group_id={currentGroupId}/>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-6 text-gray-500">
                {intl.formatMessage({ id: "No members found" })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
