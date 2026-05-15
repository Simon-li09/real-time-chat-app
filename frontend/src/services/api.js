import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
    timeout: 10000,
});

export const MEDIA_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/")
    .split('/api/')[0]
    .replace('http://real-time-back.onrender.com', 'https://real-time-back.onrender.com');

API.interceptors.request.use(
    (config) => {
        config.headers = config.headers || {};

        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API ERROR:", {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
        });

        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            console.warn("Session expired or unauthorized");
        }

        return Promise.reject(error);
    }
);

/* =========================
   AUTH SERVICES
========================= */

export const authService = {
    register: (data) =>
        API.post("auth/register/", data),

    login: (data) =>
        API.post("auth/login/", data),

    getCurrentUser: () =>
        API.get("auth/me/"),

    updateProfile: (data) =>
        API.patch("auth/profile/", data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),
};

/* =========================
   ADMIN SERVICES
========================= */

export const adminService = {
    getStats: () =>
        API.get("auth/admin/stats/"),
};

/* =========================
   USER SERVICES
========================= */

export const userService = {
    getUsers: () =>
        API.get("users/"),

    searchUsers: (query) =>
        API.get(`users/search/?q=${query}`),

    followUser: (userId) =>
        API.post("users/follow/", {
            user_id: userId,
        }),

    getFollowedUsers: () =>
        API.get("users/followed/"),

    getSettings: () =>
        API.get("users/settings/"),

    updateSettings: (data) =>
        API.put("users/settings/", data),

    logout: () =>
        API.post("users/logout/"),
};

/* =========================
   MESSAGE SERVICES
========================= */

export const messageService = {
    getChatHistory: (userId) =>
        API.get(`messages/${userId}/`),

    getCallLogs: () =>
        API.get("messages/call-logs/"),

    createCallLog: (payload) =>
        API.post("messages/call-logs/", payload),

    uploadMedia: (formData) =>
        API.post("messages/upload/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),
};

/* =========================
   GROUP SERVICES
========================= */

export const groupService = {
    fetchGroups: () =>
        API.get("messages/groups/"),

    createGroup: (data) =>
        API.post("messages/groups/", data),
};

/* =========================
   STATUS SERVICES
========================= */

export const statusService = {
    fetchStatuses: () =>
        API.get("users/statuses/"),

    createStatus: (formData) =>
        API.post("users/statuses/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),
};

export default API;