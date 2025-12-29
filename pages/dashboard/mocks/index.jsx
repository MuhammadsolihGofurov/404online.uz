import React from "react";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { Plus } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useIntl } from "react-intl";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import MockListItem from "@/components/dashboard/mocks/details/mock-list-item";
import { ButtonSpinner } from "@/components/custom/loading";
import Pagination from "@/components/custom/pagination";

function MocksPage({ user, loading: userLoading }) {
    const intl = useIntl();
    const router = useRouter();
    const page = router.query.page || 1;
    const mockType = router.query.mock_type || "";

    // Fetch Mocks (Unified Endpoint)
    const queryString = `?page=${page}${mockType ? `&mock_type=${mockType}` : ""}`;
    const { data, isLoading } = useSWR(
        [`/mocks/`, router.locale, queryString],
        ([url, locale, query]) =>
            fetcher(`${url}${query}`, { headers: { "Accept-Language": locale } })
    );

    return (
        <>
            <Seo title="Mocks Manager" />
            <DashboardLayout user={user} loading={userLoading}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mocks Library</h1>
                            <p className="text-gray-500">Manage your listening, reading, and writing assessments.</p>
                        </div>
                        <Link
                            href="/dashboard/mocks/create/index"
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            <span className="font-medium">Create Mock</span>
                        </Link>
                    </div>

                    {/* Filters (Tabs) */}
                    <div className="border-b border-gray-200">
                        <div className="flex gap-6">
                            {["", "LISTENING", "READING", "WRITING"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => router.push({ pathname: router.pathname, query: { ...router.query, mock_type: type, page: 1 } })}
                                    className={`pb-4 text-sm font-medium transition-colors relative ${mockType === type
                                            ? "text-indigo-600"
                                            : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {type || "All Mocks"}
                                    {mockType === type && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex justify-center py-20"><ButtonSpinner /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {data?.results?.map((item) => (
                                <MockListItem key={item.id} item={item} />
                            ))}

                            {data?.results?.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                                    No mocks found. Create one to get started.
                                </div>
                            )}
                        </div>
                    )}

                    {data?.count > 0 && <Pagination count={data.count} pageSize={12} />}
                </div>
            </DashboardLayout>
        </>
    );
}

export default withAuthGuard(MocksPage, ["CENTER_ADMIN", "TEACHER", "ASSISTANT"]);
