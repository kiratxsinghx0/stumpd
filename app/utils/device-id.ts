const LS_KEY = "stumpd_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(LS_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LS_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
