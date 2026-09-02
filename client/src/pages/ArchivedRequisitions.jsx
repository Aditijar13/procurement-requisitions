import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";
import styles from "./ArchivedRequisitions.module.css";

const ArchivedRequisitions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    try {
      const res = await api.get("/requisitions?archived=true");
      setRequisitions(res.data.requisitions);
    } catch (err) {
      toast.error("Failed to load archived requisitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchived(); }, []);

  const handleRestore = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/requisitions/${id}/restore`);
      toast.success("Requisition restored");
      fetchArchived();
    } catch (err) {
      toast.error("Failed to restore");
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

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
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Archived</h1>
          <p className={styles.pageSubtitle}>
            {requisitions.length} archived requisition{requisitions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : requisitions.length === 0 ? (
          <div className={styles.empty}>
            <p>No archived requisitions.</p>
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
                {user?.role === "requester" && <th></th>}
              </tr>
            </thead>
            <tbody>
              {requisitions.map((req) => (
                <tr
                  key={req._id}
                  className={styles.row}
                  onClick={() => navigate(`/requisitions/${req._id}`)}
                >
                  <td>
                    <span className={styles.title}>{req.title}</span>
                    <span className={styles.requester}>{req.requester?.name}</span>
                  </td>
                  <td className={styles.vendor}>{req.vendor}</td>
                  <td className={styles.dept}>{req.department}</td>
                  <td className={styles.amount}>{formatAmount(req.total)}</td>
                  <td className={styles.date}>{formatDate(req.needed_by)}</td>
                  <td><StatusBadge status={req.status} /></td>
                  {user?.role === "requester" && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.restoreBtn}
                        onClick={(e) => handleRestore(req._id, e)}
                      >
                        <RotateCcw size={13} />
                        Restore
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ArchivedRequisitions;