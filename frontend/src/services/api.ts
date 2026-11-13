import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const BASE_HOST = RAW_API_URL.replace(/\/api\/auth\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');

export const api = axios.create({
    baseURL: `${BASE_HOST}/api/`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@OsteoLearn:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getAtlasBones = async () => {
    const response = await api.get('auth/atlas/bones/');
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await api.get('auth/dashboard/stats/');
    return response.data;
};

export const recordBoneStudy = async (payload: {
    bone_id?: number;
    bone_name?: string;
    activity_name?: string;
    progress?: number;
}) => {
    const response = await api.post('auth/dashboard/study-bone/', payload);
    return response.data;
};

export const getQuizQuestions = async (boneName: string, boneId?: number) => {
    const params: Record<string, string | number> = { bone_name: boneName };
    if (boneId) {
        params.bone_id = boneId;
    }
    const response = await api.get('auth/quiz/questions/', { params });
    return response.data;
};

export const checkQuizAnswer = async (payload: {
    question_id: number;
    selected_option?: string | null;
    clicked_pos?: [number, number, number] | null;
}) => {
    const response = await api.post('auth/quiz/check-answer/', payload);
    return response.data;
};

export const finishQuizAttempt = async (payload: {
    bone_id?: number;
    bone_name: string;
    correct_count: number;
    total_questions: number;
}) => {
    const response = await api.post('auth/quiz/finish/', payload);
    return response.data;
};

export const getAdminLogs = async () => {
    const response = await api.get('auth/admin/logs/');
    return response.data;
};

export const getAdminBones = async () => {
    const response = await api.get('auth/admin/bones/');
    return response.data;
};

export const createAdminBone = async (formData: FormData) => {
    const response = await api.post('auth/admin/bones/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateAdminBone = async (id: number, data: FormData | Record<string, any>) => {
    const isMultipart = data instanceof FormData;
    const response = await api.patch(
        `auth/admin/bones/${id}/`,
        data,
        isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return response.data;
};

export const deleteAdminBone = async (id: number) => {
    const response = await api.delete(`auth/admin/bones/${id}/`);
    return response.data;
};

export const getAdminQuestions = async (boneId?: number) => {
    const params = boneId ? { bone_id: boneId } : undefined;
    const response = await api.get('auth/admin/questions/', { params });
    return response.data;
};

export const createAdminQuestion = async (payload: {
    bone_id: number;
    statement: string;
    question_type: 'MULTIPLE_CHOICE' | 'SPATIAL_CLICK';
    correct_answer: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    pos_x: number;
    pos_y: number;
    pos_z: number;
    is_active?: boolean;
}) => {
    const response = await api.post('auth/admin/questions/', payload);
    return response.data;
};

export const updateAdminQuestion = async (id: number, payload: Record<string, any>) => {
    const response = await api.patch(`auth/admin/questions/${id}/`, payload);
    return response.data;
};

export const deleteAdminQuestion = async (id: number) => {
    const response = await api.delete(`auth/admin/questions/${id}/`);
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
