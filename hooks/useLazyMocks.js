import { useState, useCallback } from "react";
import { SECTION_TYPES } from "@/utils/examConstants";
import fetcher from "@/utils/fetcher";

/**
 * Custom hook for lazy-loading mocks
 * Fetches mock content on-demand when a section is accessed
 */
export const useLazyMocks = (locale, intl, onError) => {
    const [mocks, setMocks] = useState({
        [SECTION_TYPES.LISTENING]: null,
        [SECTION_TYPES.READING]: null,
        [SECTION_TYPES.WRITING]: null,
    });

    const [loading, setLoading] = useState({
        [SECTION_TYPES.LISTENING]: false,
        [SECTION_TYPES.READING]: false,
        [SECTION_TYPES.WRITING]: false,
    });

    const getMockTypeString = useCallback((section) => {
        const map = {
            [SECTION_TYPES.LISTENING]: "listening",
            [SECTION_TYPES.READING]: "reading",
            [SECTION_TYPES.WRITING]: "writing",
        };
        return map[section];
    }, []);

    const fetchMock = useCallback(
        async (section, mockId) => {
            if (!mockId || mocks[section]) return mocks[section];

            const mockType = getMockTypeString(section);
            setLoading((prev) => ({ ...prev, [section]: true }));

            try {
                const response = await fetcher(
                    `/mocks/${mockType}/${mockId}/`,
                    {
                        headers: { "Accept-Language": locale },
                    },
                    {},
                    true
                );
                setMocks((prev) => ({ ...prev, [section]: response }));
                return response;
            } catch (error) {
                console.error(`Error fetching ${mockType} mock:`, error);
                onError?.(
                    intl.formatMessage({
                        id: "Failed to load mock",
                        defaultMessage: "Failed to load mock content",
                    })
                );
                return null;
            } finally {
                setLoading((prev) => ({ ...prev, [section]: false }));
            }
        },
        [locale, intl, mocks, getMockTypeString, onError]
    );

    const getMock = useCallback(
        (section) => mocks[section],
        [mocks]
    );

    const isLoading = useCallback(
        (section) => loading[section],
        [loading]
    );

    return {
        mocks,
        loading: loading,
        fetchMock,
        getMock,
        isLoading,
        setMockForSection: (section, mockData) =>
            setMocks((prev) => ({ ...prev, [section]: mockData })),
    };
};
