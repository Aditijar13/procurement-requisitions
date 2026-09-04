import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import {
  ClipboardList, IndianRupee, AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import styles from "./Dashboard.module.css";

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
      fontSize: 12, fontWeight: 600, textTransform: "capitalize"
    }}>
      {status}
    </span>
  );
};

const KPICard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className={styles.kpiCard}>
    <div className={styles.kpiTop}>
      <span className={styles.kpiTitle}>{title}</span>
      <div className={styles.kpiIcon} style={{ background: color + "15", color }}>
        <Icon size={18} />
      </div>
    </div>
    <div className={styles.kpiValue}>{value}</div>
    {subtitle && <div className={styles.kpiSubtitle}>{subtitle}</div>}
  </div>
);


const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={24} className={styles.spinner} />
      </div>
    );
  }

  const getWeekLabel = (week, year) => {
    const jan1 = new Date(year, 0, 1);
    const dayOffset = (week - 1) * 7;
    const weekStart = new Date(jan1.setDate(jan1.getDate() + dayOffset));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${fmt(weekStart)} - ${fmt(weekEnd)}`;
  };

  const chartData = data?.weekly_received?.map((w) => ({
    week: getWeekLabel(w._id.week, w._id.year),
    fullLabel: getWeekLabel(w._id.week, w._id.year),
    received: w.count,
  })) || [];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = chartData.find((d) => d.week === label);
      return (
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          <p style={{ fontWeight: 600, marginBottom: 4, color: "#111827", fontSize: 12 }}>
            {item?.fullLabel || label}
          </p>
          <p style={{ color: "#4f46e5", fontWeight: 500 }}>
            {payload[0].value} requisition{payload[0].value !== 1 ? "s" : ""} received
          </p>
        </div>
      );
    }
    return null;
  };

  const statusOrder = ["draft", "submitted", "approved", "rejected", "ordered", "received"];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KPICard
          title="Awaiting Approval"
          value={data?.headline?.awaiting_approval || 0}
          icon={ClipboardList}
          color="#4f46e5"
          subtitle="Submitted requisitions"
        />
        <KPICard
          title="Open Commitments"
          value={`₹${(data?.headline?.open_commitments_value || 0).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          color="#059669"
          subtitle="Approved + ordered value"
        />
        <KPICard
          title="Overdue"
          value={data?.headline?.overdue || 0}
          icon={AlertTriangle}
          color="#dc2626"
          subtitle="Past needed-by date"
        />
        <KPICard
          title="Received This Week"
          value={data?.headline?.received_this_week || 0}
          icon={CheckCircle2}
          color="#0d9488"
          subtitle="Fully received orders"
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
  <h2 className={styles.cardTitle}>By Status</h2>
  <div className={styles.statusGrid}>
    {statusOrder.map((status) => {
      const count = data?.status_breakdown?.[status];
      if (!count) return null;
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
        <div
  key={status}
  className={styles.statusCard}
  style={{ borderLeftColor: c.color }}
>
  <span className={styles.statusCardLabel}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
  <span className={styles.statusCardCount}>
    {count}
  </span>
</div>
      );
    })}
  </div>
</div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>By Department</h2>
          <div className={styles.deptList}>
            {data?.department_breakdown?.map((dept) => (
              <div key={dept._id} className={styles.deptCard}>
                <div className={styles.deptInfo}>
                  <span className={styles.deptName}>{dept._id}</span>
                  <span className={styles.deptCount}>{dept.count} requisition{dept.count !== 1 ? "s" : ""}</span>
                </div>
                <span className={styles.deptTotal}>
                  ₹{dept.total.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.card} ${styles.chartCard}`}>
          <h2 className={styles.cardTitle}>Received per Week (Last 8 Weeks)</h2>
          {chartData.length === 0 ? (
            <div className={styles.emptyChart}>No received requisitions in the last 8 weeks</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={36} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                />
                <Bar dataKey="received" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;