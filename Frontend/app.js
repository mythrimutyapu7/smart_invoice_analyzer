const apiBase = "/api/invoices";

const elements = {
  search: document.getElementById("search"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  refreshBtn: document.getElementById("refreshBtn"),
  newInvoiceBtn: document.getElementById("newInvoiceBtn"),
  fileInput: document.getElementById("fileInput"),
  uploadBtn: document.getElementById("uploadBtn"),
  uploadZone: document.querySelector(".upload-dropzone"),
  tbody: document.querySelector("#invoiceTable tbody"),
  pagination: document.getElementById("pagination"),
  summaryCount: document.getElementById("summaryCount"),
  summaryTotal: document.getElementById("summaryTotal"),
  summaryLatest: document.getElementById("summaryLatest"),
  categoryChart: document.getElementById("categoryChart"),
  monthlyChart: document.getElementById("monthlyChart"),
  toast: document.getElementById("toast"),
};

let categoryChartInstance = null;
let monthlyChartInstance = null;
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let sortField = "date";
let sortOrder = "desc";
let selectedFile = null;

function getUserId() {
  return localStorage.getItem("userId") || "default";
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function showToast(message, type = "info") {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  elements.toast.style.borderColor =
    type === "error" ? "rgba(239, 68, 68, 0.7)" : "rgba(34, 197, 94, 0.7)";

  window.clearTimeout(elements.toast._timeout);
  elements.toast._timeout = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 3800);
}

async function fetchInvoices() {
  const params = new URLSearchParams();
  params.set("page", currentPage);
  params.set("limit", pageSize);
  params.set("sortField", sortField);
  params.set("sortOrder", sortOrder);
  params.set("userId", getUserId());

  if (elements.search.value.trim()) params.set("search", elements.search.value.trim());
  if (elements.fromDate.value) params.set("startDate", elements.fromDate.value);
  if (elements.toDate.value) params.set("endDate", elements.toDate.value);

  const resp = await fetch(`${apiBase}?${params.toString()}`);
  if (!resp.ok) throw new Error("Failed to load invoices");
  return await resp.json();
}

async function fetchSummary() {
  const resp = await fetch(`${apiBase}/summary?userId=${encodeURIComponent(getUserId())}`);
  if (!resp.ok) throw new Error("Failed to load summary");
  return await resp.json();
}

function updateSummary(invoices, summary) {
  const total = summary?.totalAmount ?? invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  const latest = invoices
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  elements.summaryCount.textContent = summary?.invoiceCount ?? invoices.length;
  elements.summaryTotal.textContent = formatCurrency(total);
  elements.summaryLatest.textContent = latest
    ? `${latest.vendor || "—"} (${new Date(latest.date).toLocaleDateString()})`
    : "—";
}

function buildRow(invoice) {
  const tr = document.createElement("tr");
  tr.dataset.id = invoice._id;

  const date = invoice.date ? new Date(invoice.date).toISOString().slice(0, 10) : "";

  tr.innerHTML = `
    <td><input data-field="vendor" value="${invoice.vendor || ""}" /></td>
    <td><input data-field="date" type="date" value="${date}" /></td>
    <td><input data-field="amount" type="number" step="0.01" value="${invoice.amount ?? ""}" /></td>
    <td><input data-field="category" value="${invoice.category || ""}" /></td>
    <td>
      <select data-field="status">
        <option value="pending" ${invoice.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="paid" ${invoice.status === "paid" ? "selected" : ""}>Paid</option>
        <option value="overdue" ${invoice.status === "overdue" ? "selected" : ""}>Overdue</option>
      </select>
    </td>
    <td><input data-field="notes" value="${invoice.notes || ""}" /></td>
    <td>
      <button class="save btn" type="button">Save</button>
      <button class="delete btn" type="button">Delete</button>
    </td>
  `;

  const saveBtn = tr.querySelector("button.save");
  const deleteBtn = tr.querySelector("button.delete");

  saveBtn.addEventListener("click", () => saveInvoice(invoice._id, tr));
  deleteBtn.addEventListener("click", () => confirmDelete(invoice._id));

  return tr;
}

async function saveInvoice(id, row) {
  const inputs = row.querySelectorAll("[data-field]");
  const payload = {};
  inputs.forEach((input) => {
    const key = input.dataset.field;
    let value = input.value;
    if (key === "amount") value = Number(value);
    if (key === "date") value = value ? new Date(value).toISOString() : null;
    payload[key] = value;
  });

  try {
    const resp = await fetch(`${apiBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || "Unable to save invoice");
    }

    showToast("Invoice saved successfully");
    await refresh();
  } catch (err) {
    showToast(err.message || "Save failed", "error");
  }
}

async function confirmDelete(id) {
  if (!confirm("Delete this invoice? This action cannot be undone.")) return;
  try {
    const resp = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || "Unable to delete");
    }
    showToast("Invoice deleted", "info");
    await refresh();
  } catch (err) {
    showToast(err.message || "Delete failed", "error");
  }
}

async function createInvoice() {
  const payload = {
    vendor: "",
    date: new Date().toISOString(),
    amount: 0,
    category: "",
    status: "pending",
    notes: "",
  };

  try {
    const resp = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || "Unable to create invoice");
    }

    showToast("New invoice created. Edit the row and save.");
    await refresh();
  } catch (err) {
    showToast(err.message || "Create failed", "error");
  }
}

function buildCharts(summary) {
  const categoryLabels = summary.categories.map((c) => c._id || "Uncategorized");
  const categoryData = summary.categories.map((c) => c.total);

  const monthlyLabels = summary.monthly.map((m) => m._id);
  const monthlyData = summary.monthly.map((m) => m.total);

  if (categoryChartInstance) categoryChartInstance.destroy();
  if (monthlyChartInstance) monthlyChartInstance.destroy();

  categoryChartInstance = new Chart(elements.categoryChart, {
    type: "pie",
    data: {
      labels: categoryLabels,
      datasets: [
        {
          data: categoryData,
          backgroundColor: [
            "#22c55e",
            "#38bdf8",
            "#fb7185",
            "#f97316",
            "#a855f7",
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });

  monthlyChartInstance = new Chart(elements.monthlyChart, {
    type: "bar",
    data: {
      labels: monthlyLabels,
      datasets: [
        {
          label: "Total",
          data: monthlyData,
          backgroundColor: "rgba(56, 189, 248, 0.75)",
        },
      ],
    },
    options: {
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => formatCurrency(value) },
        },
      },
    },
  });
}

function renderPagination(total, page, limit) {
  const container = elements.pagination;
  if (!container) return;

  const totalPagesCalc = Math.max(1, Math.ceil(total / limit));
  totalPages = totalPagesCalc;
  currentPage = Math.min(Math.max(1, page), totalPages);

  container.innerHTML = `
    <button class="btn" ${currentPage === 1 ? "disabled" : ""} data-action="prev">Prev</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button class="btn" ${currentPage === totalPages ? "disabled" : ""} data-action="next">Next</button>
  `;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "prev" && currentPage > 1) {
        currentPage -= 1;
      }
      if (action === "next" && currentPage < totalPages) {
        currentPage += 1;
      }
      refresh();
    });
  });
}

async function refresh() {
  try {
    const [invoiceResp, summary] = await Promise.all([fetchInvoices(), fetchSummary()]);

    updateSummary(invoiceResp.data, summary);
    renderTable(invoiceResp.data);
    renderPagination(invoiceResp.total, invoiceResp.page, invoiceResp.limit);
    buildCharts(summary);
  } catch (err) {
    showToast(err.message || "Unable to load data", "error");
  }
}

function renderTable(invoices) {
  elements.tbody.innerHTML = "";
  invoices.forEach((invoice) => {
    elements.tbody.append(buildRow(invoice));
  });
}

function setSort(field) {
  if (sortField === field) {
    sortOrder = sortOrder === "asc" ? "desc" : "asc";
  } else {
    sortField = field;
    sortOrder = "asc";
  }
  currentPage = 1;
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.remove("asc", "desc");
    if (th.dataset.sort === sortField) {
      th.classList.add(sortOrder);
    }
  });
  refresh();
}

function attachHandlers() {
  elements.refreshBtn.addEventListener("click", refresh);
  elements.search.addEventListener("keyup", (event) => {
    if (event.key === "Enter") refresh();
  });
  elements.newInvoiceBtn.addEventListener("click", createInvoice);

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => setSort(th.dataset.sort));
  });

  elements.fileInput.addEventListener("change", () => {
    selectedFile = elements.fileInput.files[0];
    elements.uploadBtn.disabled = !selectedFile;
  });

  elements.uploadZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    elements.uploadZone.classList.add("dragover");
  });

  elements.uploadZone.addEventListener("dragleave", () => {
    elements.uploadZone.classList.remove("dragover");
  });

  elements.uploadZone.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.uploadZone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];
    if (file) {
      elements.fileInput.files = event.dataTransfer.files;
      selectedFile = file;
      elements.uploadBtn.disabled = false;
    }
  });

  elements.uploadBtn.addEventListener("click", uploadInvoice);
}

async function uploadInvoice() {
  if (!selectedFile) {
    showToast("Select a file first", "error");
    return;
  }

  const form = new FormData();
  form.append("invoice", selectedFile);

  try {
    const resp = await fetch("/upload", {
      method: "POST",
      body: form,
      headers: {
        "x-user-id": getUserId(),
      },
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || "Upload failed");
    }

    showToast("Invoice uploaded and processed");
    elements.fileInput.value = "";
    selectedFile = null;
    elements.uploadBtn.disabled = true;
    await refresh();
  } catch (err) {
    showToast(err.message || "Upload failed", "error");
  }
}

async function init() {
  attachHandlers();
  await refresh();
}

init();
