import axios from "axios";

export const API_BASE = "http://SEU_BACKEND_AQUI"; // mesmo do projeto web

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
