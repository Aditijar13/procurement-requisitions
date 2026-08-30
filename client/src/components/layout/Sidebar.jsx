import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { ShoppingCart, LayoutDashboard, ClipboardList, Archive, LogOut } from "lucide-react";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    if (user?.role === "approver") {
      api.get("/alerts").then((res) => setOverdueCount(res.data.count)).catch(() => {});
    }
  }, [user]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
  <ShoppingCart size={16} color="white" strokeWidth={2} />
</div>
        <span className={styles.logoText}>ProcureFlow</span>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <LayoutDashboard size={17} />
          Dashboard
        </NavLink>

        <NavLink
          to="/requisitions"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <ClipboardList size={17} />
          Requisitions
          {overdueCount > 0 && (
            <span className={styles.badge}>{overdueCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/archived"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <Archive size={17} />
          Archived
        </NavLink>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;