import { useState, useCallback } from "react";
import { SECTION_TYPES } from "@/utils/examConstants";
import fetcher from "@/utils/fetcher";

/**
 * Custom hook for lazy-loading mocks
 * Fetches mock content on-demand when a section is accessed
 */
export const useLazyMocks = (locale, intl, onError) => {
    // Cache keyed by mockId
    const [mocks, setMocks] = useState({});
    const [loading, setLoading] = useState({});
    const [failed, setFailed] = useState({});

    const getMockTypeString = useCallback((section) => {
        const map = {
            [SECTION_TYPES.LISTENING]: "listening",
            [SECTION_TYPES.READING]: "reading",
            [SECTION_TYPES.WRITING]: "writing",
            [SECTION_TYPES.QUIZ]: "quizzes",
        };
        return map[section];
    }, []);

    const fetchMock = useCallback(
        async (section, mockId) => {
            if (!mockId) return null;
            
            // If already loading or already have it, return existing
            if (mocks[mockId]) return mocks[mockId];
            if (loading[mockId]) return null;

            const mockType = getMockTypeString(section);
            
            setLoading(prev => ({ ...prev, [mockId]: true }));
            setFailed(prev => ({ ...prev, [mockId]: false }));

            const url = section === SECTION_TYPES.QUIZ 
                ? `/quizzes/${mockId}/`
                : `/mocks/${mockType}/${mockId}/`;

            try {
                const response = await fetcher(
                    url,
                    {
                        headers: { "Accept-Language": locale },
                    },
                    {},
                    true
                );
                
                setMocks((prev) => ({ ...prev, [mockId]: response }));
                return response;
            } catch (error) {
                console.error(`Error fetching ${mockType} mock (${mockId}):`, error);
                setFailed((prev) => ({ ...prev, [mockId]: true }));
                onError?.(
                    intl.formatMessage({
                        id: "Failed to load mock",
                        defaultMessage: "Failed to load mock content",
                    })
                );
                return null;
            } finally {
                setLoading((prev) => ({ ...prev, [mockId]: false }));
            }
        },
        [locale, intl, mocks, loading, getMockTypeString, onError]
    );

    const getMockById = useCallback(
        (id) => mocks[id] || null,
        [mocks]
    );

    const isIdLoading = useCallback(
        (id) => !!loading[id],
        [loading]
    );

    const isIdFailed = useCallback(
        (id) => !!failed[id],
        [failed]
    );

    return {
        mocks,
        loading,
        failed,
        fetchMock,
        // Legacy support/helper for current section
        getMock: (section, id) => id ? mocks[id] : null,
        isLoading: (section, id) => id ? !!loading[id] : false,
        isFailed: (section, id) => id ? !!failed[id] : false,
        getMockById,
        isIdLoading,
        isIdFailed,
        setMockForSection: (section, mockData, id) => {
            if (id) {
                setMocks((prev) => ({ ...prev, [id]: mockData }));
            }
        },
    };
};
