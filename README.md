# ProcureFlow : Procurement Requisitions Management

A full-stack application for managing purchase requisitions from request through delivery, with role-based approval workflows, overdue tracking, and a full audit trail.

**Live application:** https://procurement-requisitions.vercel.app

---

## Features

### Requisition Management

- Create requisitions with title, vendor, department, and needed-by date
- Add, edit, and remove line items before submission
- Edit draft requisitions
- Submit for approval
- Archive and restore requisitions without losing history or line items
- View active and archived requisitions separately
- Extend the needed-by date on ordered requisitions

### Finding Requisitions

- Text search over title and vendor name
- Filter by status, department, owner, and overdue
- Sort by needed-by date, total amount, or status
- Filter assigned approvers' queue to just their requisitions
- Server-side pagination with total match count

### Approval Workflow

- Submit → Approved or Rejected → Ordered → Received lifecycle
- Approval limit enforced server-side per approver
- Automatic escalation to a higher approver when total exceeds limit
- Rejection requires a reason and returns requisition to draft immediately
- Partial receipt leaves requisition open; full receipt closes it
- Any invalid lifecycle move rejected by the server with an explanation

### Assigned Approvers

- Any number of approvers can be assigned to a requisition
- Any approver can add or remove another approver's eligibility
- Full queue of submitted requisitions visible to all approvers
- Filtered view of requisitions assigned to the current approver

### Bulk Actions

- Select multiple submitted requisitions and approve in one action
- Per-requisition result report — which succeeded and which exceeded the limit
- Export all open commitments (ordered requisitions) as a CSV file

### Dashboard

- Headline KPIs — awaiting approval, value of open commitments, overdue, received this week
- Status breakdown across all requisitions
- Department breakdown
- Requisitions received per week over the last eight weeks

### History

- Immutable audit trail on every requisition
- Records creation, every status change with old and new status, receipts, comments, and approver changes
- Cannot be edited or deleted — no update or delete routes exist for history entries

### Overdue Alerts

- Ordered requisitions past their needed-by date with outstanding quantities appear in an alerts area
- Count badge visible in navigation for approvers
- Per-approver dismissal — each approver's dismissal state is independent
- Alert re-surfaces if the needed-by date is extended and the new date also passes

---

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Axios
- Recharts
- React Hot Toast
- Lucide React
- CSS Modules

### Backend
- Node.js
- Express 5
- MongoDB
- Mongoose 9
- JWT
- bcryptjs

---

## Application Roles

### Requester
- Creates, edits, and submits their own requisitions
- Sees only their own requisitions
- Manages line items on draft requisitions
- Archives and restores their own requisitions
- Leaves comments on their requisitions

### Approver
- Reviews the full queue of submitted requisitions
- Approves or rejects submitted requisitions (within their approval limit)
- Moves approved requisitions to ordered and records receipt
- Extends needed-by date on ordered requisitions
- Adds and removes approver assignments
- Bulk approves and exports CSV
- Dismisses overdue alerts

---

## Project Structure

```text
procurement-requisitions/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/
│       ├── components/
│       │   └── layout/
│       ├── context/
│       └── pages/
│
├── server/                  # Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── seed.js
│
├── docs/                    # Project documentation
│   ├── architecture.md
│   ├── schema.md
│   ├── plan.md
│   ├── decisions.md
│   └── ai-prompts.md
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB, or access to a MongoDB Atlas cluster

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Seed the database with demo data:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and communicates with the Express API at `http://localhost:5000`.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Requester | priya@demo.com | password123 |
| Requester | rohan@demo.com | password123 |
| Approver (limit ₹75,000) | meera@demo.com | password123 |
| Approver (limit ₹3,00,000) | arjun@demo.com | password123 |

---

## Documentation

| File | Contents |
|------|----------|
| `docs/architecture.md` | System architecture, component overview, and request flow |
| `docs/schema.md` | Collections, fields, relationships, and constraints |
| `docs/plan.md` | Development sessions, build order, and time estimates |
| `docs/decisions.md` | Technical decisions with alternatives considered |
| `docs/ai-prompts.md` | AI prompts used during development |

---

## Security

Connection strings, JWT secrets, and all sensitive values are stored in environment variables and are not committed to the repository.