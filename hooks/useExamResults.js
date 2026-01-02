import useSWR from "swr";
import fetcher from "@/utils/fetcher";

export const useExamResults = (filters = {}) => {
    const { exam_task_id, is_graded, is_published, page = 1, page_size = 10 } = filters;

    // Build query string
    const params = new URLSearchParams();
    if (exam_task_id) params.append("exam_task_id", exam_task_id);
    if (is_graded !== undefined) params.append("is_graded", is_graded);
    if (is_published !== undefined) params.append("is_published", is_published);
    params.append("page", page);
    params.append("page_size", page_size);

    const queryString = params.toString();
    const url = `/tasks/exams/${queryString ? `?${queryString}` : ""}`;

    const { data, error, mutate } = useSWR(url, (url) => fetcher(url, {}, {}, true), {
        revalidateOnFocus: false,
        dedupingInterval: 5000,
    });

    return {
        data: data?.results || [],
        count: data?.count || 0,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
};

export const useExamResultDetail = (id) => {
    const url = id ? `/tasks/exams/${id}/` : null;

    const { data, error, mutate } = useSWR(url, (url) => fetcher(url, {}, {}, true), {
        revalidateOnFocus: false,
    });

    return {
        data: data || null,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
};

export const useExamLeaderboard = (examTaskId) => {
    const url = examTaskId
        ? `/exam-results/leaderboard?exam_task_id=${examTaskId}`
        : null;

    const { data, error, mutate } = useSWR(url, (url) => fetcher(url, {}, {}, true), {
        revalidateOnFocus: false,
    });

    return {
        data: data?.results || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
};
