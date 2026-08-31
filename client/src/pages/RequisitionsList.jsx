import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { Search, Plus, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import styles from "./RequisitionsList.module.css";

const StatusBadge = ({ status }) => {
  const colors = {
    draft: { bg: "#f3f4f6", color: "#4b5563" },
    submitted: { bg: "#dbeafe", color: "#1d4ed8" },
    approved: { bg: "#d1fae5", color: "#059669" },
    rejected: { bg: "#fee2e2", color: "#dc2626" },
    ordered: { bg: "#ede9fe", color: "#7c3aed" },
    received: { bg: "#ccfbf1", color: "#0d9488" },
  };
  const c = colors[status] || colors.draft;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, textTransform: "capitalize",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
};

const RequisitionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [overdue, setOverdue] = useState("");
  const [owner, setOwner] = useState("");
  const [users, setUsers] = useState([]);
  const [assigned, setAssigned] = useState("");

  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (department) params.append("department", department);
      if (sort) params.append("sort", sort);
      if (overdue) params.append("overdue", overdue);
      if (owner) params.append("owner", owner);
      if (assigned) params.append("assigned", assigned);
      params.append("page", page);
      params.append("limit", 10);

      const res = await api.get(`/requisitions?${params.toString()}`);
      setRequisitions(res.data.requisitions);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status, department, sort, page, overdue, owner, assigned]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data.users)).catch(() => {});
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Requisitions</h1>
          <p className={styles.pageSubtitle}>
            {pagination.total || 0} total requisitions
          </p>
        </div>
        {user?.role === "requester" && (
          <button
            className={styles.newBtn}
            onClick={() => navigate("/requisitions/new")}
          >
            <Plus size={16} />
            New Requisition
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by title or vendor..."
            className={styles.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <Filter size={14} className={styles.filterIcon} />
          <select
            className={styles.select}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
          </select>

          <select
            className={styles.select}
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="Marketing">Marketing</option>
          </select>

          <select
  className={styles.select}
  value={overdue}
  onChange={(e) => { setOverdue(e.target.value); setPage(1); }}
>
  <option value="">All</option>
  <option value="true">Overdue Only</option>
</select>

{user?.role === "approver" && (
  <select
    className={styles.select}
    value={assigned}
    onChange={(e) => { setAssigned(e.target.value); setPage(1); }}
  >
    <option value="">All Requisitions</option>
    <option value="true">Assigned to Me</option>
  </select>
)}

{user?.role === "approver" && (
  <select
    className={styles.select}
    value={owner}
    onChange={(e) => { setOwner(e.target.value); setPage(1); }}
  >
    <option value="">All Owners</option>
    {users
      .filter((u) => u.role === "requester")
      .map((u) => (
        <option key={u._id} value={u._id}>{u.name}</option>
      ))}
  </select>
)}

          <select
            className={styles.select}
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            <option value="">Sort: Latest</option>
            <option value="needed_by">Sort: Needed By</option>
            <option value="total_asc">Sort: Amount ↑</option>
            <option value="total_desc">Sort: Amount ↓</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : requisitions.length === 0 ? (
          <div className={styles.empty}>
            <p>No requisitions found.</p>
            {user?.role === "requester" && (
              <button
                className={styles.newBtn}
                onClick={() => navigate("/requisitions/new")}
              >
                <Plus size={16} />
                Create your first requisition
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Vendor</th>
                <th>Department</th>
                <th>Total</th>
                <th>Needed By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map((req) => (
                <tr
                  key={req._id}
                  onClick={() => navigate(`/requisitions/${req._id}`)}
                  className={styles.row}
                >
                  <td>
                    <span className={styles.title}>{req.title}</span>
                    <span className={styles.requester}>
                      {req.requester?.name}
                    </span>
                  </td>
                  <td className={styles.vendor}>{req.vendor}</td>
                  <td className={styles.dept}>{req.department}</td>
                  <td className={styles.amount}>{formatAmount(req.total)}</td>
                  <td className={styles.date}>{formatDate(req.needed_by)}</td>
                  <td><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {pagination.pages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={page === pagination.pages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RequisitionsList;