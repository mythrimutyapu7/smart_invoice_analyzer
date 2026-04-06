import { useEffect, useState } from "react";
import { getInvoices } from "../api";
import { InvoiceTable } from "../components/InvoiceTable";
import { Search } from "lucide-react";

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState({ page: 1, limit: 10, total: 0 });
  const [sort, setSort] = useState({ field: "date", order: "desc" });
  const [filters, setFilters] = useState({ search: "", startDate: "", endDate: "" });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (opts = {}) => {
    setLoading(true);
    try {
      const resp = await getInvoices({
        page: opts.page ?? paging.page,
        limit: opts.limit ?? paging.limit,
        sortField: opts.sortField ?? sort.field,
        sortOrder: opts.sortOrder ?? sort.order,
        search: opts.search ?? filters.search,
        startDate: opts.startDate ?? filters.startDate,
        endDate: opts.endDate ?? filters.endDate,
      });

      setInvoices(resp.data);
      setPaging({ page: resp.page, limit: resp.limit, total: resp.total });
    } catch (err) {
      // Ignored for UI
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const nextOrder = sort.field === field && sort.order === "asc" ? "desc" : "asc";
    setSort({ field, order: nextOrder });
    loadInvoices({ sortField: field, sortOrder: nextOrder, page: 1 });
  };

  const handleSearch = () => {
    loadInvoices({ page: 1, search: filters.search });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(paging.total / paging.limit)) return;
    setPaging((p) => ({ ...p, page: newPage }));
    loadInvoices({ page: newPage });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Invoices</h2>
          <p className="page-subtitle">Manage and track your extracted invoices.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-controls">
          <div className="search-bar">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search vendors or categories..."
              type="search"
            />
          </div>
          <button className="btn secondary" onClick={handleSearch}>
            Filter
          </button>
        </div>

        <div className="table-wrapper">
          <InvoiceTable invoices={invoices} loading={loading} onSort={handleSort} sort={sort} onRefresh={() => loadInvoices({ page: paging.page })} />
        </div>

        <div className="table-controls" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="muted" style={{ fontSize: '0.9rem' }}>
            Showing page {paging.page} of {Math.max(1, Math.ceil(paging.total / paging.limit))}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" disabled={paging.page === 1} onClick={() => handlePageChange(paging.page - 1)}>
              Previous
            </button>
            <button
              className="btn secondary"
              disabled={paging.page >= Math.ceil(paging.total / paging.limit)}
              onClick={() => handlePageChange(paging.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
