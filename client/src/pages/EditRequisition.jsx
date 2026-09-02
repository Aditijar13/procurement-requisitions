import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import styles from "./CreateRequisition.module.css";

const DEPARTMENTS = ["HR", "IT", "Finance", "Operations", "Marketing", "Procurement"];

const EditRequisition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [form, setForm] = useState({
    title: "",
    vendor: "",
    department: "",
    needed_by: "",
  });
  const [lineItems, setLineItems] = useState([]);

  const fetchRequisition = useCallback(async () => {
    try {
      const res = await api.get(`/requisitions/${id}`);
      const req = res.data.requisition;

      if (req.status !== "draft") {
        toast.error("Only draft requisitions can be edited");
        navigate(`/requisitions/${id}`);
        return;
      }

      setForm({
        title: req.title,
        vendor: req.vendor,
        department: req.department,
        needed_by: req.needed_by?.split("T")[0],
      });

      if (!DEPARTMENTS.includes(req.department)) {
        setShowCustomDept(true);
      }

      setLineItems(res.data.lineItems.map((item) => ({
        ...item,
        id: item._id,
        unit_price: item.unit_price,
      })));
    } catch (err) {
      toast.error("Failed to load requisition");
      navigate("/requisitions");
    } finally {
      setFetching(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchRequisition(); }, [fetchRequisition]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (itemId, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, {
      description: "", quantity: 1, unit_price: "", id: Date.now(), isNew: true,
    }]);
  };

  const removeLineItem = async (item) => {
    if (lineItems.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    if (!item.isNew) {
      try {
        await api.delete(`/requisitions/${id}/items/${item._id}`);
      } catch (err) {
        toast.error("Failed to remove item");
        return;
      }
    }
    setLineItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const getSubtotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const getTotal = () => lineItems.reduce((sum, item) => sum + getSubtotal(item), 0);

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

  const handleSave = async () => {
    if (!form.title || !form.vendor || !form.department || !form.needed_by) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/requisitions/${id}`, form);

      for (const item of lineItems) {
        if (item.isNew) {
          await api.post(`/requisitions/${id}/items`, {
            description: item.description,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
          });
        } else {
          await api.put(`/requisitions/${id}/items/${item._id}`, {
            description: item.description,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
          });
        }
      }

      toast.success("Requisition updated successfully");
      navigate(`/requisitions/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update requisition");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: 40, color: "var(--gray-400)" }}>Loading...</div>;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(`/requisitions/${id}`)}>
        <ArrowLeft size={16} /> Back to Requisition
      </button>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Edit Requisition</h1>
        <p className={styles.pageSubtitle}>Update the details below. Changes are saved as draft.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Requisition Details</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Title <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="title"
                  className={styles.input}
                  value={form.title}
                  onChange={handleFormChange}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Vendor <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="vendor"
                  className={styles.input}
                  value={form.vendor}
                  onChange={handleFormChange}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Department <span className={styles.required}>*</span></label>
                <select
                  className={styles.select}
                  value={showCustomDept ? "other" : form.department}
                  onChange={(e) => {
                    if (e.target.value === "other") {
                      setShowCustomDept(true);
                      setForm((prev) => ({ ...prev, department: "" }));
                    } else {
                      setShowCustomDept(false);
                      setForm((prev) => ({ ...prev, department: e.target.value }));
                    }
                  }}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="other">Other (specify)</option>
                </select>
                {showCustomDept && (
                  <input
                    type="text"
                    name="department"
                    className={styles.input}
                    placeholder="Enter your department name"
                    value={form.department}
                    onChange={handleFormChange}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Needed By <span className={styles.required}>*</span></label>
                <input
                  type="date"
                  name="needed_by"
                  className={styles.input}
                  value={form.needed_by}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Line Items</h2>
              <button className={styles.addBtn} onClick={addLineItem}>
                <Plus size={13} /> Add Item
              </button>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th style={{ width: 80 }}>Qty</th>
                  <th style={{ width: 130 }}>Unit Price (₹)</th>
                  <th style={{ width: 120, textAlign: "right" }}>Subtotal</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className={styles.tdNum}>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.tableInput}
                        style={{ textAlign: "center" }}
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.tableInput}
                        style={{ textAlign: "right" }}
                        min={0}
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, "unit_price", e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontSize: 13, padding: "8px 12px" }}>
                      {formatAmount(getSubtotal(item))}
                    </td>
                    <td style={{ textAlign: "center", padding: "8px" }}>
                      <button className={styles.removeBtn} onClick={() => removeLineItem(item)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className={styles.tfootLabel}>Total Amount</td>
                  <td className={styles.tfootValue}>{formatAmount(getTotal())}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Summary</h2>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Items</span>
                <span className={styles.summaryValue}>{lineItems.length}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total Qty</span>
                <span className={styles.summaryValue}>
                  {lineItems.reduce((a, b) => a + (parseFloat(b.quantity) || 0), 0)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total Amount</span>
                <span className={styles.summaryTotal}>{formatAmount(getTotal())}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Save Changes</h2>
            <p className={styles.submitHint}>
              Requisition stays in draft until you submit it for approval.
            </p>
            <div className={styles.submitActions}>
              <button
                className={styles.btnPrimary}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate(`/requisitions/${id}`)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequisition;