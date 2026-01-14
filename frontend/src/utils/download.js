import { toast } from "react-toastify";

export async function downloadFile(url, suggestedName) {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const blob = await res.blob();

    // Try to determine filename from Content-Disposition header
    let filename = suggestedName || "download";
    const cd = res.headers.get("content-disposition");
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
    } else {
      try {
        const u = new URL(url, window.location.href);
        const parts = u.pathname.split("/");
        if (parts.length) {
          const last = parts[parts.length - 1];
          if (last) filename = last;
        }
      } catch {}
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    return true;
  } catch (err) {
    console.error("Download failed", err);
    toast.error("Download failed");
    return false;
  }
}
