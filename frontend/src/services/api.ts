import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
    baseURL: `${API_URL}/api/`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@OsteoLearn:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getAdminLogs = async () => {
    const response = await api.get('auth/admin/logs/');
    return response.data;
};

export const calibrateLandmark3D = async (payload: {
    bone_name: string;
    order: number;
    landmark_name: string;
    pos_x: number;
    pos_y: number;
    pos_z: number;
}) => {
    const response = await api.post('auth/atlas/landmarks/calibrate/', payload);
    return response.data;
};
