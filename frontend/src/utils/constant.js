// Read API base from Vite environment variable (set VITE_API_BASE_URL in Render or locally)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const USER_API_END_POINT = `${API_BASE}/api/v1/user`;
export const JOB_API_END_POINT = `${API_BASE}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${API_BASE}/api/v1/application`;
export const COMPANY_API_END_POINT = `${API_BASE}/api/v1/company`;