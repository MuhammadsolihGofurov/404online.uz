import { Wrapper } from "@/components/dashboard/details";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import useSWR from "swr";
import fetcher from "@/utils/fetcher";
import { useState, useMemo } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Select } from "@/components/custom/details";

function LeaderboardPage({ info, user, loading }) {
  const intl = useIntl();
  const router = useRouter();
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Fetch user's groups
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

  const groups = groupsData?.results || [];

  // For STUDENT: Use first group by default, or selected group
  // For TEACHER/ADMIN: Use selected group from dropdown
  const isStudent = user?.role === "STUDENT" || user?.role === "GUEST";
  const activeGroupId = useMemo(() => {
    if (selectedGroupId) return selectedGroupId;
    if (isStudent && groups.length > 0) return groups[0]?.id;
    if (!isStudent && groups.length > 0) return groups[0]?.id;
    return null;
  }, [selectedGroupId, groups, isStudent]);

  // Fetch leaderboard for selected group
  const { data: leaderboardData, isLoading: leaderboardLoading } = useSWR(
    activeGroupId ? ["/groups/", router.locale, activeGroupId, "leaderboard"] : null,
    ([url, locale, groupId]) =>
      fetcher(
        `${url}${groupId}/leaderboard/`,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  const leaderboard = leaderboardData || [];

  // Get rank icon
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (rank === 2) return <Medal className="text-gray-400" size={20} />;
    if (rank === 3) return <Award className="text-orange-500" size={20} />;
    return null;
  };

  // Get rank badge color
  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-700 border-gray-300";
    if (rank === 3) return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  if (loading || groupsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">{intl.formatMessage({ id: "Loading leaderboard..." })}</p>
        </div>
      </div>
    );
  }

  // Empty state: No groups
  if (groups.length === 0) {
    return (
      <>
        <Seo
          title={info?.seo_home_title}
          description={info?.data?.seo_home_description}
          keywords={info?.data?.seo_home_keywords}
        />
        <DashboardLayout user={user}>
          <Wrapper
            title={intl.formatMessage({ id: "Leaderboard" })}
            isLink
            body={"Dashboard"}
          >
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-600">
                {intl.formatMessage({
                  id: "No groups available. You need to be a member of a group to view leaderboards.",
                })}
              </p>
            </div>
          </Wrapper>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Seo
        title={info?.seo_home_title}
        description={info?.data?.seo_home_description}
        keywords={info?.data?.seo_home_keywords}
      />
      <DashboardLayout user={user}>
        <Wrapper
          title={intl.formatMessage({ id: "Leaderboard" })}
          isLink
          body={"Dashboard"}
        >
          <div className="space-y-6">
            {/* Group Selection */}
            {isStudent ? (
              // Student: Show tabs if multiple groups
              groups.length > 1 && (
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {intl.formatMessage({ id: "Select Group" })}:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          activeGroupId === group.id
                            ? "bg-main text-white border-main"
                            : "border-gray-200 text-gray-700 hover:border-main hover:text-main"
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              // Teacher/Admin: Show dropdown
              <div className="bg-white rounded-2xl p-5">
                <Select
                  title={intl.formatMessage({ id: "Select Group" })}
                  placeholder={intl.formatMessage({ id: "Choose a group" })}
                  options={groups.map((g) => ({
                    id: g.id,
                    value: g.id,
                    name: g.name,
                    full_name: g.name,
                  }))}
                  value={activeGroupId}
                  onChange={(groupId) => setSelectedGroupId(groupId)}
                />
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {leaderboardLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">
                    {intl.formatMessage({ id: "Loading leaderboard data..." })}
                  </p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">
                    {intl.formatMessage({
                      id: "No leaderboard data available yet. Students need to complete and submit approved exam mocks to appear on the leaderboard.",
                    })}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {intl.formatMessage({ id: "Rank" })}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {intl.formatMessage({ id: "Student" })}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {intl.formatMessage({ id: "Band Score" })}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {intl.formatMessage({ id: "Raw Score" })}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const isCurrentUser = entry.student_id === user?.id;
                        const displayScore = entry.highest_band_score ?? entry.highest_raw_score;

                        return (
                          <tr
                            key={entry.student_id}
                            className={`transition-colors ${
                              isCurrentUser
                                ? "bg-blue-50 hover:bg-blue-100"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold ${getRankBadgeColor(
                                    rank
                                  )}`}
                                >
                                  {rank}
                                </span>
                                {getRankIcon(rank)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    isCurrentUser ? "text-blue-700" : "text-gray-900"
                                  }`}
                                >
                                  {entry.student_name}
                                </span>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                    {intl.formatMessage({ id: "You" })}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                {entry.highest_band_score !== null &&
                                entry.highest_band_score !== undefined
                                  ? entry.highest_band_score.toFixed(1)
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
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

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{intl.formatMessage({ id: "Note" })}:</strong>{" "}
                {intl.formatMessage({
                  id: "Leaderboard shows the highest band score achieved by each student from approved exam mock submissions. Only published submissions are included.",
                })}
              </p>
            </div>
          </div>
        </Wrapper>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps() {
  const info = {
    seo_home_title: "Leaderboard",
    seo_home_keywords: "",
    seo_home_description: "",
  };
  return { props: { info } };
}

export default withAuthGuard(LeaderboardPage, [
  "STUDENT",
  "GUEST",
  "TEACHER",
  "ASSISTANT",
  "CENTER_ADMIN",
]);

