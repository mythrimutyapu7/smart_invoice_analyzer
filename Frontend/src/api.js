import { getAuthHeaders, signOut } from "./auth";

const API_BASE = "/api/invoices";

function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...getAuthHeaders() };
  const resp = await fetch(url, { ...options, headers });

  if (resp.status === 401) {
    signOut();
    throw new Error("Unauthorized");
  }

  if (!resp.ok) {
    let err;
    try {
      err = await resp.json();
    } catch {
      err = {};
    }
    throw new Error(err.message || "Request failed");
  }

  return resp.json();
}

export async function getInvoices(options = {}) {
  const url = buildUrl(API_BASE, options);
  return apiFetch(url);
}

export async function getSummary(options = {}) {
  const url = buildUrl(`${API_BASE}/summary`, options);
  return apiFetch(url);
}

export async function getFiltersLookup() {
  return apiFetch(`${API_BASE}/filters-lookup`);
}

export async function getMonthlyInsights(options = {}) {
  const url = buildUrl(`${API_BASE}/monthly-insights`, options);
  return apiFetch(url);
}

export async function exportReport(options = {}, format = "csv") {
  const url = buildUrl(`${API_BASE}/export`, { ...options, format });
  const headers = getAuthHeaders();
  
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error("Failed to export report");
  
  const blob = await resp.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = downloadUrl;
  a.download = `invoices_report.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  a.remove();
}

export async function uploadInvoice({ file }) {
  const form = new FormData();
  form.append("invoice", file);

  return apiFetch("/api/invoices/upload", {
    method: "POST",
    body: form,
  });
}

export async function confirmInvoice(payload) {
  return apiFetch("/api/invoices/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateInvoice(id, payload) {
  return apiFetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteInvoice(id) {
  return apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function sendChatMessage(query) {
  return apiFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
}
