import { PRIVATEAUTHKEY, PRIVATEREFRESHKEY } from "@/mock/keys";
import { LOGIN_URL } from "@/mock/router";
import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 🔹 Default axios instance
const defaultAxios = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

// 🔹 Auth axios (token bilan ishlovchi)
export const authAxios = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
  timeout: 100000, // 20 soniya timeout
});

// ✅ Token qo‘shish (request interceptor)
authAxios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem(PRIVATEAUTHKEY);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔁 Refresh jarayonini boshqaruvchi flaglar
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ✅ Response interceptor — 401 uchun refresh tizimi
authAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔸 Network yoki timeout xatosi
    if (!error.response || error.code === "ECONNABORTED") {
      // window.alert("Network error or request timeout, Please refresh page");
      return Promise.reject(error);
    }

    // 🔸 Access token muddati tugagan holat
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // agar refresh jarayoni allaqachon boshlangan bo‘lsa
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return authAxios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(PRIVATEREFRESHKEY);
        if (!refreshToken) throw new Error("No refresh token found");

        // 🔹 Refresh token orqali yangi access token olish
        const res = await axios.post(`${baseURL}/api/v1/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;
        localStorage.setItem(PRIVATEAUTHKEY, newAccess);

        // 🔹 Yangi tokenni headerga yozish
        authAxios.defaults.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);

        // 🔁 Eski so‘rovni qayta yuborish
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return authAxios(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem(PRIVATEAUTHKEY);
        localStorage.removeItem(PRIVATEREFRESHKEY);
        window.location.href = LOGIN_URL;
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // 🔸 Boshqa xatoliklar
    return Promise.reject(error);
  }
);

export default defaultAxios;
