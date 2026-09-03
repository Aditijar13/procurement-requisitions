import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import styles from "./Alerts.module.css";

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/alerts");
      setAlerts(res.data.alerts);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = async (requisitionId, e) => {
    e.stopPropagation();
    try {
      await api.post("/alerts/dismiss", { requisitionId });
      toast.success("Alert dismissed");
      setAlerts((prev) => prev.filter((a) => a._id !== requisitionId));
    } catch {
      toast.error("Failed to dismiss");
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  const daysOverdue = (date) =>
    Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));

  if (loading) return <div className={styles.loading}>Loading alerts...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
  <div className={styles.headerIcon}>
    <AlertTriangle size={18} />
  </div>

  <div className={styles.headerContent}>
    <h1 className={styles.pageTitle}>Overdue Alerts</h1>
    <p className={styles.pageSubtitle}>
      Ordered requisitions assigned to you that are past their needed-by date
    </p>
  </div>
</div>

      {alerts.length === 0 ? (
        <div className={styles.empty}>
          <AlertTriangle size={32} color="#d1d5db" />
          <p>No overdue alerts — everything is on track.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={styles.card}
              onClick={() => navigate(`/requisitions/${alert._id}`)}
            >
              <div className={styles.cardLeft}>
                <div className={styles.cardTitle}>
                  {alert.title}
                  <span className={styles.overdueBadge}>
                    {daysOverdue(alert.needed_by)}d overdue
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span>{alert.vendor}</span>
                  <span>{alert.department}</span>
                  <span>Needed by: {formatDate(alert.needed_by)}</span>
                  <span className={styles.amount}>{formatAmount(alert.total)}</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.dismissBtn}
                  onClick={(e) => handleDismiss(alert._id, e)}
                >
                  <X size={13} /> Dismiss
                </button>
                <div className={styles.externalIcon}>
  <ExternalLink size={14} />
</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;