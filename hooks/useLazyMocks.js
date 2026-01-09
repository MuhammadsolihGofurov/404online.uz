import { useState, useCallback, useRef } from "react";
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
    
    // Refs for immediate checks to avoid dependency churn in useCallback
    const mocksRef = useRef({});
    const loadingRef = useRef({});

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
            
            // Check refs for immediate status to avoid double-firing in same tick
            if (mocksRef.current[mockId]) {
                console.log(`[useLazyMocks] Already have mock ${mockId}, skipping fetch.`);
                return mocksRef.current[mockId];
            }
            if (loadingRef.current[mockId]) {
                console.log(`[useLazyMocks] Already loading mock ${mockId}, skipping fetch.`);
                return null;
            }

            const mockType = getMockTypeString(section);
            console.log(`[useLazyMocks] Fetching ${mockType} mock (${mockId})...`);
            
            loadingRef.current[mockId] = true;
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
                
                console.log(`[useLazyMocks] Successfully fetched mock ${mockId}`);
                mocksRef.current[mockId] = response;
                setMocks((prev) => ({ ...prev, [mockId]: response }));
                return response;
            } catch (error) {
                console.error(`[useLazyMocks] Error fetching ${mockType} mock (${mockId}):`, error);
                setFailed((prev) => ({ ...prev, [mockId]: true }));
                onError?.(
                    intl.formatMessage({
                        id: "Failed to load mock",
                        defaultMessage: "Failed to load mock content",
                    })
                );
                return null;
            } finally {
                loadingRef.current[mockId] = false;
                setLoading((prev) => ({ ...prev, [mockId]: false }));
            }
        },
        [locale, intl, getMockTypeString, onError] // Stable identity
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
                mocksRef.current[id] = mockData;
                setMocks((prev) => ({ ...prev, [id]: mockData }));
            }
        },
    };
};
