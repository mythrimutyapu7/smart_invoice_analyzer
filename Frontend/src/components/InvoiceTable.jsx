import { useMemo, useState } from "react";
import { updateInvoice, deleteInvoice } from "../api";
import { formatCurrency } from "../utils";

export function InvoiceTable({ invoices, loading, onSort, sort, onRefresh }) {
  const [editing, setEditing] = useState({});

  const isSortingField = (field) => sort.field === field;

  const sorted = useMemo(() => invoices, [invoices]);

  const save = async (id, rowValues) => {
    await updateInvoice(id, rowValues);
    onRefresh();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    await deleteInvoice(id);
    onRefresh();
  };

  const getSortIndicator = (field) => {
    if (!isSortingField(field)) return "";
    return sort.order === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="table-wrapper">
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => onSort("vendor")}>Vendor{getSortIndicator("vendor")}</th>
              <th onClick={() => onSort("date")}>Date{getSortIndicator("date")}</th>
              <th onClick={() => onSort("amount")}>Amount{getSortIndicator("amount")}</th>
              <th onClick={() => onSort("category")}>Category{getSortIndicator("category")}</th>
              <th onClick={() => onSort("dueDate")}>Due Date{getSortIndicator("dueDate")}</th>
              <th onClick={() => onSort("status")}>Status{getSortIndicator("status")}</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((invoice) => {
              const editingRow = editing[invoice._id] || {};
              const row = {
                vendor: invoice.vendor || "",
                date: invoice.date ? invoice.date.slice(0, 10) : "",
                dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : "",
                amount: invoice.amount ?? 0,
                category: invoice.category || "",
                status: invoice.status || "pending",
                notes: invoice.notes || "",
              };

              return (
                <tr key={invoice._id}>
                  <td>
                    <input
                      value={editingRow.vendor ?? row.vendor}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], vendor: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editingRow.date ?? row.date}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], date: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={editingRow.amount ?? row.amount}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], amount: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editingRow.category ?? row.category}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], category: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editingRow.dueDate ?? row.dueDate}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], dueDate: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editingRow.status ?? row.status}
                      className={`badge ${(editingRow.status ?? row.status)}`}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], status: e.target.value },
                        }))
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td>
                    <input
                      value={editingRow.notes ?? row.notes}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [invoice._id]: { ...row, ...prev[invoice._id], notes: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="btn save"
                      type="button"
                      onClick={() => save(invoice._id, editing[invoice._id] ?? row)}
                    >
                      Save
                    </button>
                    <button className="btn delete" type="button" onClick={() => remove(invoice._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
