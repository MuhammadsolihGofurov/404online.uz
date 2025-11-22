import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { Users, Trophy } from "lucide-react";
import { Trophy as TrophyIcon, Medal, Award } from "lucide-react";

export function MyGroupInterface({ user, loading }) {
  const router = useRouter();
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState("classmates"); // "classmates" or "leaderboard"

  // Fetch student's group(s) - students typically have one group
  const { data: groupsData, isLoading: groupsLoading } = useSWR(
    ["/groups/", router.locale],
    ([url, locale]) =>
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

  // Parse groups - handle both flat array and paginated response
  const groups = useMemo(() => {
    if (!groupsData) return [];
    return Array.isArray(groupsData) ? groupsData : groupsData?.results || [];
  }, [groupsData]);

  // Get the first (and typically only) group for the student
  const studentGroup = groups.length > 0 ? groups[0] : null;
  const groupId = studentGroup?.id;

  // Fetch group members
  const { data: membersData, isLoading: membersLoading } = useSWR(
    groupId ? ["/groups/", router.locale, groupId, "members"] : null,
    ([url, locale, gId]) =>
      fetcher(
        `${url}${gId}/members/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Parse members - handle both flat array and paginated response
  const members = useMemo(() => {
    if (!membersData) return [];
    return Array.isArray(membersData)
      ? membersData
      : membersData?.results || [];
  }, [membersData]);

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useSWR(
    groupId ? ["/groups/", router.locale, groupId, "leaderboard"] : null,
    ([url, locale, gId]) =>
      fetcher(
        `${url}${gId}/leaderboard/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  // Parse leaderboard - handle both flat array and paginated response
  const leaderboard = useMemo(() => {
    if (!leaderboardData) return [];
    return Array.isArray(leaderboardData)
      ? leaderboardData
      : leaderboardData?.results || [];
  }, [leaderboardData]);

  // Get rank icon
  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  if (loading || groupsLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!studentGroup) {
    return (
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-[70vh]">
        <div className="text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {intl.formatMessage({
              id: "You are not assigned to any group yet.",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Group Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {studentGroup.name}
        </h2>
        {studentGroup.description && (
          <p className="text-sm text-gray-600 mt-1">
            {studentGroup.description}
          </p>
        )}
        {studentGroup.teacher && (
          <p className="text-xs text-gray-500 mt-2">
            {intl.formatMessage({ id: "Teacher" })}:{" "}
            {studentGroup.teacher.full_name || studentGroup.teacher.email}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("classmates")}
            className={`px-4 py-3 border-b-2 transition-colors duration-150 ${
              activeTab === "classmates"
                ? "border-main text-main font-medium"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{intl.formatMessage({ id: "Classmates" })}</span>
              {members.length > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {members.length}
                </span>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-3 border-b-2 transition-colors duration-150 ${
              activeTab === "leaderboard"
                ? "border-main text-main font-medium"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>{intl.formatMessage({ id: "Leaderboard" })}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "classmates" ? (
          <div>
            {membersLoading ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">Loading classmates...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {intl.formatMessage({
                    id: "No members found in this group.",
                  })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => {
                  const isCurrentUser = member.id === user?.id;
                  const roleLabel =
                    member.role === "TEACHER"
                      ? intl.formatMessage({ id: "Teacher" })
                      : member.role === "ASSISTANT"
                      ? intl.formatMessage({ id: "Assistant" })
                      : member.role === "STUDENT"
                      ? intl.formatMessage({ id: "Student" })
                      : member.role;

                  return (
                    <div
                      key={member.id}
                      className={`
                        p-4 rounded-xl border transition-colors duration-200
                        ${
                          isCurrentUser
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-main text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.full_name || member.email}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>
                              {(member.full_name || member.email || "?")[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm truncate ${
                              isCurrentUser ? "text-blue-900" : "text-gray-900"
                            }`}
                          >
                            {member.full_name || member.email}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-blue-600">
                                ({intl.formatMessage({ id: "You" })})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {roleLabel}
                          </p>
                          {member.email && member.email !== member.full_name && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {leaderboardLoading ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {intl.formatMessage({
                    id: "No leaderboard data available yet.",
                  })}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Rank" })}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Student Name" })}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Highest Band Score" })}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        {intl.formatMessage({ id: "Raw Score" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => {
                      const rank = index + 1;
                      const isCurrentUser = entry.student_id === user?.id;
                      const rankIcon = getRankIcon(rank);

                      return (
                        <tr
                          key={entry.student_id}
                          className={`
                            border-b border-gray-100 transition-colors duration-150
                            ${
                              isCurrentUser
                                ? "bg-blue-50 hover:bg-blue-100"
                                : "hover:bg-gray-50"
                            }
                          `}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {rankIcon || (
                                <span className="text-sm font-medium text-gray-600 w-6">
                                  {rank}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm ${
                                  isCurrentUser
                                    ? "font-semibold text-blue-900"
                                    : "text-gray-900"
                                }`}
                              >
                                {entry.student_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-blue-600">
                                    ({intl.formatMessage({ id: "You" })})
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {entry.highest_band_score !== null &&
                              entry.highest_band_score !== undefined
                                ? entry.highest_band_score
                                : "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm text-gray-600">
                              {entry.highest_raw_score !== null &&
                              entry.highest_raw_score !== undefined
                                ? entry.highest_raw_score
                                : "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

