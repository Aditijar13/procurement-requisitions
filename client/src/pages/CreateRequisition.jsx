import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import styles from "./CreateRequisition.module.css";

const DEPARTMENTS = ["HR", "IT", "Finance", "Operations", "Marketing", "Procurement"];

const emptyLineItem = () => ({
  description: "",
  quantity: 1,
  unit_price: "",
  id: Date.now(),
});

const CreateRequisition = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [form, setForm] = useState({
    title: "",
    vendor: "",
    department: "",
    needed_by: "",
  });
  const [lineItems, setLineItems] = useState([emptyLineItem()]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);

  const removeLineItem = (id) => {
    if (lineItems.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getSubtotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const getTotal = () => lineItems.reduce((sum, item) => sum + getSubtotal(item), 0);

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  const handleSubmit = async () => {
    if (!form.title || !form.vendor || !form.department || !form.needed_by) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invalidItems = lineItems.some(
      (item) => !item.description || !item.quantity || !item.unit_price
    );

    if (invalidItems) {
      toast.error("Please fill in all line item fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/requisitions", {
        ...form,
        line_items: lineItems.map(({ description, quantity, unit_price }) => ({
          description,
          quantity: parseInt(quantity),
          unit_price: parseFloat(unit_price),
        })),
      });
      toast.success("Requisition created successfully");
      navigate(`/requisitions/${res.data.requisition._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create requisition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate("/requisitions")}>
        <ArrowLeft size={16} /> Back to Requisitions
      </button>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>New Requisition</h1>
        <p className={styles.pageSubtitle}>Fill in the details below to create a purchase requisition</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          {/* Basic Details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Requisition Details</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Title <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="title"
                  className={styles.input}
                  placeholder="e.g. Office Chairs for HR Floor"
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
                  placeholder="e.g. Featherlite Furniture"
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
      autoFocus
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
                  onChange={handleFormChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
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
                        placeholder="Item description"
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
                        placeholder="0.00"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, "unit_price", e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontSize: 13, padding: "8px 12px" }}>
                      {formatAmount(getSubtotal(item))}
                    </td>
                    <td style={{ textAlign: "center", padding: "8px" }}>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeLineItem(item.id)}
                      >
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

        {/* Right col — summary and submit */}
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
            <h2 className={styles.cardTitle}>Ready to submit?</h2>
            <p className={styles.submitHint}>
              Once submitted, you will not be able to edit this requisition until it is reviewed.
            </p>
            <div className={styles.submitActions}>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Requisition"}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/requisitions")}
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

export default CreateRequisition;