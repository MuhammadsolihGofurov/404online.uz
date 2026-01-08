import { SECTION_TYPES } from "@/utils/examConstants";

/**
 * Map section type to property names and data structure keys
 */
export const SECTION_CONFIG = {
    [SECTION_TYPES.LISTENING]: {
        mockKey: "listening_mock",
        titleKey: "listening_mock_title",
        dataKey: "parts",
        groupKey: "question_groups",
        defaultTitle: "Listening",
    },
    [SECTION_TYPES.READING]: {
        mockKey: "reading_mock",
        titleKey: "reading_mock_title",
        dataKey: "passages",
        groupKey: "question_groups",
        defaultTitle: "Reading",
    },
    [SECTION_TYPES.WRITING]: {
        mockKey: "writing_mock",
        titleKey: "writing_mock_title",
        dataKey: "tasks",
        groupKey: null,
        defaultTitle: "Writing",
    },
};

/**
 * Get config for a specific section type
 */
export const getSectionConfig = (sectionType) => SECTION_CONFIG[sectionType];

/**
 * Get mock ID from exam object for given section
 */
export const getMockIdForSection = (exam, section) => {
    const config = getSectionConfig(section);
    return exam?.[config.mockKey];
};

/**
 * Get mock type string (lowercase) from section type
 */
export const getMockTypeString = (section) => {
    const typeMap = {
        [SECTION_TYPES.LISTENING]: "listening",
        [SECTION_TYPES.READING]: "reading",
        [SECTION_TYPES.WRITING]: "writing",
    };
    return typeMap[section];
};

/**
 * Get display title for section
 */
export const getSectionTitle = (exam, section) => {
    const config = getSectionConfig(section);
    return exam?.[config.titleKey] || config.defaultTitle;
};
