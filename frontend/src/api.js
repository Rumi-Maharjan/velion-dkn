import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
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
