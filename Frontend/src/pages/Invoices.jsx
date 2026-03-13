import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../auth";
import { getInvoices } from "../api";
import { InvoiceTable } from "../components/InvoiceTable";

export function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState({ page: 1, limit: 10, total: 0 });
  const [sort, setSort] = useState({ field: "date", order: "desc" });
  const [filters, setFilters] = useState({ search: "", startDate: "", endDate: "" });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin", { replace: true });
      return;
    }
    loadInvoices();
  }, [navigate]);

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
      // If token was invalid/expired, redirect to signin
      navigate("/signin", { replace: true });
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
    <div className="page invoices">
      <div className="page-header">
        <h2>Invoices</h2>
        <div className="controls">
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search (vendor, category, notes)..."
            type="search"
          />
          <button className="btn primary" onClick={handleSearch}>
            Search
          </button>
          <button className="btn secondary" onClick={() => navigate("/dashboard")}>Dashboard</button>
        </div>
      </div>

      <InvoiceTable invoices={invoices} loading={loading} onSort={handleSort} sort={sort} onRefresh={() => loadInvoices({ page: paging.page })} />

      <div className="pagination" id="pagination">
        <button className="btn" disabled={paging.page === 1} onClick={() => handlePageChange(paging.page - 1)}>
          Prev
        </button>
        <span>
          Page {paging.page} of {Math.max(1, Math.ceil(paging.total / paging.limit))}
        </span>
        <button
          className="btn"
          disabled={paging.page >= Math.ceil(paging.total / paging.limit)}
          onClick={() => handlePageChange(paging.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
