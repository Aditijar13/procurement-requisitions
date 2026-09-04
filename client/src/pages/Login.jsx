import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosInstance";
import { ShoppingCart, Mail, Lock, Loader2, ClipboardList, BarChart2, Bell } from "lucide-react";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandRow}>
          <div className={styles.logoMark}>
            <ShoppingCart size={22} color="white" strokeWidth={2} />
          </div>
          <span className={styles.brandName}>ProcureFlow</span>
        </div>

        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>Streamline your procurement process</h2>
          <p className={styles.heroSubtitle}>
            Manage requisitions, approvals and purchases efficiently in one centralised platform.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ClipboardList size={16} />
              </div>
              <span>End-to-end requisition lifecycle management</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <BarChart2 size={16} />
              </div>
              <span>Real-time dashboard and spend analytics</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Bell size={16} />
              </div>
              <span>Overdue alerts and approval notifications</span>
            </div>
          </div>
        </div>

        <p className={styles.copyright}>© 2026 ProcureFlow. All rights reserved.</p>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.dotPattern} />
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className={styles.hint}>
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;