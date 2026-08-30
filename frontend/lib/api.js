import axios from 'axios';

// API base URL
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = rawApiUrl.replace(/\/+$/, '');

// Create axios instance
const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error.response?.data || error.message);
    }
);

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
};

// Profile API
export const profileAPI = {
    getProfile: () => api.get('/profile'),
    updateProfile: (data) => api.put('/profile', data),
    getAccessLogs: () => api.get('/profile/access-logs'),
    getHealthSummary: () => api.get('/profile/health-summary'),
};

// Records API
export const recordsAPI = {
    upload: (formData) => api.post('/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getAll: () => api.get('/records'),
    getById: (id) => api.get(`/records/${id}`),
    delete: (id) => api.delete(`/records/${id}`),
    getTimeline: () => api.get('/records/user/timeline'),
    ask: (question) => api.post('/records/ask', { question }),
};

// These two endpoint groups are hit without a login token (public/consent-based
// access), so they use a plain axios call instead of the `api` instance above.
// unwrapPublicError() normalizes failures to the same shape the `api` instance's
// interceptor produces, so callers can always read err.message / err.attemptsRemaining
// instead of a generic AxiosError.
const unwrapPublicError = (error) => {
    return Promise.reject(error.response?.data || { message: error.message });
};

// Emergency API
export const emergencyAPI = {
    getByPulseId: (pulseId) => axios.get(`${API_URL}/api/emergency/${pulseId}`).then(res => res.data).catch(unwrapPublicError),
    sendSOS: (data) => axios.post(`${API_URL}/api/emergency/sos`, data).then(res => res.data).catch(unwrapPublicError),
    downloadCard: (pulseId) => `${API_URL}/api/emergency/card/${pulseId}`,
};

// Hospital API
export const hospitalAPI = {
    scanQR: (pulseId, data) => axios.post(`${API_URL}/api/hospital/scan/${pulseId}`, data).then(res => res.data).catch(unwrapPublicError),
    requestAccess: (data) => axios.post(`${API_URL}/api/hospital/request-access`, data).then(res => res.data).catch(unwrapPublicError),
    verifyOTP: (data) => axios.post(`${API_URL}/api/hospital/verify-otp`, data).then(res => res.data).catch(unwrapPublicError),
    getPatient: (pulseId, consentId) => axios.get(`${API_URL}/api/hospital/patient/${pulseId}?consentId=${consentId}`).then(res => res.data).catch(unwrapPublicError),
    uploadRecord: (formData) => axios.post(`${API_URL}/api/hospital/upload-record`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data).catch(unwrapPublicError),
    ask: (pulseId, consentId, question) => axios.post(`${API_URL}/api/hospital/ask`, { pulseId, consentId, question }).then(res => res.data).catch(unwrapPublicError),
};

export default api;
