/**
 * Central REST client for Maverick Certification Hub FastAPI backend.
 * Base path matches `app/api/api_v1.py` router prefix `/api/v1`.
 * In dev, Vite proxies `/api` to the FastAPI backend configured in `vite.config.js`.
 */
import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
export const API_BASE = rawBase.replace(/\/$/, "");

const ACCESS = "mch_access_token";
const REFRESH = "mch_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  setPair: (access, refresh) => {
    localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
  },
  setAccess: (t) => localStorage.setItem(ACCESS, t),
  clear: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const t = tokenStorage.getAccess();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

/** OAuth2 password flow (form body) used by backend `/auth/login`. */
export async function loginWithPassword(email, password) {
  const body = new URLSearchParams();
  body.set("username", email.trim().toLowerCase());
  body.set("password", password);
  const { data } = await axios.post(`${API_BASE}/auth/login`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15000,
  });
  return data;
}

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  refresh: (refresh_token) => api.post("/auth/refresh", { refresh_token }),
};

export const usersApi = {
  me: () => api.get("/users/me"),
  patchMe: (payload) => api.patch("/users/me", payload),
  deleteMe: () => api.delete("/users/me"),
  uploadAvatar: (formData) =>
    api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const profileApi = {
  get: () => api.get("/profile/me"),
  badges: () => api.get("/profile/badges"),
  patch: (payload) => api.patch("/profile/me", payload),
  changePassword: (payload) => api.post("/profile/change-password", payload),
  patchPreferences: (payload) => api.patch("/profile/preferences", payload),
};

export const certificationsApi = {
  list: (params) => api.get("/certifications/", { params }),
  exportCsv: () => api.get("/certifications/export/csv", { responseType: "blob" }),
  get: (certId) => api.get(`/certifications/${certId}`),
  eligibility: (certId) => api.get(`/certifications/${certId}/eligibility`),
  eligibilityTest: (certId) => api.get(`/certifications/${certId}/eligibility-test`),
  submitEligibilityTest: (certId, payload) => api.post(`/certifications/${certId}/eligibility-test/submit`, payload),
  create: (payload) => api.post("/certifications/", payload),
  patch: (certId, payload) => api.patch(`/certifications/${certId}`, payload),
  remove: (certId) => api.delete(`/certifications/${certId}`),
  drives: (certId) => api.get(`/certifications/${certId}/drives`),
  createDrive: (payload) => api.post("/certifications/drives", payload),
};

export const enrollmentsApi = {
  my: () => api.get("/enrollments/me"),
  get: (enrollmentId) => api.get(`/enrollments/me/${enrollmentId}`),
  create: (payload) => api.post("/enrollments/me", payload),
  patch: (enrollmentId, payload) => api.patch(`/enrollments/me/${enrollmentId}`, payload),
  adminList: (params) => api.get("/enrollments/", { params }),
};

export const tasksApi = {
  my: (params) => api.get("/tasks/me", { params }),
  create: (payload) => api.post("/tasks/me", payload),
  patch: (taskId, payload) => api.patch(`/tasks/me/${taskId}`, payload),
  remove: (taskId) => api.delete(`/tasks/me/${taskId}`),
  adminList: (params) => api.get("/tasks/", { params }),
};

export const uploadsApi = {
  my: () => api.get("/uploads/me"),
  certificates: () => api.get("/uploads/certificates"),
  adminList: () => api.get("/uploads/"),
  adminReview: (uploadId, payload) => api.post(`/uploads/${uploadId}/review`, payload),
  /** multipart: file + purpose + optional enrollment_id */
  uploadMe: (formData) =>
    api.post("/uploads/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  downloadUrl: (uploadId) => `${API_BASE}/uploads/${uploadId}/download`,
};

export const dashboardApi = {
  home: () => api.get("/dashboard/home"),
  me: () => api.get("/dashboard/me"),
  charts: () => api.get("/dashboard/charts"),
  heatmap: () => api.get("/dashboard/heatmap"),
};

export const notificationsApi = {
  my: () => api.get("/notifications/me"),
  markRead: (notificationId) => api.post(`/notifications/me/${notificationId}/read`),
  markAllRead: () => api.post("/notifications/me/read-all"),
  remove: (notificationId) => api.delete(`/notifications/me/${notificationId}`),
  broadcast: (payload) => api.post("/notifications/broadcast", payload),
};

export const notificationsExtendedApi = {
  feed: (params) => api.get("/notifications/", { params }),
  recentCerts: () => api.get("/notifications/certifications/recent"),
  markRead: (notificationId) => api.post(`/notifications/mark-read/${notificationId}`),
};

export const vouchersApi = {
  my: () => api.get("/vouchers/me"),
  adminList: (params) => api.get("/vouchers/", { params }),
  adminIssue: (payload) => api.post("/vouchers/", payload),
  adminPatch: (voucherId, payload) => api.patch(`/vouchers/${voucherId}`, payload),
};

export const aiApi = {
  extractCertificate: (payload) => api.post("/ai/certificate/extract", payload),
  generateTasks: (payload) => api.post("/ai/tasks/generate", payload),
  verifyCertificateUpload: (payload) => api.post("/ai/certificate/verify_upload", payload),
};

export const aiSuggestionsApi = {
  certifications: () => api.get("/ai/suggestions/certifications"),
  courses: (certificationId) => api.get(`/ai/suggestions/courses/${certificationId}`),
};

export const adminApi = {
  listUsers: () => api.get("/admin/users"),
  createUser: (payload) => api.post("/admin/users", payload),
  patchUser: (userId, payload) => api.patch(`/admin/users/${userId}`, payload),
  analytics: () => api.get("/admin/analytics"),
  runReminders: () => api.post("/admin/reminders/run"),
  auditLogs: () => api.get("/admin/audit-logs"),
  emailLogs: () => api.get("/admin/email-logs"),
  brdOverview: () => api.get("/admin/brd-overview"),
  githubActivity: () => api.get("/admin/github-activity"),
  activityHeatmap: () => api.get("/admin/activity-heatmap"),
};

export const exportsApi = {
  enrollmentsCsv: () => api.post("/admin/exports/enrollments"),
  usersCsv: () => api.get("/admin/exports/users", { responseType: "blob" }),
};

// BRD APIs (new)
export const drivesBrdApi = {
  adminList: () => api.get("/admin/drives/"),
  ensureDefaults: () => api.post("/admin/drives/ensure-defaults"),
  adminPatch: (driveId, payload) => api.patch(`/admin/drives/${driveId}`, payload),
  provisionRepo: (driveId) => api.post(`/admin/drives/${driveId}/provision-repo`),
  reconduct: (driveId) => api.post(`/admin/drives/${driveId}/reconduct`),
};

export const registrationsApi = {
  create: (payload) => api.post("/registrations/", payload),
  my: () => api.get("/registrations/me"),
  adminList: (params) => api.get("/registrations/", { params }),
  adminPatch: (registrationId, payload) => api.patch(`/registrations/${registrationId}`, payload),
  statusLookup: (params) => api.get("/registrations/status/lookup", { params }),
};

export const eligibilityAdminApi = {
  evaluate: (payload) => api.post("/admin/eligibility/evaluate", payload),
  approvalsList: (params) => api.get("/admin/eligibility/approvals", { params }),
  approvalsCreate: (payload) => api.post("/admin/eligibility/approvals", payload),
  approvalsDecide: (approvalId, payload) => api.post(`/admin/eligibility/approvals/${approvalId}/decide`, payload),
};

export const resultsAdminApi = {
  list: (params) => api.get("/admin/results/", { params }),
  create: (payload) => api.post("/admin/results/", payload),
  importCsv: (csv) => api.post("/admin/results/import-csv", { csv }),
  exportCsv: (params) => api.get("/admin/results/export-csv", { params, responseType: "blob" }),
};
