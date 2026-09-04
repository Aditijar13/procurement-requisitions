import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { ArrowLeft, User, Calendar, Building2, Plus, Trash2 } from "lucide-react";
import styles from "./RequisitionDetail.module.css";

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
      padding: "4px 12px", borderRadius: 20,
      fontSize: 13, fontWeight: 600, textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
};

const RequisitionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requisition, setRequisition] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState("");
  const [receivedQtys, setReceivedQtys] = useState({});
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showAddApprover, setShowAddApprover] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [newNeededBy, setNewNeededBy] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, histRes, approversRes] = await Promise.all([
        api.get(`/requisitions/${id}`),
        api.get(`/requisitions/${id}/history`),
        api.get("/users/approvers"),
      ]);
      setRequisition(reqRes.data.requisition);
      setLineItems(reqRes.data.lineItems);
      setHistory(histRes.data.history);
      setApprovers(approversRes.data.approvers);

      const qtys = {};
      reqRes.data.lineItems.forEach((item) => {
        qtys[item._id] = item.received_qty;
      });
      setReceivedQtys(qtys);
    } catch (err) {
      toast.error("Failed to load requisition");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async (action, data = {}) => {
    try {
      await api.patch(`/requisitions/${id}/${action}`, data);
      toast.success("Done successfully");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) { toast.error("Rejection reason is required"); return; }
    await handleAction("reject", { comment: rejectComment });
    setShowRejectModal(false);
    setRejectComment("");
  };

  const handleReceive = async () => {
    const updates = lineItems.map((item) => ({
      itemId: item._id,
      received_qty: parseInt(receivedQtys[item._id]) || 0,
    }));
    await handleAction("receive", { received_updates: updates });
    setShowReceiveForm(false);
  };

  const handleExtendDate = async () => {
    if (!newNeededBy) { toast.error("Please select a date"); return; }
    await handleAction("extend", { needed_by: newNeededBy });
    setShowExtendForm(false);
    setNewNeededBy("");
  };

  const handleAddApprover = async () => {
    if (!selectedApprover) return;
    try {
      await api.patch(`/requisitions/${id}/approvers/add`, { userId: selectedApprover });
      toast.success("Approver added");
      setShowAddApprover(false);
      setSelectedApprover("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add approver");
    }
  };

  const handleRemoveApprover = async (userId) => {
    try {
      await api.patch(`/requisitions/${id}/approvers/remove`, { userId });
      toast.success("Approver removed");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove approver");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/requisitions/${id}/comment`, { comment });
      toast.success("Comment added");
      setComment("");
      fetchAll();
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  const handleArchive = async () => {
    await handleAction("archive");
    navigate("/requisitions");
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  const isAssigned = requisition?.assigned_approvers?.some(
    (a) => a._id?.toString() === (user?._id || user?.id)?.toString()
  );

  const isRequester = requisition?.requester?._id?.toString() === (user?._id || user?.id)?.toString();

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!requisition) return <div className={styles.loading}>Not found</div>;

  const { status } = requisition;
  const canComment = status !== "received" && (isRequester || isAssigned);
  const visibleHistory = showAllHistory ? history : history.slice(0, 2);

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate("/requisitions")}>
        <ArrowLeft size={16} /> Back to Requisitions
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{requisition.title}</h1>
              <StatusBadge status={status} />
            </div>
            <p className={styles.createdBy}>
              Raised by {requisition.requester?.name}
            </p>
          </div>

          <div className={styles.actions}>
            {isRequester && status === "draft" && (
              <>
                <button className={styles.btnSecondary} onClick={() => navigate(`/requisitions/${id}/edit`)}>
                  Edit
                </button>
                <button className={styles.btnPrimary} onClick={() => handleAction("submit")}>
                  Submit for Approval
                </button>
                <button className={styles.btnDanger} onClick={handleArchive}>
                  Archive
                </button>
              </>
            )}
            {isRequester && status === "rejected" && (
              <button className={styles.btnDanger} onClick={handleArchive}>
                Archive
              </button>
            )}
            
            {user?.role === "approver" && !isAssigned && status === "submitted" && (
              <div className={styles.assignHint}>
                Add yourself as approver below to approve this requisition
              </div>
            )}
            
            {isRequester && status === "submitted" && (
              <button className={styles.btnDanger} onClick={handleArchive}>
                Archive
              </button>
            )}
            {isRequester && status === "received" && (
              <button className={styles.btnDanger} onClick={handleArchive}>
                Archive
              </button>
            )}

            {user?.role === "approver" && isAssigned && status === "submitted" && (
              <>
                <button className={styles.btnSuccess} onClick={() => handleAction("approve")}>
                  Approve
                </button>
                <button className={styles.btnDanger} onClick={() => setShowRejectModal(true)}>
                  Reject
                </button>
              </>
            )}
            {user?.role === "approver" && isAssigned && status === "approved" && (
              <button className={styles.btnPrimary} onClick={() => handleAction("order")}>
                Mark as Ordered
              </button>
            )}
            {user?.role === "approver" && isAssigned && status === "ordered" && (
              <>
                <button className={styles.btnSuccess} onClick={() => setShowReceiveForm(!showReceiveForm)}>
                  Record Receipt
                </button>
                <button className={styles.btnSecondary} onClick={() => setShowExtendForm(!showExtendForm)}>
                  Extend Date
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}><Building2 size={11} /> Vendor</span>
            <span className={styles.metaValue}>{requisition.vendor}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}><User size={11} /> Department</span>
            <span className={styles.metaValue}>{requisition.department}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}><Calendar size={11} /> Needed By</span>
            <span className={styles.metaValue}>{formatDate(requisition.needed_by)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Total Amount</span>
            <span className={styles.metaValueLarge}>{formatAmount(requisition.total)}</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>

          {/* Line Items */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Line Items</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Description</th>
                  <th style={{ width: 70, textAlign: "center" }}>Qty</th>
                  <th style={{ width: 120, textAlign: "right" }}>Unit Price</th>
                  <th style={{ width: 120, textAlign: "right" }}>Subtotal</th>
                  <th style={{ width: 90, textAlign: "center" }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item._id} className={styles.tableRow}>
                    <td className={styles.tdNum}>{index + 1}</td>
                    <td className={styles.tdDesc}>{item.description}</td>
                    <td className={styles.tdCenter}>{item.quantity}</td>
                    <td className={styles.tdRight}>{formatAmount(item.unit_price)}</td>
                    <td className={styles.tdRight} style={{ fontWeight: 600 }}>{formatAmount(item.subtotal)}</td>
                    <td className={styles.tdCenter}>
                      <span className={item.received_qty >= item.quantity ? styles.receivedFull : styles.receivedPartial}>
                        {item.received_qty}/{item.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className={styles.tfootLabel}>Total Amount</td>
                  <td className={styles.tfootValue}>{formatAmount(requisition.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Receive Form */}
          {showReceiveForm && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Record Receipt</h2>
              <div className={styles.receiveList}>
                {lineItems.map((item) => (
                  <div key={item._id} className={styles.receiveRow}>
                    <span className={styles.receiveLabel}>{item.description}</span>
                    <div className={styles.receiveInput}>
                      <span className={styles.receiveHint}>of {item.quantity}</span>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={receivedQtys[item._id] || 0}
                        onChange={(e) => setReceivedQtys((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        className={styles.qtyInput}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className={styles.btnSuccess} onClick={handleReceive}>
                Save Receipt
              </button>
            </div>
          )}

          {/* Extend Date Form */}
          {showExtendForm && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Extend Needed-By Date</h2>
              <div className={styles.extendForm}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={newNeededBy}
                  onChange={(e) => setNewNeededBy(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <button className={styles.btnPrimary} onClick={handleExtendDate}>
                  Save Date
                </button>
              </div>
            </div>
          )}

          {/* Comment Box */}
          {canComment && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Add Comment</h2>
              <div className={styles.commentBox}>
                <textarea
                  className={styles.textarea}
                  placeholder="Leave a note or comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <button
                  className={styles.btnSecondary}
                  onClick={handleComment}
                  disabled={!comment.trim()}
                >
                  Post Comment
                </button>
              </div>
            </div>
          )}

          {/* History */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>History ({history.length})</h2>
            <div className={styles.timeline}>
              {visibleHistory.map((entry, index) => (
                <div key={entry._id} className={styles.timelineItem}>
                  <div className={styles.timelineDotWrapper}>
                    <div className={styles.timelineDot} />
                    {index < visibleHistory.length - 1 && <div className={styles.timelineLine} />}
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineActor}>{entry.actor?.name}</span>
                      <span className={styles.timelineAction}>{entry.action.replace(/_/g, " ")}</span>
                    </div>
                    {entry.comment && (
                      <p className={styles.timelineComment}>{entry.comment}</p>
                    )}
                    {entry.snapshot?.old_status && entry.snapshot?.new_status && (
                      <p className={styles.timelineSnapshot}>
                        {entry.snapshot.old_status} → {entry.snapshot.new_status}
                      </p>
                    )}
                    {entry.snapshot?.received_updates?.length > 0 && (
                      <div className={styles.receiptDetails}>
                        {entry.snapshot.received_updates.map((u, i) => {
                          const item = lineItems.find((l) => l._id?.toString() === u.itemId?.toString());
                          return (
                            <span key={i} className={styles.receiptItem}>
                              {item?.description || "Item"}: {u.received_qty} received
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <span className={styles.timelineDate}>{formatDate(entry.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            {history.length > 2 && (
              <button
                className={styles.showMoreBtn}
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? "Show less" : `Show ${history.length - 2} more`}
              </button>
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
          {/* Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Summary</h2>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Items</span>
                <span className={styles.summaryValue}>{lineItems.length}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total Qty</span>
                <span className={styles.summaryValue}>{lineItems.reduce((a, b) => a + b.quantity, 0)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Received</span>
                <span className={styles.summaryValue}>
                  {lineItems.reduce((a, b) => a + b.received_qty, 0)} / {lineItems.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total Amount</span>
                <span className={styles.summaryTotal}>{formatAmount(requisition.total)}</span>
              </div>
            </div>
          </div>

          {/* Requester */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Requester</h2>
            <div className={styles.approverRow}>
              <div className={styles.approverAvatar}>
                {requisition.requester?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.approverInfo}>
                <span className={styles.approverName}>{requisition.requester?.name}</span>
                <span className={styles.approverLimit}>{requisition.requester?.department}</span>
              </div>
            </div>
          </div>

          {/* Approvers */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Approvers</h2>
              {user?.role === "approver" && (
                <button className={styles.addBtn} onClick={() => setShowAddApprover(!showAddApprover)}>
                  <Plus size={13} /> Add
                </button>
              )}
            </div>
            {showAddApprover && (
              <div className={styles.addApproverRow}>
                <select
                  className={styles.select}
                  value={selectedApprover}
                  onChange={(e) => setSelectedApprover(e.target.value)}
                >
                  <option value="">Select approver...</option>
                  {approvers
                    .filter((a) => !requisition.assigned_approvers?.some((aa) => aa._id === a._id))
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} (limit: {formatAmount(a.approval_limit)})
                      </option>
                    ))}
                </select>
                <button className={styles.btnPrimary} onClick={handleAddApprover}>Add</button>
              </div>
            )}
            <div className={styles.approverList}>
              {requisition.assigned_approvers?.length === 0 ? (
                <p className={styles.emptyText}>No approvers assigned</p>
              ) : (
                requisition.assigned_approvers?.map((a) => (
                  <div key={a._id} className={styles.approverRow}>
                    <div className={styles.approverAvatar}>{a.name?.charAt(0).toUpperCase()}</div>
                    <div className={styles.approverInfo}>
                      <span className={styles.approverName}>{a.name}</span>
                      {user?.role === "approver" && (
                        <span className={styles.approverLimit}>Limit: {formatAmount(a.approval_limit)}</span>
                      )}
                    </div>
                    {user?.role === "approver" && (
                      <button className={styles.removeBtn} onClick={() => handleRemoveApprover(a._id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Reject Requisition</h3>
            <p className={styles.modalSubtitle}>Please provide a reason for rejection.</p>
            <textarea
              className={styles.textarea}
              placeholder="Rejection reason..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className={styles.btnDanger} onClick={handleReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionDetail;