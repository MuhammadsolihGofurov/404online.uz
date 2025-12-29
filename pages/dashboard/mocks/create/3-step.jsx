import React, { useState, useEffect } from "react";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { authAxios } from "@/utils/axios";
import { MOCK_ENDPOINTS } from "@/utils/mock-api";
import { Loader2 } from "lucide-react";

// Editors
import ListeningEditor from "@/components/dashboard/mocks/editor/listening-editor";
import ReadingEditor from "@/components/dashboard/mocks/editor/reading-editor";
import WritingEditor from "@/components/dashboard/mocks/editor/writing-editor";

function Step3Editor({ user, loading }) {
    const router = useRouter();
    const { mock_id, mock_type } = router.query;

    const [mockData, setMockData] = useState(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!router.isReady) return;

        if (!mock_id || !mock_type) {
            router.push("/dashboard/mocks/create");
            return;
        }

        fetchMockData();
    }, [router.isReady, mock_id, mock_type]);

    const fetchMockData = async () => {
        try {
            setFetching(true);
            const endpoint = MOCK_ENDPOINTS[mock_type]?.DETAIL(mock_id);
            if (!endpoint) throw new Error("Invalid Mock Type");

            const res = await authAxios.get(endpoint);
            setMockData(res.data);
        } catch (error) {
            console.error("Failed to fetch mock:", error);
            // toast.error("Failed to load mock data");
        } finally {
            setFetching(false);
        }
    };

    if (fetching) {
        return (
            <DashboardLayout user={user} loading={loading}>
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            </DashboardLayout>
        );
    }

    if (!mockData) return null; // Or error state

    return (
        <>
            <Seo title={`Edit ${mockData.mock_type || mock_type} Content`} />
            <DashboardLayout user={user} loading={loading}>
                {mock_type === 'LISTENING' && <ListeningEditor mock={mockData} refresh={fetchMockData} />}
                {mock_type === 'READING' && <ReadingEditor mock={mockData} refresh={fetchMockData} />}
                {mock_type === 'WRITING' && <WritingEditor mock={mockData} refresh={fetchMockData} />}
            </DashboardLayout>
        </>
    );
}

export default withAuthGuard(Step3Editor, ["CENTER_ADMIN", "TEACHER", "ASSISTANT"]);
