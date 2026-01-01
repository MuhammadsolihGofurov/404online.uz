import useSWR from "swr";
import fetcher from "@/utils/fetcher";

export const useHomeworkResults = (filters = {}) => {
    const { page = 1, page_size = 10 } = filters;

    // Build query string
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", page_size);

    const queryString = params.toString();
    const url = `/tasks/homeworks/${queryString ? `?${queryString}` : ""}`;

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

export const useHomeworkResultDetail = (id) => {
    const url = id ? `/api/v1/tasks/homeworks/${id}/my-results/` : null;

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

export const useHomeworkSubmissions = (homeworkId) => {
    const url = homeworkId
        ? `/api/v1/submissions/?homework_id=${homeworkId}`
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
