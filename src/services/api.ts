import axios from "axios";
import { Platform } from "react-native";

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://192.168.1.17:5231"; 
export const TRANSCRIBE_URL = process.env.EXPO_PUBLIC_TRANSCRIBE_URL || "http://192.168.1.17:5005/transcrever";

function resolveBaseURL(base: string) {
  let url = base;
  if (Platform.OS === "android") {
    url = url.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  }
  return url;
}

const api = axios.create({
  baseURL: resolveBaseURL(API_BASE),
  timeout: 30000, 
});

export default api;
