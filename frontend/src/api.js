import axios from "axios";

// Allow overriding API origin at build time via REACT_APP_API_ORIGIN.
// If provided, `api` base becomes `${ORIGIN}/api`. Otherwise fall back to relative `/api` for local dev proxy.
const ORIGIN = process.env.REACT_APP_API_ORIGIN || "";
const BASE = ORIGIN ? ORIGIN.replace(/\/$/, "") + "/api" : "/api";

export const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Always load user from localStorage (so header survives refresh)
const raw = localStorage.getItem("velion_user");
if (raw) {
  try {
    const user = JSON.parse(raw);
    if (user?.id) api.defaults.headers["x-user-id"] = String(user.id);
  } catch {}
}

export function setAuthUser(user) {
  if (user?.id) {
    api.defaults.headers["x-user-id"] = String(user.id);
  } else {
    delete api.defaults.headers["x-user-id"];
  }
}
