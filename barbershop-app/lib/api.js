// lib/api.ts
import axios from "axios";
import Constants from "expo-constants";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  Constants.manifest?.extra?.API_URL;

if (!baseURL) console.warn("Missing EXPO_PUBLIC_API_URL (or extra.API_URL).");

export default axios.create({ baseURL, timeout: 12000 });
