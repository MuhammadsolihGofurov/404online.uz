// Utility for mapping mock types to endpoints
// Matches Backend ViewSets in api/v1/routers.py

export const MOCK_TYPES = {
    LISTENING: 'LISTENING',
    READING: 'READING',
    WRITING: 'WRITING'
};

export const MOCK_ENDPOINTS = {
    // Top Level Collections (POST creates mock + auto-generated parts)
    [MOCK_TYPES.LISTENING]: {
        ROOT: '/mocks/listening/',
        DETAIL: (id) => `/mocks/listening/${id}/`
    },
    [MOCK_TYPES.READING]: {
        ROOT: '/mocks/reading/',
        DETAIL: (id) => `/mocks/reading/${id}/`
    },
    [MOCK_TYPES.WRITING]: {
        ROOT: '/mocks/writing/',
        DETAIL: (id) => `/mocks/writing/${id}/`
    }
};

// Editor Endpoints (Granular PATCH/POST access)
export const getEditorEndpoints = (type) => {
    const prefix = type?.toLowerCase();
    return {
        // Parts / Passages / Tasks
        part: (id) => id ? `/editor/${prefix}-${type === 'READING' ? 'passages' : type === 'WRITING' ? 'tasks' : 'parts'}/${id}/` : null,

        // Question Groups
        group: (id) => id ? `/editor/${prefix}-groups/${id}/` : `/editor/${prefix}-groups/`,

        // Questions
        question: (id) => id ? `/editor/${prefix}-questions/${id}/` : `/editor/${prefix}-questions/`,
    };
};
