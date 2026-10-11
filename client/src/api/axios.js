import axios from "axios";

export const api = axios.create({ baseURL: "/api", withCredentials: true });

api.interceptors.response.use(
  (r) => r,
  (e) => {
    e.message = e.response?.data?.message || e.message;
    return Promise.reject(e);
  }
);