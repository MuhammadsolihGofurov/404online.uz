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

  // Debug logging to identify the issue
  console.log("🔍 [ListMembersTable] currentGroupId:", currentGroupId);
  console.log("🔍 [ListMembersTable] router.query:", router.query);

  // Validate that we have a valid group_id before making the API call
  const shouldFetch = currentGroupId && currentGroupId.trim() !== "";

  console.log("🔍 [ListMembersTable] shouldFetch:", shouldFetch);
  if (shouldFetch) {
    console.log("🔍 [ListMembersTable] API URL:", `/groups/${currentGroupId}/members/`);
  }

  const { data: members, isLoading, error } = useSWR(
    shouldFetch
      ? [
        `/groups/${currentGroupId}/members/`,
        router.locale,
        modalClosed,
        currentGroupId,
      ]
      : null, // Don't fetch if group_id is missing
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

  // Show error if group_id is missing from URL
  if (!shouldFetch) {
    return (
      <div className="bg-white rounded-2xl overflow-x-auto sm:w-full p-6">
        <div className="text-center text-red-500">
          <p className="font-semibold">Missing Group ID</p>
          <p className="text-sm text-gray-600 mt-2">
            Please select a group from the groups page to view its members.
          </p>
        </div>
      </div>
    );
  }

  // Show error if API call failed
  if (error) {
    return (
      <div className="bg-white rounded-2xl overflow-x-auto sm:w-full p-6">
        <div className="text-center text-red-500">
          <p className="font-semibold">Error Loading Members</p>
          <p className="text-sm text-gray-600 mt-2">
            {error.message || "Failed to load group members. Please try again."}
          </p>
        </div>
      </div>
    );
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
              <ListMembersItem key={member.id} member={member} role={role} group_id={currentGroupId} />
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
