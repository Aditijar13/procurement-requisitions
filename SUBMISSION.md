# Submission

## Links

- **GitHub repository:** https://github.com/Aditijar13/procurement-requisitions
- **Live application:** https://procurement-requisitions.vercel.app

## Notes for the reviewer

The backend is hosted on Render's free tier and may take up to 60 seconds to respond on the first request if the server has gone idle. Please wait for it to wake up before logging in, the page will load once the server is warm.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Requester | priya@demo.com | password123 |
| Requester | rohan@demo.com | password123 |
| Approver (limit ₹75,000) | meera@demo.com | password123 |
| Approver (limit ₹3,00,000) | arjun@demo.com | password123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React 19, React Router, Axios, Recharts, CSS Modules | Component-based UI with scoped styles and a charting library for the dashboard |
| Backend | Node.js, Express 5, JWT, bcryptjs | REST API with async-native error handling in Express 5 |
| Database | MongoDB, Mongoose 9, Decimal128 | Flexible document model suited to the requisition structure; Decimal128 for exact monetary comparisons |
| Hosting | Vercel (frontend), Render (backend) | Free tier, straightforward deployment for separate client and server |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Requester and approver roles, JWT auth, approval limit enforced server-side |
| 2 | Requisitions | Done | Create, edit, archive, restore, extend needed-by on ordered |
| 3 | Line items | Done | Add, edit, remove before submission; server-side total; received qty tracking |
| 4 | Lifecycle | Done | All transitions enforced server-side; partial receipt stays ordered; full receipt closes |
| 5 | Assigned approvers | Done | Manual assignment; any approver can add or remove; full queue visible to all |
| 6 | Finding requisitions | Done | Search, filter by status/department/owner/overdue, sort, paginate — all server-side |
| 7 | Bulk approve and CSV | Done | Toggle mode shows submitted only; per-requisition result modal; CSV export of ordered requisitions |
| 8 | Dashboard | Done | KPI cards, status breakdown, department breakdown, weekly received chart |
| 9 | History | Done | Immutable audit trail; status changes with old/new, receipts with line item detail, comments |
| 10 | Overdue alerts | Done | Alerts page with dismiss; nav badge updates on navigation; re-surfaces when extended date also passes |

## How much time did you actually spend?

Approximately 6 days across 7 sessions — 3 sessions on the backend and 4 on the frontend, documentation, and deployment.

## What would you do next, with another 12 hours?

Add email notifications for status changes and overdue alerts, right now an approver only sees the alert when they log in. Also add automated tests for the approval limit escalation and lifecycle transitions since these have real edge cases that I only tested manually in Thunder Client.

## What are you least happy with in this codebase, and why?

The receiving workflow. Right now when items arrive, the approver opens a form that shows all line items at once and has to fill in quantities for everything before submitting. In practice, items from one order arrive on different days, helmets today, harnesses next week. The current form makes you enter 0 for items that haven't arrived yet, then come back and do it again when they do. A better design would let you update each line item individually as it arrives, right from the line items table, without opening a separate form. The backend already supports this, it accepts partial updates per item, the UI just doesn't expose it that way. That and automated test coverage for the approval limit escalation and alert re-surface logic are the two things I'd fix first.