/**
 * Parse duration from various formats to minutes
 * @param {number|string|null} value - Duration in HH:MM:SS, PT40M, PT1H20M, or number (minutes)
 * @returns {number|null} Duration in minutes or null if invalid
 */
export const parseDurationToMinutes = (value) => {
    if (!value && value !== 0) return null;
    if (typeof value === "number") return value;

    if (typeof value === "string") {
        // Format: HH:MM:SS
        const parts = value.split(":");
        if (parts.length === 3 && parts.every((p) => p !== "")) {
            const [h, m, s] = parts.map((p) => Number(p) || 0);
            return h * 60 + m + Math.floor(s / 60);
        }

        // Format: PT40M / PT1H20M
        const iso = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
        if (iso) {
            const hours = Number(iso[1]) || 0;
            const minutes = Number(iso[2]) || 0;
            const seconds = Number(iso[3]) || 0;
            return hours * 60 + minutes + Math.floor(seconds / 60);
        }
    }

    return null;
};
