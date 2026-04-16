import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api"
});

API.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('No auth token found for request:', config.url);
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized API response, clearing auth state:', error.config?.url);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export const userService = {
    getUsers: () => API.get('/users/'),
    getCurrentUser: () => API.get('/auth/me/'),
    searchUsers: (query) => API.get(`/users/search/?q=${query}`),
    followUser: (userId) => API.post('/users/follow/', { user_id: userId }),
    getFollowedUsers: () => API.get('/users/followed/'),
    updateProfile: (data) => API.patch('/auth/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getSettings: () => API.get('/users/settings/'),
    updateSettings: (data) => API.put('/users/settings/', data),
    logout: () => API.post('/users/logout/'),
};

export const messageService = {
    getChatHistory: (userId) => API.get(`/messages/${userId}/`),
    getCallLogs: () => API.get('/messages/call-logs/'),
    createCallLog: (payload) => API.post('/messages/call-logs/', payload),
    uploadMedia: (formData) => API.post('/messages/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const groupService = {
    fetchGroups: () => API.get('/messages/groups/'),
    createGroup: (data) => API.post('/messages/groups/', data),
};

export const statusService = {
    fetchStatuses: () => API.get('/users/statuses/'),
    createStatus: (formData) => API.post('/users/statuses/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default API;
